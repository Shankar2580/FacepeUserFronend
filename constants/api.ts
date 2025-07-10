// For development, use localhost when testing on web or simulator
// Use your computer's IP address when testing on physical device
const API_BASE_URL = 'http://10.238.184.2:80'; // Updated to Wi-Fi IP for Expo Go

// FACE_API_BASE_URL is no longer directly used as Face API requests also go through Nginx.
// However, keeping it defined for consistency or if you have other uses for it.
const FACE_API_BASE_URL = 'http://10.238.184.2';

export { API_BASE_URL, FACE_API_BASE_URL };

export const API_ENDPOINTS = {
  // Authentication (routed through /customer/)
  REGISTER: '/customer/auth/register-frontend',
  LOGIN: '/customer/auth/login',
  VERIFY_TOKEN: '/customer/auth/verify-token',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD_REQUEST: '/auth/forgot-password/request',
  FORGOT_PASSWORD_VERIFY: '/auth/forgot-password/verify',
  
  // Verification (routed through /customer/)
  SEND_VERIFICATION: '/customer/verification/send-phone-code',
  VERIFY_CODE: '/customer/verification/verify-phone-code',
  
  // Users (routed through /customer/)
  GET_PROFILE: '/customer/users/me',
  UPDATE_PROFILE: '/customer/users/me',
  UPDATE_PUSH_TOKEN: '/customer/users/me/push-token',
  GET_FACE_STATUS: '/customer/users/me/face-status',
  UPDATE_FACE_STATUS: '/customer/users/me/face-status',
  DELETE_FACE_ENROLLMENT: '/customer/users/me/face-enrollment',
  
  // Face Registration (routed through /face/)
  // Note the double '/face/' here is correct based on your Nginx configuration,
  // where Nginx routes /face/ and the face service itself expects a '/face/' prefix.
  REGISTER_FACE: '/face/register',
  
  // Payment Methods (routed through /customer/)
  GET_PAYMENT_METHODS: '/customer/users/me/payment-methods',
  ADD_PAYMENT_METHOD: '/customer/users/me/payment-methods',
  UPDATE_PAYMENT_METHOD: '/customer/users/me/payment-methods',
  DELETE_PAYMENT_METHOD: '/customer/users/me/payment-methods',
  SET_DEFAULT_PAYMENT_METHOD: '/customer/users/me/payment-methods',
  CREATE_SETUP_INTENT: '/customer/users/me/payment-methods/setup-intent',
  CONFIRM_SETUP_INTENT: '/customer/users/me/payment-methods/confirm-setup-intent',
  ADD_PAYMENT_METHOD_SECURE: '/customer/users/me/payment-methods/secure',
  
  // Auto Pay (routed through /customer/)
  GET_AUTO_PAY: '/customer/users/me/autopay',
  ADD_AUTO_PAY: '/customer/users/me/autopay',
  UPDATE_AUTO_PAY: '/customer/users/me/autopay',
  DELETE_AUTO_PAY: '/customer/users/me/autopay',
  
  // Transactions (routed through /customer/)
  GET_TRANSACTIONS: '/customer/users/me/transactions',
  
  // Payments (routed through /customer/)
  CREATE_PAYMENT: '/customer/users/me/payments',
  APPROVE_PAYMENT: '/customer/users/me/payments', // /{request_id}/approve
  DECLINE_PAYMENT: '/customer/users/me/payments', // /{request_id}/decline
  
  // Payment Requests (routed through /customer/)
  GET_PAYMENT_REQUESTS: '/customer/users/me/payment-requests/',
};