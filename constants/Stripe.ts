export const STRIPE_CONFIG = {
  // Replace with your Stripe publishable key
  PUBLISHABLE_KEY: 'pk_test_51RV2FNPSTCb7l9BW9VZanPBOOHxbtKkhrxp2iJNQhRa49RpBCKhkKdKTpU65LfG6yDyPad3IxsaCUwxwX5OI87W500aAed39G4', // You need to replace this with your actual key
  
  // API Base URL - replace with your backend URL
  API_BASE_URL: 'http://192.168.112.2:8000', // You need to replace this with your actual backend URL
  
  // Merchant display name
  MERCHANT_DISPLAY_NAME: 'PayByFaeAi',
  
  // Country code
  COUNTRY_CODE: 'US',
  
  // Currency
  CURRENCY: 'usd',
} as const;

export const STRIPE_ENDPOINTS = {
  CREATE_SETUP_INTENT: '/users/me/payment-methods/setup-intent',
  CONFIRM_SETUP_INTENT: '/users/me/payment-methods/confirm-setup-intent',
  GET_PAYMENT_METHODS: '/users/me/payment-methods',
  DELETE_PAYMENT_METHOD: '/users/me/payment-methods',
  ADD_PAYMENT_METHOD_SECURE: '/users/me/payment-methods/secure',
} as const; 