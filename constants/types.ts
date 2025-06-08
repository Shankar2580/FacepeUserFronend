export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  is_verified?: boolean;
  has_face_registered: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  card_last_four: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method_id: string;
  stripe_payment_intent_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AutoPay {
  id: string;
  user_id: string;
  merchant_name: string;
  is_enabled: boolean;
  max_amount?: number;
  payment_method_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  merchant_name: string;
  merchant_id: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  message: string;
  error?: string;
  status_code?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface VerificationRequest {
  phone_number: string;
  method: 'sms' | 'call';
}

export interface VerificationVerifyRequest {
  phone_number: string;
  code: string;
}

export interface RegisterRequest {
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  verification_code: string;
}

export interface LoginRequest {
  username: string; // phone number or email
  password: string;
}

export interface FaceRegistrationRequest {
  user_id: string;
  name: string;
  file: File | Blob;
}

export interface FaceRegistrationResponse {
  message: string;
  user_id: string;
  name: string;
  embedding_id: string;
} 