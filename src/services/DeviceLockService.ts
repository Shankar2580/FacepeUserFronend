import * as LocalAuthentication from 'expo-local-authentication';
import { DEBUG_CONFIG } from '../constants/config';

export interface SecurityInfo {
  hasDeviceLock: boolean;
  biometricAvailable: boolean;
  biometricTypes: string[];
}

class DeviceLockService {
  /**
   * Get comprehensive security information about the device
   */
  async getSecurityInfo(): Promise<SecurityInfo> {
    try {
      // Check if device has hardware support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      // Check if device is secured (has PIN/password/pattern)
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Get available authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Enhanced detection: Use multiple checks for better tablet compatibility
      let hasDeviceLock = isEnrolled;
      
      // Additional check: If hardware exists but isEnrolled is false, 
      // it might be a detection issue on some tablets
      if (!isEnrolled && hasHardware) {
        // On some tablets, pattern locks might not be detected by isEnrolledAsync
        // but supportedAuthenticationTypesAsync might still return empty array
        // In this case, we assume device lock exists if hardware is available
        if (DEBUG_CONFIG.ENABLE_LOGS) {

        }
        
        // Check if we can at least attempt authentication (this indicates device lock exists)
        try {
          // Use getEnrolledLevelAsync if available (newer expo-local-authentication versions)
          if (LocalAuthentication.getEnrolledLevelAsync) {
            const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
            hasDeviceLock = enrolledLevel !== LocalAuthentication.SecurityLevel.NONE;
          }
        } catch (levelError) {
          if (DEBUG_CONFIG.ENABLE_LOGS) {

          }
          // Fallback: assume device lock exists if hardware is present
          // This is safer for tablets that might have detection issues
          hasDeviceLock = true;
        }
      }
      
      // Map authentication types to readable names
      const biometricTypes: string[] = [];
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricTypes.push('Face Recognition');
      }
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricTypes.push('Fingerprint');
      }
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricTypes.push('Iris');
      }

      // If no biometric types but device has lock, it has PIN/password/pattern
      if (biometricTypes.length === 0 && hasDeviceLock) {
        biometricTypes.push('Device PIN/Pattern/Password');
      }

      if (DEBUG_CONFIG.ENABLE_LOGS) {

      }

      return {
        hasDeviceLock,
        biometricAvailable: hasDeviceLock, // Any device lock is considered available
        biometricTypes,
      };
    } catch (error) {
      if (DEBUG_CONFIG.ENABLE_LOGS) {

      }
      
      // Return safe defaults
      return {
        hasDeviceLock: false,
        biometricAvailable: false,
        biometricTypes: [],
      };
    }
  }

  /**
   * Authenticate user using device biometrics
   */
  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      if (DEBUG_CONFIG.ENABLE_LOGS) {

      }
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      if (DEBUG_CONFIG.ENABLE_LOGS) {

      }
      return false;
    }
  }

  /**
   * Authenticate with fallback options
   */
  async authenticateWithFallback(promptMessage: string = 'Authenticate to access the app'): Promise<{success: boolean, error?: string}> {
    try {
      // Check if any authentication method is available
      const securityInfo = await this.getSecurityInfo();
      
      if (!securityInfo.hasDeviceLock) {
        return {
          success: false,
          error: 'Device lock not detected. Please ensure you have set up a screen lock (PIN, pattern, password, or biometric) in your device Settings > Security.'
        };
      }

      // Enhanced authentication options for better tablet/pattern support
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Device Lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false, // Don't require additional confirmation
      });

      if (result.success) {
        return { success: true };
      } else {
        // Handle different error types
        if (result.error === 'app_cancel') {
          return { success: false, error: 'Authentication cancelled' };
        } else if (result.error === 'system_cancel') {
          return { success: false, error: 'Authentication was cancelled by the system' };
        } else if (result.error === 'not_enrolled') {
          return { success: false, error: 'No authentication method is set up on this device' };
        } else if (result.error === 'not_available') {
          return { success: false, error: 'Authentication is not available on this device' };
        } else if (result.error === 'passcode_not_set') {
          return { success: false, error: 'Please set up a device passcode first' };
        } else if (result.error === 'authentication_failed') {
          return { success: false, error: 'Authentication failed. Please try again.' };
        } else {
          return { success: false, error: 'Authentication failed. Please try again.' };
        }
      }
    } catch (error) {

      return { 
        success: false, 
        error: 'Authentication failed. Please try again.' 
      };
    }
  }

  /**
   * Get the security level description
   */
  async getSecurityLevel(): Promise<'high' | 'medium' | 'low' | 'none'> {
    try {
      const info = await this.getSecurityInfo();
      
      if (!info.hasDeviceLock) {
        return 'none';
      }
      
      if (info.biometricAvailable) {
        return 'high';
      }
      
      if (info.hasDeviceLock) {
        return 'medium';
      }
      
      return 'low';
    } catch (error) {
      if (DEBUG_CONFIG.ENABLE_LOGS) {

      }
      return 'none';
    }
  }
}

export default new DeviceLockService();
