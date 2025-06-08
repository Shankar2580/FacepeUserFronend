import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, FACE_API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import {
  ApiResponse,
  AuthResponse,
  User,
  PaymentMethod,
  Transaction,
  AutoPay,
  PaymentRequest,
  VerificationRequest,
  VerificationVerifyRequest,
  RegisterRequest,
  LoginRequest,
} from '../constants/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    console.log('API Service initialized with base URL:', API_BASE_URL);
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const isNetworkError = error.code === 'NETWORK_ERROR' || !error.response;
        
        console.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
          isNetworkError
        });
        
        if (error.response?.status === 401) {
          // Token expired, logout user
          console.log('Token expired, logging out user');
          await this.logout();
        } else if (isNetworkError) {
          // Network error - don't logout, just log and continue
          console.log('Network error detected, keeping user logged in');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('API Service - Making login request...');
    const response = await this.api.post<AuthResponse>(API_ENDPOINTS.LOGIN, data);
    console.log('API Service - Login response received:', {
      hasToken: !!response.data.access_token,
      hasUser: !!response.data.user,
      userEmail: response.data.user?.email
    });
    
    if (response.data.access_token) {
      console.log('API Service - Storing tokens...');
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
      console.log('API Service - Tokens stored successfully');
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
    if (response.data.access_token) {
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_data');
  }

  async getStoredUser(): Promise<User | null> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
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
        await this.api.put('/users/me/face-status', {
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
    console.log('Face API URL:', `${FACE_API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`);
    
    try {
      // Create FormData for React Native
      const formData = new FormData();
      
      // Add text fields
      formData.append('user_id', userId);
      formData.append('name', name);
      
      // Add file - React Native specific format
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Get authorization header
      const authHeader = await this.getAuthHeader();
      
      console.log('API Service - Request details:', {
        url: `${FACE_API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`,
        user_id: userId,
        name: name,
        imageUri: imageUri,
        hasAuth: !!authHeader
      });

      // Make request without setting Content-Type (let React Native handle it)
      const response = await fetch(`${FACE_API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`, {
        method: 'POST',
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          // Don't set Content-Type - let fetch handle multipart boundary
        },
        body: formData,
      });

      console.log('API Service - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Service - Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('API Service - Face registration successful:', responseData);
      return responseData;
      
    } catch (error: any) {
      console.error('API Service - Face registration failed:', {
        message: error.message,
        stack: error.stack,
        url: `${FACE_API_BASE_URL}${API_ENDPOINTS.REGISTER_FACE}`,
      });
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
    const response = await this.api.post<{ client_secret: string; setup_intent_id: string }>('/users/me/payment-methods/setup-intent');
    console.log('API Service - Setup Intent created successfully:', response.data.setup_intent_id);
    return response.data;
  }

  async confirmSetupIntent(setupIntentId: string): Promise<{ success: boolean; payment_method: PaymentMethod }> {
    console.log('API Service - Confirming Setup Intent:', setupIntentId);
    const response = await this.api.post<{ success: boolean; payment_method: PaymentMethod }>(`/users/me/payment-methods/confirm-setup-intent/${setupIntentId}`);
    console.log('API Service - Setup Intent confirmed successfully');
    return response.data;
  }

  async addPaymentMethodSecure(data: {
    stripe_payment_method_id: string;
    is_default?: boolean;
  }): Promise<PaymentMethod> {
    const response = await this.api.post<PaymentMethod>('/users/me/payment-methods/secure', {
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

  async addAutoPay(data: {
    merchant_name: string;
    payment_method_id: string;
    max_amount?: number;
  }): Promise<AutoPay> {
    const response = await this.api.post<AutoPay>(API_ENDPOINTS.ADD_AUTO_PAY, data);
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
}

export const apiService = new ApiService(); 