import Constants from 'expo-constants';

// Environment variable helper
const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[name] || process.env[name] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue || '';
};

// App Configuration
export const APP_CONFIG = {
  ENV: getEnvVar('APP_ENV', 'development'),
  VERSION: getEnvVar('APP_VERSION', '1.0.0'),
  IS_DEV: getEnvVar('APP_ENV', 'development') === 'development',
  IS_PROD: getEnvVar('APP_ENV', 'development') === 'production',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: getEnvVar('API_BASE_URL', 'https://api.dev.facepe.ai'),
  FACE_API_BASE_URL: getEnvVar('FACE_API_BASE_URL', 'https://api.dev.facepe.ai'),
  TIMEOUT: 30000, // 30 seconds
} as const;

// Stripe Configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  MERCHANT_DISPLAY_NAME: getEnvVar('STRIPE_MERCHANT_DISPLAY_NAME', 'PayByFaeAi'),
  COUNTRY_CODE: getEnvVar('STRIPE_COUNTRY_CODE', 'US'),
  CURRENCY: getEnvVar('STRIPE_CURRENCY', 'usd'),
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  FACE_RECOGNITION: getEnvVar('ENABLE_FACE_RECOGNITION', 'true') === 'true',
  AUTO_PAY: getEnvVar('ENABLE_AUTO_PAY', 'true') === 'true',
  PUSH_NOTIFICATIONS: getEnvVar('ENABLE_PUSH_NOTIFICATIONS', 'true') === 'true',
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
  ENABLE_LOGS: APP_CONFIG.IS_DEV && getEnvVar('ENABLE_DEBUG_LOGS', 'true') === 'true',
  ENABLE_REDUX_DEVTOOLS: APP_CONFIG.IS_DEV && getEnvVar('ENABLE_REDUX_DEVTOOLS', 'false') === 'true',
} as const;

// Validation
if (APP_CONFIG.IS_PROD && !STRIPE_CONFIG.PUBLISHABLE_KEY.startsWith('pk_live_')) {

}

export default {
  APP_CONFIG,
  API_CONFIG,
  STRIPE_CONFIG,
  FEATURE_FLAGS,
  DEBUG_CONFIG,
};
