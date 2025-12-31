/**
 * Centralized Error Handler Utility
 * 
 * Converts technical API errors into user-friendly messages.
 * Use this to ensure users never see status codes or raw error data.
 * 
 * Usage:
 * import { formatApiError, getErrorMessage } from '@/utils/errorHandler';
 * 
 * try {
 *   await apiCall();
 * } catch (error) {
 *   showAlert('Error', formatApiError(error));
 * }
 */

// ============================================
// Types
// ============================================
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      detail?: string;
      error?: string;
      errors?: string[] | Record<string, string[]>;
    };
  };
  message?: string;
  code?: string;
}

// ============================================
// User-Friendly Error Messages by Status Code
// ============================================
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timed out. Please try again.',
  409: 'This action conflicts with an existing resource.',
  422: 'Invalid data provided. Please check your input.',
  423: 'Your account is temporarily locked. Please try again later.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Server is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'Request timed out. Please check your connection and try again.',
};

// ============================================
// Context-Specific Error Messages
// ============================================
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
  auth: {
    401: 'Incorrect credentials. Please check your phone number/email and password.',
    403: 'Your account has been disabled. Please contact support.',
    404: 'Account not found. Please check your details or create an account.',
  },
  verification: {
    400: 'Invalid verification code. Please try again.',
    401: 'Verification code expired. Please request a new one.',
    429: 'Too many attempts. Please wait before trying again.',
  },
  pin: {
    400: 'PIN not set. Please set up your PIN first.',
    401: 'Invalid PIN. Please try again.',
    423: 'Too many failed attempts. Your account is temporarily locked.',
  },
  face: {
    400: 'No face detected. Please ensure your face is clearly visible and try again.',
    401: 'Face verification failed. Please try again.',
    422: 'Unable to detect face. Please ensure your face is clearly visible and well-lit.',
    500: 'Face processing failed. Please try again with better lighting.',
  },
  payment: {
    400: 'Invalid card details. Please check and try again.',
    402: 'Payment failed. Please check your card details.',
    403: 'Card declined. Please use a different payment method.',
  },
  network: {
    default: 'Unable to connect to the server. Please check your internet connection.',
  },
};

// ============================================
// Main Error Formatting Function
// ============================================

/**
 * Formats an API error into a user-friendly message
 * 
 * @param error - The error object from the API call
 * @param context - Optional context for more specific messages (e.g., 'auth', 'pin', 'face')
 * @param fallbackMessage - Optional custom fallback message
 * @returns User-friendly error message
 */
export function formatApiError(
  error: ApiError | unknown,
  context?: keyof typeof CONTEXT_MESSAGES,
  fallbackMessage: string = 'Something went wrong. Please try again.'
): string {
  // Handle null/undefined
  if (!error) {
    return fallbackMessage;
  }

  const err = error as ApiError;

  // Check for network errors first
  if (isNetworkError(err)) {
    return CONTEXT_MESSAGES.network.default;
  }

  const status = err.response?.status;
  const data = err.response?.data;

  // Try to get a clean message from the response
  const serverMessage = extractServerMessage(data);

  // If we have a context, check for context-specific message
  if (context && status && CONTEXT_MESSAGES[context]?.[status]) {
    return CONTEXT_MESSAGES[context][status];
  }

  // If server returned a clean message (not a technical one), use it
  if (serverMessage && !isTechnicalMessage(serverMessage)) {
    return serverMessage;
  }

  // Use status code message
  if (status && STATUS_CODE_MESSAGES[status]) {
    return STATUS_CODE_MESSAGES[status];
  }

  // Last resort fallback
  return fallbackMessage;
}

/**
 * Checks if the error is a network error
 */
export function isNetworkError(error: ApiError): boolean {
  if (!error) return false;
  
  // If there's a response with a status code, it's not a network error
  // Check this first to avoid misclassifying auth errors (401, 403, etc.) as network errors
  if (error.response && error.response.status) {
    return false;
  }
  
  // Check if error message contains auth/credential-related keywords - not a network error
  const errorMsg = (error.message || '').toLowerCase();
  const authKeywords = ['credential', 'password', 'incorrect', 'invalid', 'wrong', 'unauthorized', 'authentication', 'login failed'];
  if (authKeywords.some(keyword => errorMsg.includes(keyword))) {
    return false; // This is an auth-related error, not network
  }
  
  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
    return true;
  }
  
  if (error.message?.toLowerCase().includes('network error')) {
    return true;
  }
  
  if (error.message?.toLowerCase().includes('timeout')) {
    return true;
  }
  
  // No response usually means network issue, BUT check for face-specific errors first
  if (!error.response) {
    // Check if error message contains face-related keywords - not a network error
    const faceKeywords = ['face', 'detect', 'embedding', 'image', 'photo', 'capture'];
    if (faceKeywords.some(keyword => errorMsg.includes(keyword))) {
      return false; // This is a face-related error, not network
    }
    return true;
  }
  
  return false;
}

/**
 * Checks if the error is a face detection error
 */
export function isFaceDetectionError(error: ApiError): boolean {
  if (!error) return false;
  
  const errorMsg = (error.message || '').toLowerCase();
  const detailMsg = (error.response?.data?.detail || '').toLowerCase();
  const dataMsg = (error.response?.data?.message || '').toLowerCase();
  
  const allMessages = `${errorMsg} ${detailMsg} ${dataMsg}`;
  
  const faceErrorKeywords = [
    'no face', 'face not', 'detect face', 'face detect',
    'no faces', 'faces found', 'embedding', 'multiple faces',
    'face too', 'face quality', 'blurry', 'dark', 'lighting'
  ];
  
  return faceErrorKeywords.some(keyword => allMessages.includes(keyword));
}

/**
 * Extracts the message from API response data
 */
function extractServerMessage(data: ApiError['response']['data']): string | null {
  if (!data) return null;

  // Priority: message > detail > error
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  // Handle validation errors array
  if (data.errors) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0];
    }
    if (typeof data.errors === 'object') {
      const firstError = Object.values(data.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
  }

  return null;
}

/**
 * Checks if a message looks like a technical error (contains status codes, stack traces, etc.)
 */
function isTechnicalMessage(message: string): boolean {
  if (!message) return false;
  
  const technicalPatterns = [
    /status\s*[:=]?\s*\d{3}/i,           // "status: 400" or "status=400"
    /error\s*[:=]?\s*\d{3}/i,            // "error: 500"
    /http\s*\d{3}/i,                      // "HTTP 400"
    /\d{3}\s*(error|bad|not|internal)/i, // "400 Bad Request"
    /exception/i,                          // Exception messages
    /stack\s*trace/i,                      // Stack traces
    /at\s+\w+\.\w+\s*\(/i,                // Stack trace lines
    /undefined|null|nan/i,                 // JS errors
    /\{.*"error".*\}/i,                    // JSON error objects
    /axios/i,                              // Axios library errors
    /request failed/i,                     // Generic request failed
  ];

  return technicalPatterns.some(pattern => pattern.test(message));
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Get a simple error message (alias for formatApiError with minimal params)
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'Something went wrong. Please try again.'
): string {
  return formatApiError(error, undefined, fallback);
}

/**
 * Get error message for authentication errors
 */
export function getAuthError(error: unknown): string {
  return formatApiError(error, 'auth', 'Login failed. Please check your credentials.');
}

/**
 * Get error message for verification errors
 */
export function getVerificationError(error: unknown): string {
  return formatApiError(error, 'verification', 'Verification failed. Please try again.');
}

/**
 * Get error message for PIN errors
 */
export function getPinError(error: unknown): string {
  return formatApiError(error, 'pin', 'PIN operation failed. Please try again.');
}

/**
 * Get error message for face registration/update errors
 */
export function getFaceError(error: unknown): string {
  const err = error as ApiError;
  
  // Check for face detection specific errors first
  if (isFaceDetectionError(err)) {
    return 'No face detected. Please ensure your face is clearly visible, well-lit, and centered in the frame.';
  }
  
  // Check for specific error messages from the server
  const serverMessage = err?.response?.data?.detail || err?.response?.data?.message || '';
  const lowerMessage = serverMessage.toLowerCase();
  
  if (lowerMessage.includes('no face') || lowerMessage.includes('face not detected')) {
    return 'No face detected. Please ensure your face is clearly visible and try again.';
  }
  if (lowerMessage.includes('multiple face')) {
    return 'Multiple faces detected. Please ensure only your face is in the frame.';
  }
  if (lowerMessage.includes('quality') || lowerMessage.includes('blurry')) {
    return 'Image quality is too low. Please ensure good lighting and hold the camera steady.';
  }
  if (lowerMessage.includes('dark') || lowerMessage.includes('lighting')) {
    return 'The image is too dark. Please try again with better lighting.';
  }
  
  return formatApiError(error, 'face', 'Face operation failed. Please ensure your face is visible and try again.');
}

/**
 * Get error message for payment errors
 */
export function getPaymentError(error: unknown): string {
  return formatApiError(error, 'payment', 'Payment failed. Please try again.');
}

export default {
  formatApiError,
  getErrorMessage,
  getAuthError,
  getVerificationError,
  getPinError,
  getFaceError,
  getPaymentError,
  isNetworkError,
};

