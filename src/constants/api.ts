import { API_CONFIG } from './config';

// Using hosted backend API from environment configuration
const API_BASE_URL = API_CONFIG.BASE_URL;
const FACE_API_BASE_URL = API_CONFIG.FACE_API_BASE_URL;

export { API_BASE_URL, FACE_API_BASE_URL };

export const API_ENDPOINTS = {
  // Authentication (routed through /cb/)
  REGISTER: '/cb/auth/register-frontend',
  LOGIN: '/cb/auth/login',
  REFRESH_TOKEN: '/cb/auth/refresh',
  LOGOUT: '/cb/auth/logout',
  FORGOT_PASSWORD_REQUEST: '/cb/auth/forgot-password/request',
  FORGOT_PASSWORD_VERIFY: '/cb/auth/forgot-password/verify',
  PIN_RESET: '/cb/auth/pin-reset',
  
  // Verification (routed through /cb/)
  SEND_VERIFICATION: '/cb/verification/send-phone-code',
  VERIFY_CODE: '/cb/verification/verify-phone-code',
  
  // Users (routed through /cb/)
  GET_PROFILE: '/cb/users/me',
  UPDATE_PROFILE: '/cb/users/me',
  UPDATE_PUSH_TOKEN: '/cb/users/me/push-token',
  GET_FACE_STATUS: '/cb/users/me/face-status',
  UPDATE_FACE_STATUS: '/cb/users/me/face-status',
  DELETE_FACE_ENROLLMENT: '/cb/users/me/face-enrollment',
  
  // Face Registration (routed through /cb/)
  REGISTER_FACE: '/cb/face/register',
  UPDATE_FACE: '/cb/face/update',
  DELETE_FACE: '/cb/face/delete',
  
  // Payment Methods (routed through /cb/)
  GET_PAYMENT_METHODS: '/cb/users/me/payment-methods',
  ADD_PAYMENT_METHOD: '/cb/users/me/payment-methods',
  UPDATE_PAYMENT_METHOD: '/cb/users/me/payment-methods',
  DELETE_PAYMENT_METHOD: '/cb/users/me/payment-methods',
  SET_DEFAULT_PAYMENT_METHOD: '/cb/users/me/payment-methods',
  CREATE_SETUP_INTENT: '/cb/users/me/payment-methods/setup-intent',
  CONFIRM_SETUP_INTENT: '/cb/users/me/payment-methods/confirm-setup-intent',
  ADD_PAYMENT_METHOD_SECURE: '/cb/users/me/payment-methods/secure',
  
  // Auto Pay (routed through /cb/)
  GET_AUTO_PAY: '/cb/users/me/autopay',
  ADD_AUTO_PAY: '/cb/users/me/autopay',
  UPDATE_AUTO_PAY: '/cb/users/me/autopay',
  DELETE_AUTO_PAY: '/cb/users/me/autopay',
  
  // Transactions (routed through /cb/)
  GET_TRANSACTIONS: '/cb/users/me/transactions',
  
  // Payments (routed through /cb/)
  CREATE_PAYMENT: '/cb/users/me/payments',
  APPROVE_PAYMENT: '/cb/users/me/payments', // /{request_id}/approve
  DECLINE_PAYMENT: '/cb/users/me/payments', // /{request_id}/decline
  
  // Payment Requests (routed through /cb/)
  GET_PAYMENT_REQUESTS: '/cb/users/me/payment-requests/',
};