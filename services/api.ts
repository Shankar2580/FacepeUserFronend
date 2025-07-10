import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, FACE_API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import {
  ApiResponse,
  AuthResponse,
  User,
  PaymentMethod,
  Transaction,
  TransactionDetail,
  AutoPay,
  PaymentRequest,
  VerificationRequest,
  VerificationVerifyRequest,
  RegisterRequest,
  LoginRequest,
  CreateAutoPayRequest,
} from '../constants/types';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    console.log('API Service initialized with base URL:', API_BASE_URL);
    
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
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`📍 Full URL: ${config.baseURL}${config.url}`);
        console.log(`📦 Request Data:`, config.data);
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const isNetworkError = error.code === 'NETWORK_ERROR' || !error.response;
        const originalRequest = error.config;
        
        console.error('🔥 API Response Error Details:', {
          url: error.config?.url,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          data: error.response?.data,
          isNetworkError,
          headers: error.response?.headers,
          requestData: error.config?.data
        });
        
        // Handle 401 errors with token refresh
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
            console.log('Token expired, attempting refresh...');
            await this.refreshToken();
            console.log('Token refreshed successfully, retrying original request');
            
            // Process queued requests
            this.processQueue(null);
            
            // Retry original request with new token
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        } else if (isNetworkError) {
          // Network error - don't logout, just log and continue
          console.log('Network error detected, keeping user logged in');
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

      console.log('Making refresh token request...');
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        refresh_token: refreshToken
      });

      const { access_token } = response.data;
      if (access_token) {
        await SecureStore.setItemAsync('access_token', access_token);
        console.log('Access token refreshed and stored');
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Refresh token request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('API Service - Making login request...');
    
    // Retry logic for cold starts
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Login attempt ${attempt}/3...`);
        const response = await this.api.post<AuthResponse>(API_ENDPOINTS.LOGIN, data);
        console.log('API Service - Login response received:', {
          hasToken: !!response.data.access_token,
          hasRefreshToken: !!response.data.refresh_token,
          hasUser: !!response.data.user,
          userEmail: response.data.user?.email
        });
        
        if (response.data.access_token && response.data.refresh_token) {
          console.log('API Service - Storing tokens...');
          await SecureStore.setItemAsync('access_token', response.data.access_token);
          await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
          console.log('API Service - Tokens stored successfully');
        }
        return response.data;
      } catch (error: any) {
        lastError = error;
        const isNetworkError = error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || !error.response;
        
        if (isNetworkError && attempt < 3) {
          console.log(`⏳ Network error on attempt ${attempt}, retrying in ${attempt * 5} seconds... (Render.com might be cold starting)`);
          await new Promise(resolve => setTimeout(resolve, attempt * 5000)); // Wait 5s, then 10s
          continue;
        }
        
        console.error(`❌ Login failed on attempt ${attempt}:`, error);
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
          console.log('Refresh token revoked on server');
        } catch (error) {
          console.warn('Failed to revoke refresh token on server:', error);
          // Continue with local logout even if server logout fails
        }
      }
    } finally {
      // Always clear local tokens
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
      console.log('Local tokens cleared');
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
      console.log('Stored user data updated successfully');
    } catch (error) {
      console.error('Failed to update stored user data:', error);
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
        
        console.log('Local face registration status updated:', {
          old: oldStatus,
          new: hasFaceRegistered,
          user: `${user.first_name} ${user.last_name}`
        });
      }

      // Update the main backend database
      try {
        await this.api.put(API_ENDPOINTS.UPDATE_FACE_STATUS, {
          has_face_registered: hasFaceRegistered
        });
        console.log('Updated main backend face registration status:', hasFaceRegistered);
      } catch (backendError) {
        console.error('Failed to update main backend face status:', backendError);
        throw backendError;
      }
    } catch (error) {
      console.error('Failed to update user face status:', error);
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
    console.log('API Service - Starting face registration...');
    console.log('API Service - Registering face via backend proxy:', `${API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`);
    
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
      
      console.log('API Service - Request details:', {
        url: `${API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`,
        user_id: userId,
        name: name,
        imageUri: imageUri,
        hasAuth: !!authHeader
      });

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

      console.log('API Service - Response status:', response.status);
      console.log('API Service - Face registration successful:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('API Service - Face registration failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`,
      });
      
      // Re-throw with better error handling
      if (error.response?.status === 422) {
        throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
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
    console.log('API Service - Creating Setup Intent...');
    console.log('API Service - Using base URL:', this.api.defaults.baseURL);
    const response = await this.api.post<{ client_secret: string; setup_intent_id: string }>(API_ENDPOINTS.CREATE_SETUP_INTENT);
    console.log('API Service - Setup Intent created successfully:', {
      setup_intent_id: response.data.setup_intent_id,
      client_secret_length: response.data.client_secret?.length || 0
    });
    return response.data;
  }

  async confirmSetupIntent(setupIntentId: string): Promise<{ success: boolean; payment_method: PaymentMethod }> {
    console.log('API Service - Confirming Setup Intent:', setupIntentId);
    console.log('API Service - Confirm URL:', `${this.api.defaults.baseURL}${API_ENDPOINTS.CONFIRM_SETUP_INTENT}/${setupIntentId}`);
    const response = await this.api.post<{ success: boolean; payment_method: PaymentMethod }>(`${API_ENDPOINTS.CONFIRM_SETUP_INTENT}/${setupIntentId}`);
    console.log('API Service - Setup Intent confirmed successfully:', response.data.success);
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
      `${API_ENDPOINTS.DELETE_PAYMENT_METHOD}/${paymentMethodId}`
    );
    return response.data;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const response = await this.api.get<Transaction[]>(API_ENDPOINTS.GET_TRANSACTIONS);
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
    console.log('API Service - Requesting password reset for:', phoneNumber);
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.FORGOT_PASSWORD_REQUEST, {
      phone_number: phoneNumber
    });
    return response.data;
  }

  async verifyPasswordReset(data: {
    phone_number: string;
    verification_code: string;
    new_password: string;
  }): Promise<ApiResponse<any>> {
    console.log('API Service - Verifying password reset for:', data.phone_number);
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.FORGOT_PASSWORD_VERIFY, data);
    return response.data;
  }
}

export const apiService = new ApiService();