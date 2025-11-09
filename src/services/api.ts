import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, FACE_API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import {
  ApiResponse,
  AuthResponse,
  User,
  PaymentMethod,
  Transaction,
  TransactionListResponse,
  TransactionDetail,
  AutoPay,
  VerificationRequest,
  VerificationVerifyRequest,
  RegisterRequest,
  LoginRequest,
  CreateAutoPayRequest,
  PinResetRequest,
  PinResetResponse,
} from '../constants/types';
import type { PaymentRequest } from '../constants/types';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    // console.log removed for production
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        // console.log removed for production} ${config.baseURL}${config.url}`);
        // console.log removed for production
        // console.log removed for production
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        // console.error removed for production
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // console.log removed for production
        return response;
      },
      async (error) => {
        const isNetworkError = error.code === 'NETWORK_ERROR' || !error.response;
        const originalRequest = error.config;
        
        // console.error removed for production
        
        // Skip token refresh for authentication endpoints completely
        const isAuthEndpoint = originalRequest.url?.includes('/cb/auth/login') || 
                              originalRequest.url?.includes('/cb/auth/register') ||
                              originalRequest.url?.includes('/cb/auth/refresh') ||
                              originalRequest.url?.includes('/auth/login') ||
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/refresh');
        
        // For auth endpoints, just pass through the error without any token refresh logic
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }
        
        // Handle 401 errors with token refresh (only for non-auth endpoints)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // console.log removed for production
            await this.refreshToken();
            // console.log removed for production
            
            // Process queued requests
            this.processQueue(null);
            
            // Retry original request with new token
            return this.api(originalRequest);
          } catch (refreshError) {
            // console.error removed for production
            this.processQueue(refreshError);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        } else if (isNetworkError) {
          // Network error - don't logout, just log and continue
          // console.log removed for production
        }
        
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // console.log removed for production
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        refresh_token: refreshToken
      });

      const { access_token } = response.data;
      if (access_token) {
        await SecureStore.setItemAsync('access_token', access_token);
        // console.log removed for production
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    // console.log removed for production
    
    // Retry logic for cold starts
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
      // console.log removed for production
      const response = await this.api.post<AuthResponse>(API_ENDPOINTS.LOGIN, data);
      // console.log removed for production

      if (response.data.access_token && response.data.refresh_token) {
        // console.log removed for production
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
        // console.log removed for production
        return response.data;
      } else {
        // If no tokens received, treat as authentication failure
        throw new Error('Invalid credentials. Please check your email/phone number and password.');
      }
      } catch (error: any) {
        lastError = error;
        const isNetworkError = error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || !error.response;

        if (isNetworkError && attempt < 3) {
          // console.log removed for production`);
          await new Promise(resolve => setTimeout(resolve, attempt * 5000)); // Wait 5s, then 10s
          continue;
        }

        // For auth errors, extract the message and throw a new error with the backend message
        if (error.response?.status === 401 && error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }

        // console.error removed for production
        break;
      }
    }
    
    throw lastError;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    if (response.data.access_token && response.data.refresh_token) {
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      // Try to revoke refresh token on server
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        try {
          await this.api.post(API_ENDPOINTS.LOGOUT, { refresh_token: refreshToken });
          // console.log removed for production
        } catch (error) {
          // console.warn removed for production
          // Continue with local logout even if server logout fails
        }
      }
    } finally {
      // Always clear local tokens
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
      // console.log removed for production
    }
  }

  async getStoredUser(): Promise<User | null> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async getStoredToken(tokenType: 'access_token' | 'refresh_token'): Promise<string | null> {
    return await SecureStore.getItemAsync(tokenType);
  }

  async updateStoredUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
    }
  }

  async updateUserFaceStatus(hasFaceRegistered: boolean): Promise<void> {
    try {
      // Update local storage for immediate UI feedback
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        const oldStatus = user.has_face_registered;
        user.has_face_registered = hasFaceRegistered;
        await SecureStore.setItemAsync('user_data', JSON.stringify(user));
        
        // console.log removed for production
      }

      // Update the main backend database
      try {
        await this.api.put(API_ENDPOINTS.UPDATE_FACE_STATUS, {
          has_face_registered: hasFaceRegistered
        });
        // console.log removed for production
      } catch (backendError) {
        // console.error removed for production
        throw backendError;
      }
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  }

  // Verification
  async sendVerification(data: VerificationRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.SEND_VERIFICATION, {
      phone_number: data.phone_number
    });
    return response.data;
  }

  async verifyCode(data: VerificationVerifyRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.VERIFY_CODE, {
      phone_number: data.phone_number,
      code: data.code
    });
    return response.data;
  }

  // User Profile
  async getProfile(): Promise<User> {
    const response = await this.api.get<User>(API_ENDPOINTS.GET_PROFILE);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>(API_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  }

  async updatePushToken(pushToken: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.UPDATE_PUSH_TOKEN, {
      push_token: pushToken,
    });
    return response.data;
  }

  async getFaceStatus(): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(API_ENDPOINTS.GET_FACE_STATUS);
    return response.data;
  }

  async deleteFaceEnrollment(): Promise<ApiResponse<any>> {
    const response = await this.api.delete<ApiResponse<any>>(API_ENDPOINTS.DELETE_FACE_ENROLLMENT);
    return response.data;
  }

  async registerFace(userId: string, name: string, imageUri: string): Promise<any> {
    // console.log removed for production
    // console.log removed for production
    
    try {
      // Create FormData for React Native
      const formData = new FormData();
      
      // Add text fields
      formData.append('user_id', userId);
      formData.append('name', name);
      
      // Add file - React Native specific format
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Fix: Use proper React Native FormData format
      formData.append('file', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Get authorization header
      const authHeader = await this.getAuthHeader();
      
      // console.log removed for production

      // Use axios instead of fetch for better FormData handling
      const response = await axios({
        method: 'POST',
        url: `${API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`,
        data: formData,
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      // console.log removed for production
      // console.log removed for production
      return response.data;
      
    } catch (error: any) {
      // console.error removed for production
      
      // Re-throw with better error handling
      if (error.response?.status === 422) {
        // Extract the actual detail message from nested error structure
        const responseData = error.response.data;
        let errorDetail = 'Face registration failed. Please try again.';
        
        if (responseData?.error?.detail) {
          errorDetail = responseData.error.detail;
        } else if (responseData?.detail) {
          errorDetail = responseData.detail;
        } else if (responseData?.message) {
          errorDetail = responseData.message;
        }
        
        throw new Error(errorDetail);
      }
      throw error;
    }
  }

  async updateFace(userId: string, name: string, imageUri: string, pin: string): Promise<any> {
    // console.log removed for production
    // console.log removed for production
    
    try {
      // Create FormData for React Native
      const formData = new FormData();
      
      // Add text fields
      formData.append('user_id', userId);
      formData.append('name', name);
      formData.append('pin', pin); // PIN is required by backend for update endpoint
      
      // Add file - React Native specific format
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Fix: Use proper React Native FormData format
      formData.append('file', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Get authorization header
      const authHeader = await this.getAuthHeader();
      
      console.log('📡 About to call updateFace API:');
      console.log('URL:', `${API_BASE_URL}${API_ENDPOINTS.UPDATE_FACE}`);
      console.log('Method: PUT');
      console.log('Has Auth Header:', !!authHeader);
      console.log('User ID:', userId);
      console.log('Name:', name);
      console.log('Has PIN:', !!pin);
      console.log('Image URI:', imageUri.substring(0, 50) + '...');

      // Use axios instead of fetch for better FormData handling
      const response = await axios({
        method: 'PUT',
        url: `${API_BASE_URL}${API_ENDPOINTS.UPDATE_FACE}`,
        data: formData,
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      
      console.log('✅ updateFace API call successful!');
      console.log('Response:', response.data);

      // console.log removed for production
      // console.log removed for production
      return response.data;
      
    } catch (error: any) {
      console.error('❌ updateFace API Error:');
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error code:', error.code);
      console.error('Has response:', !!error.response);
      console.error('Status:', error.response?.status);
      console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error message:', error.message);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      
      // Check for network errors first
      if (!error.response) {
        console.error('🔴 NETWORK ERROR: No response from server');
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          throw new Error('Network error. Cannot reach the face update server.');
        } else {
          throw new Error(`Connection failed: ${error.message}`);
        }
      }
      
      // Re-throw with better error handling
      if (error.response?.status === 422) {
        // Extract the actual detail message from nested error structure
        const responseData = error.response.data;
        let errorDetail = 'Face update failed. Please try again.';
        
        if (responseData?.error?.detail) {
          errorDetail = responseData.error.detail;
          console.error('422 Error detail (nested):', errorDetail);
        } else if (responseData?.detail) {
          errorDetail = responseData.detail;
          console.error('422 Error detail:', errorDetail);
        } else if (responseData?.message) {
          errorDetail = responseData.message;
          console.error('422 Error message:', errorDetail);
        }
        
        console.error('🔴 Throwing 422 error:', errorDetail);
        throw new Error(errorDetail);
      }
      
      console.error('🔴 Re-throwing original error');
      throw error;
    }
  }

  async deleteFace(): Promise<any> {
    // console.log removed for production
    // console.log removed for production
    
    try {
      // Get authorization header
      const authHeader = await this.getAuthHeader();
      
      // console.log removed for production

      // Use axios for DELETE request
      const response = await axios({
        method: 'DELETE',
        url: `${API_BASE_URL}${API_ENDPOINTS.DELETE_FACE}`,
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        timeout: 60000,
      });

      // console.log removed for production
      // console.log removed for production
      return response.data;
      
    } catch (error: any) {
      // console.error removed for production
      
      // Re-throw with better error handling
      if (error.response?.status === 422) {
        // Extract the actual detail message from nested error structure
        const responseData = error.response.data;
        let errorDetail = 'Face deletion failed. Please try again.';
        
        if (responseData?.error?.detail) {
          errorDetail = responseData.error.detail;
        } else if (responseData?.detail) {
          errorDetail = responseData.detail;
        } else if (responseData?.message) {
          errorDetail = responseData.message;
        }
        
        throw new Error(errorDetail);
      }
      throw error;
    }
  }

  private async getAuthHeader(): Promise<string | null> {
    const token = await SecureStore.getItemAsync('access_token');
    return token ? `Bearer ${token}` : null;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.api.get<PaymentMethod[]>(API_ENDPOINTS.GET_PAYMENT_METHODS);
    return response.data;
  }

  async addPaymentMethod(paymentMethodData: {
    stripe_payment_method_id: string;
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
    is_default?: boolean;
  }): Promise<PaymentMethod> {
    const response = await this.api.post<PaymentMethod>(API_ENDPOINTS.ADD_PAYMENT_METHOD, {
      stripe_payment_method_id: paymentMethodData.stripe_payment_method_id,
      last4: paymentMethodData.last4,
      brand: paymentMethodData.brand,
      exp_month: paymentMethodData.exp_month,
      exp_year: paymentMethodData.exp_year,
      is_default: paymentMethodData.is_default || false,
    });
    return response.data;
  }

  async createSetupIntent(): Promise<{ client_secret: string; setup_intent_id: string }> {
    // console.log removed for production
    // console.log removed for production
    const response = await this.api.post<{ client_secret: string; setup_intent_id: string }>(API_ENDPOINTS.CREATE_SETUP_INTENT);
    // console.log removed for production
    return response.data;
  }

  async confirmSetupIntent(setupIntentId: string): Promise<{ success: boolean; payment_method: PaymentMethod }> {
    // console.log removed for production
    // console.log removed for production
    const response = await this.api.post<{ success: boolean; payment_method: PaymentMethod }>(`${API_ENDPOINTS.CONFIRM_SETUP_INTENT}/${setupIntentId}`);
    // console.log removed for production
    return response.data;
  }

  async addPaymentMethodSecure(data: {
    stripe_payment_method_id: string;
    is_default?: boolean;
  }): Promise<PaymentMethod> {
    const response = await this.api.post<PaymentMethod>(API_ENDPOINTS.ADD_PAYMENT_METHOD_SECURE, {
      stripe_payment_method_id: data.stripe_payment_method_id,
      is_default: data.is_default || false,
    });
    return response.data;
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(
      `${API_ENDPOINTS.SET_DEFAULT_PAYMENT_METHOD}/${paymentMethodId}`,
      { is_default: true }
    );
    return response.data;
  }

  async updatePaymentMethod(paymentMethodId: string, data: { is_default: boolean }): Promise<PaymentMethod> {
    const response = await this.api.put<PaymentMethod>(
      `${API_ENDPOINTS.UPDATE_PAYMENT_METHOD}/${paymentMethodId}`,
      data
    );
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete<ApiResponse<any>>(
      `${API_ENDPOINTS.DELETE_PAYMENT_METHOD}?payment_method_id=${paymentMethodId}`
    );
    return response.data;
  }

  // Transactions
  async getTransactions(params?: {
    status_filter?: string;
    time_filter?: string;
    cursor?: string;
    limit?: number;
  }): Promise<TransactionListResponse> {
    const response = await this.api.get<TransactionListResponse>(API_ENDPOINTS.GET_TRANSACTIONS, { params });
    return response.data;
  }

  async getTransactionDetail(transactionId: string): Promise<TransactionDetail> {
    const response = await this.api.get<TransactionDetail>(`${API_ENDPOINTS.GET_TRANSACTIONS}/${transactionId}`);
    return response.data;
  }

  async createPayment(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.CREATE_PAYMENT, data);
    return response.data;
  }

  async approvePayment(requestId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(`${API_ENDPOINTS.APPROVE_PAYMENT}/${requestId}/approve`);
    return response.data;
  }

  async declinePayment(requestId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(`${API_ENDPOINTS.DECLINE_PAYMENT}/${requestId}/decline`);
    return response.data;
  }

  // Payment Requests
  async getPaymentRequests(): Promise<PaymentRequest[]> {
    const response = await this.api.get<PaymentRequest[]>(API_ENDPOINTS.GET_PAYMENT_REQUESTS);
    return response.data;
  }

  // Auto Pay
  async getAutoPay(): Promise<AutoPay[]> {
    const response = await this.api.get<AutoPay[]>(API_ENDPOINTS.GET_AUTO_PAY);
    return response.data;
  }

  async addAutoPay(data: CreateAutoPayRequest): Promise<AutoPay> {
    const autoPayData = {
      merchant_id: data.merchant_id,
      merchant_name: data.merchant_name,
      payment_method_id: data.payment_method_id,
      max_amount: data.max_amount,
      is_enabled: true
    };
    const response = await this.api.post<AutoPay>(API_ENDPOINTS.ADD_AUTO_PAY, autoPayData);
    return response.data;
  }

  async updateAutoPay(autoPayId: string, data: {
    is_enabled?: boolean;
    max_amount?: number;
  }): Promise<AutoPay> {
    const response = await this.api.put<AutoPay>(`${API_ENDPOINTS.UPDATE_AUTO_PAY}/${autoPayId}`, data);
    return response.data;
  }

  async deleteAutoPay(merchantId: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete<ApiResponse<any>>(`${API_ENDPOINTS.DELETE_AUTO_PAY}/${merchantId}`);
    return response.data;
  }

  // Password Reset methods
  async requestPasswordReset(phoneNumber: string): Promise<ApiResponse<any>> {
    // console.log removed for production
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.FORGOT_PASSWORD_REQUEST, {
      phone_number: phoneNumber
    });
    return response.data;
  }

  async verifyPasswordReset(data: {
    phone_number: string;
    verification_code: string;
    password_reset: {
        new_password: string;
    };
  }): Promise<ApiResponse<any>> {
    // console.log removed for production
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.FORGOT_PASSWORD_VERIFY, {
      phone_number: data.phone_number,
      verification_code: data.verification_code,
      password_reset: {
        new_password: data.password_reset.new_password
      }
    });
    return response.data;
  }

  async resetPin(data: PinResetRequest): Promise<PinResetResponse> {
    // console.log removed for production
    const response = await this.api.post<PinResetResponse>(API_ENDPOINTS.PIN_RESET, data);
    return response.data;
  }

  async verifyCurrentPin(pin: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.VERIFY_CURRENT_PIN,
      { pin }
    );
    return response.data;
  }

  // Account Deletion
  async requestAccountDeletion(): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.REQUEST_ACCOUNT_DELETION);
    return response.data;
  }

  async cancelAccountDeletion(): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.CANCEL_ACCOUNT_DELETION);
    return response.data;
  }

  // Profile Name Update
  async updateUserName(fullName: string): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(API_ENDPOINTS.UPDATE_USER_NAME, {
      full_name: fullName
    });
    return response.data;
  }
}

export const apiService = new ApiService();