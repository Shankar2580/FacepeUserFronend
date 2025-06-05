// For development, use localhost when testing on web or simulator
// Use your computer's IP address when testing on physical device
const API_BASE_URL =
//  __DEV__ ?
      'http://192.168.112.2:8000'  // Use localhost for local development
  // : 'https://your-production-api.com'; // Replace with your production URL

export { API_BASE_URL };

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
  UPLOAD_FACE: '/users/me/face-enrollment', // This endpoint needs to be implemented in backend
  GET_FACE_STATUS: '/users/me/face-status',
  DELETE_FACE_ENROLLMENT: '/users/me/face-enrollment',
  
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
}; 