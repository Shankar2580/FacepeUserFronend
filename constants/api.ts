// For development, use localhost when testing on web or simulator
// Use your computer's IP address when testing on physical device
const API_BASE_URL =
//  __DEV__ ?
      'http://192.168.148.2:8000'  // Main API on port 8000
  // : 'https://your-production-api.com'; // Replace with your production URL

// Face registration API runs on port 8001
const FACE_API_BASE_URL = 'http://192.168.148.2:8001';

export { API_BASE_URL, FACE_API_BASE_URL };

export const API_ENDPOINTS = {
  // Authentication
  REGISTER: '/auth/register-frontend',
  LOGIN: '/auth/login',
  VERIFY_TOKEN: '/auth/verify-token',
  
  // Verification
  SEND_VERIFICATION: '/verification/send-phone-code',
  VERIFY_CODE: '/verification/verify-phone-code',
  
  // Users
  GET_PROFILE: '/users/me',
  UPDATE_PROFILE: '/users/me',
  GET_FACE_STATUS: '/users/me/face-status',
  UPDATE_FACE_STATUS: '/users/me/face-status',
  DELETE_FACE_ENROLLMENT: '/users/me/face-enrollment',
  
  // Face Registration
  REGISTER_FACE: '/register',
  
  // Payment Methods
  GET_PAYMENT_METHODS: '/users/me/payment-methods',
  ADD_PAYMENT_METHOD: '/users/me/payment-methods',
  UPDATE_PAYMENT_METHOD: '/users/me/payment-methods',
  DELETE_PAYMENT_METHOD: '/users/me/payment-methods',
  SET_DEFAULT_PAYMENT_METHOD: '/users/me/payment-methods',
  
  // Auto Pay
  GET_AUTO_PAY: '/users/me/auto-pay',
  ADD_AUTO_PAY: '/users/me/auto-pay',
  UPDATE_AUTO_PAY: '/users/me/auto-pay',
  DELETE_AUTO_PAY: '/users/me/auto-pay',
  
  // Payments
  GET_TRANSACTIONS: '/users/me/payments',
  CREATE_PAYMENT: '/users/me/payments',
  APPROVE_PAYMENT: '/users/me/payments', // /{request_id}/approve
  DECLINE_PAYMENT: '/users/me/payments', // /{request_id}/decline
  
  // Payment Requests
  GET_PAYMENT_REQUESTS: '/users/me/payment-requests',
}; 