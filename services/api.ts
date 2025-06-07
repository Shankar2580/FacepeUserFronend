import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import {
  ApiResponse,
  AuthResponse,
  User,
  PaymentMethod,
  Transaction,
  AutoPay,
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
        console.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          // Token expired, logout user
          console.log('Token expired, logging out user');
          await this.logout();
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

  async uploadFace(imageData: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(API_ENDPOINTS.UPLOAD_FACE, {
      face_image: imageData,
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