import { STRIPE_CONFIG as ENV_STRIPE_CONFIG, API_CONFIG } from './config';

export const STRIPE_CONFIG = {
  // Replace with your Stripe publishable key
  PUBLISHABLE_KEY: ENV_STRIPE_CONFIG.PUBLISHABLE_KEY, // You need to replace this with your actual key
  
  // API Base URL - replace with your backend URL
  
  API_BASE_URL: API_CONFIG.BASE_URL, // Match the main API URL
  
  // Merchant display name
  MERCHANT_DISPLAY_NAME: ENV_STRIPE_CONFIG.MERCHANT_DISPLAY_NAME,
  
  // Country code
  COUNTRY_CODE: ENV_STRIPE_CONFIG.COUNTRY_CODE,
  
  // Currency
  CURRENCY: ENV_STRIPE_CONFIG.CURRENCY,
} as const;

export const STRIPE_ENDPOINTS = {
  CREATE_SETUP_INTENT: '/customer/users/me/payment-methods/setup-intent',
  CONFIRM_SETUP_INTENT: '/customer/users/me/payment-methods/confirm-setup-intent',
  GET_PAYMENT_METHODS: '/customer/users/me/payment-methods',
  DELETE_PAYMENT_METHOD: '/customer/users/me/payment-methods',
  ADD_PAYMENT_METHOD_SECURE: '/customer/users/me/payment-methods/secure',
} as const; 
