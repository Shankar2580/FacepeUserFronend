import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

interface PinVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  onForgotPin?: () => void;
}

interface LockState {
  isLocked: boolean;
  lockedUntil: string | null;
  failedAttempts: number;
}

const MAX_ATTEMPTS = 3;

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = 'Verify Your PIN',
  subtitle = 'Enter your 4-digit PIN to continue',
  onForgotPin,
}) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  
  const isProcessingRef = useRef(false);
  const lastPinSubmittedRef = useRef<string | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load lock state from localStorage on mount
  useEffect(() => {
    if (visible) {
      loadLockState();
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (isLocked && lockedUntil) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const remaining = lockedUntil.getTime() - now.getTime();

        if (remaining <= 0) {
          clearLockoutState();
        } else {
          setRemainingTime(formatRemainingTime(remaining));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLocked, lockedUntil]);

  const loadLockState = async () => {
    try {
      const stored = await AsyncStorage.getItem('pin_lock_state');
      if (stored) {
        const state: LockState = JSON.parse(stored);
        
        // Check if lock expired
        if (state.lockedUntil && new Date(state.lockedUntil) > new Date()) {
          setIsLocked(true);
          setLockedUntil(new Date(state.lockedUntil));
          setFailedAttempts(state.failedAttempts);
        } else {
          // Lock expired, clear state
          await AsyncStorage.removeItem('pin_lock_state');
          setIsLocked(false);
          setLockedUntil(null);
          setFailedAttempts(0);
        }
      }
    } catch (error) {
      console.error('Error loading lock state:', error);
    }
  };

  const saveLockState = async (state: LockState) => {
    try {
      await AsyncStorage.setItem('pin_lock_state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving lock state:', error);
    }
  };

  const clearLockoutState = async () => {
    setIsLocked(false);
    setLockedUntil(null);
    setFailedAttempts(0);
    setErrorMessage('');
    setShowWarning(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    try {
      await AsyncStorage.removeItem('pin_lock_state');
    } catch (error) {
      console.error('Error clearing lock state:', error);
    }
  };

  const formatRemainingTime = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 60000) % 60);
    const hours = Math.floor(ms / 3600000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getLockoutDuration = (lockedUntilTime: string): number => {
    const lockExpiry = new Date(lockedUntilTime);
    const now = new Date();
    return (lockExpiry.getTime() - now.getTime()) / 60000; // duration in minutes
  };

  const getWarningMessage = (lockedUntilTime: string): string => {
    const durationMinutes = getLockoutDuration(lockedUntilTime);
    
    if (durationMinutes <= 20) {
      return '⚠️ Account locked for 15 minutes. Next wrong PIN will lock for 1 hour.';
    } else if (durationMinutes <= 70) {
      return '🚨 Account locked for 1 hour. Next wrong PIN will lock for 24 hours!';
    } else {
      return '🔒 Account locked for 24 hours due to repeated failures. Contact support if needed.';
    }
  };

  const triggerShakeAnimation = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate([100, 50, 100]);
    }

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerifyPin = async () => {
    const timestamp = new Date().toISOString();
    console.log(`🔐 [${timestamp}] PIN Verification Started`);
    console.log(`📍 [${timestamp}] PIN length: ${pin.length}`);
    console.log(`📍 [${timestamp}] isVerifying: ${isVerifying}`);
    console.log(`📍 [${timestamp}] isProcessing (ref): ${isProcessingRef.current}`);
    console.log(`📍 [${timestamp}] isLocked: ${isLocked}`);
    console.log(`📍 [${timestamp}] Current failed attempts: ${failedAttempts}`);
    
    // Prevent double calls with both state and ref
    if (pin.length !== 4 || isVerifying || isLocked || isProcessingRef.current) {
      console.log(`❌ [${timestamp}] BLOCKED - Validation failed, returning early`);
      console.log(`   Reasons: pin=${pin.length !== 4}, verifying=${isVerifying}, locked=${isLocked}, processing=${isProcessingRef.current}`);
      return;
    }

    // Additional protection: Check if same PIN was just submitted within 2 seconds
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    if (lastPinSubmittedRef.current === pin && timeSinceLastCall < 2000) {
      console.log(`⚠️ [${timestamp}] DUPLICATE DETECTED! Same PIN submitted ${timeSinceLastCall}ms ago - BLOCKING`);
      return;
    }
    
    console.log(`✅ [${timestamp}] PROCEEDING with API call`);
    lastPinSubmittedRef.current = pin;
    lastCallTimeRef.current = now;
    isProcessingRef.current = true; // Set ref immediately
    setIsVerifying(true);
    setErrorMessage('');
    setShowWarning(false);

    try {
      const callTimestamp = new Date().toISOString();
      console.log(`📡 [${callTimestamp}] ===== CALLING apiService.verifyCurrentPin =====`);
      console.log(`📡 [${callTimestamp}] Sending PIN: ${pin}`);
      
      const response = await apiService.verifyCurrentPin(pin);
      
      const responseTimestamp = new Date().toISOString();
      console.log(`✅ [${responseTimestamp}] ===== API RESPONSE RECEIVED =====`);
      console.log(`✅ [${responseTimestamp}] Response:`, response);

      if (response.success) {
        // Success - store verified PIN and reset all counters
        console.log('✅ PIN Verified Successfully!');
        
        try {
          await AsyncStorage.setItem('verified_pin', pin);
          console.log('✅ PIN stored in AsyncStorage');
          
          await clearLockoutState();
          console.log('✅ Lockout state cleared');
          
          setPin('');
          console.log('✅ PIN input cleared');
          console.log('✅ Calling onSuccess() callback...');
          
          onSuccess();
          console.log('✅ onSuccess() completed!');
        } catch (successError: any) {
          console.error('❌ Error in success handler:', successError);
          throw successError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error: any) {
      console.error('❌ PIN Verification Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        fullError: error,
      });
      // Handle different error scenarios
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        // Invalid PIN
        // Backend now sends locked_until nested in message object
        const lockedUntilValue = data?.locked_until || data?.message?.locked_until;
        
        if (lockedUntilValue) {
          // Lockout just triggered
          console.log('🔒 Lockout triggered, locked_until:', lockedUntilValue);
          const lockUntil = new Date(lockedUntilValue);
          
          // Validate the date
          if (isNaN(lockUntil.getTime())) {
            console.error('⚠️ Invalid locked_until from backend:', data.locked_until);
            setErrorMessage('Invalid lockout time received from server. Please try again.');
            setPin('');
            return;
          }
          
          setIsLocked(true);
          setLockedUntil(lockUntil);
          setErrorMessage(getWarningMessage(lockedUntilValue));
          
          await saveLockState({
            isLocked: true,
            lockedUntil: lockedUntilValue,
            failedAttempts: failedAttempts + 1,
          });
        } else {
          // Just a wrong PIN, no lock yet
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          
          const remaining = MAX_ATTEMPTS - newFailedAttempts;
          if (remaining > 0) {
            setErrorMessage(`Invalid PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
            
            if (remaining === 1) {
              setShowWarning(true);
            }
          }
          
          await saveLockState({
            isLocked: false,
            lockedUntil: null,
            failedAttempts: newFailedAttempts,
          });
        }
        
        triggerShakeAnimation();
        setPin('');
      } else if (status === 423) {
        // Already locked
        // Backend now sends locked_until nested in message object
        const lockedUntilValue = data?.locked_until || data?.message?.locked_until;
        console.log('🔒 Account already locked, locked_until:', lockedUntilValue);
        
        if (!lockedUntilValue) {
          console.error('⚠️ No locked_until provided by backend for 423 response');
          setErrorMessage('Account is locked but server did not provide unlock time.');
          setPin('');
          return;
        }
        
        const lockUntil = new Date(lockedUntilValue);
        
        // Validate the date
        if (isNaN(lockUntil.getTime())) {
          console.error('⚠️ Invalid locked_until from backend:', data.locked_until);
          setErrorMessage('Invalid lockout time received from server. Please try again.');
          setPin('');
          return;
        }
        
        setIsLocked(true);
        setLockedUntil(lockUntil);
        setErrorMessage(getWarningMessage(lockedUntilValue));
        
        await saveLockState({
          isLocked: true,
          lockedUntil: lockedUntilValue,
          failedAttempts: failedAttempts,
        });
        
        setPin('');
      } else if (status === 429) {
        // Rate limited
        setErrorMessage('Too many requests. Please wait a moment and try again.');
        triggerShakeAnimation();
        setPin('');
      } else if (status === 400) {
        setErrorMessage('PIN not set. Please reset your PIN first.');
        triggerShakeAnimation();
        setPin('');
      } else if (status === 500) {
        // Backend server error
        setErrorMessage('Server error occurred. Please try again later or contact support.');
        console.error('⚠️ Backend 500 error - tell backend developer to check server logs');
        triggerShakeAnimation();
        setPin('');
      } else {
        // Generic error
        setErrorMessage(data?.message || data?.error || 'PIN verification failed. Please try again.');
        triggerShakeAnimation();
        setPin('');
      }
    } finally {
      const finalTimestamp = new Date().toISOString();
      console.log(`🏁 [${finalTimestamp}] ===== FINALLY BLOCK - Resetting flags =====`);
      setIsVerifying(false);
      isProcessingRef.current = false; // Reset ref
      // Note: We keep lastPinSubmittedRef and lastCallTimeRef for duplicate detection
      console.log(`🏁 [${finalTimestamp}] Flags reset complete`);
      console.log(`🏁 [${finalTimestamp}] Last submitted PIN still tracked for 2s duplicate prevention`);
    }
  };

  const handleClose = () => {
    setPin('');
    setErrorMessage('');
    setShowWarning(false);
    onClose();
  };

  const getSeverityColor = () => {
    if (isLocked && lockedUntil) {
      try {
        // Validate date before calling toISOString
        if (isNaN(lockedUntil.getTime())) {
          console.error('⚠️ Invalid lockedUntil date:', lockedUntil);
          return '#EF4444'; // Default to red for invalid dates
        }
        const durationMinutes = getLockoutDuration(lockedUntil.toISOString());
        if (durationMinutes <= 20) return '#F59E0B'; // Orange for 15 min lock
        if (durationMinutes <= 70) return '#EF4444'; // Red for 1 hour lock
        return '#DC2626'; // Dark red for 24 hour lock
      } catch (error) {
        console.error('⚠️ Error in getSeverityColor:', error);
        return '#EF4444'; // Default to red on error
      }
    }
    return '#6B46C1';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${getSeverityColor()}20` }]}>
              <Ionicons
                name={isLocked ? 'lock-closed' : 'lock-open'}
                size={32}
                color={getSeverityColor()}
              />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>{subtitle}</Text>
          </View>

          {/* Lockout Warning Banner */}
          {isLocked && (
            <View style={[styles.lockoutBanner, { backgroundColor: `${getSeverityColor()}15` }]}>
              <Ionicons name="time" size={20} color={getSeverityColor()} />
              <View style={styles.lockoutTextContainer}>
                <Text style={[styles.lockoutText, { color: getSeverityColor() }]}>
                  Account Locked
                </Text>
                <Text style={[styles.lockoutCountdown, { color: getSeverityColor() }]}>
                  Unlocks in {remainingTime}
                </Text>
              </View>
            </View>
          )}

          {/* PIN Input */}
          <View style={styles.pinInputContainer}>
            <TextInput
              style={[
                styles.pinInput,
                isLocked && styles.pinInputDisabled,
                errorMessage && !isLocked && styles.pinInputError,
              ]}
              value={pin}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 4) {
                  setPin(numericText);
                  // Clear error as user types
                  if (errorMessage && !isLocked) {
                    setErrorMessage('');
                    setShowWarning(false);
                  }
                }
              }}
              placeholder={isLocked ? 'Account locked' : 'Enter PIN'}
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus={!isLocked}
              editable={!isLocked && !isVerifying}
            />
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={[styles.errorContainer, isLocked && styles.errorContainerLocked]}>
              <Ionicons
                name={isLocked ? 'alert-circle' : 'warning'}
                size={18}
                color={isLocked ? getSeverityColor() : '#EF4444'}
              />
              <Text style={[styles.errorText, isLocked && { color: getSeverityColor() }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Warning for last attempt */}
          {showWarning && !isLocked && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                ⚠️ Last attempt before 15-minute lockout!
              </Text>
            </View>
          )}

          {/* Forgot PIN Link */}
          {failedAttempts >= 2 && onForgotPin && !isLocked && (
            <TouchableOpacity onPress={onForgotPin} style={styles.forgotPinButton}>
              <Text style={styles.forgotPinText}>Forgot your PIN? Reset it here</Text>
            </TouchableOpacity>
          )}

          {/* Progress Bar for Lockout */}
          {isLocked && lockedUntil && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: getSeverityColor(),
                      width: `${Math.max(0, Math.min(100, ((lockedUntil.getTime() - new Date().getTime()) / (getLockoutDuration(lockedUntil.toISOString()) * 60000)) * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { opacity: pin.length === 4 && !isVerifying && !isLocked ? 1 : 0.5 },
              ]}
              disabled={pin.length !== 4 || isVerifying || isLocked}
              onPress={handleVerifyPin}
            >
              <LinearGradient
                colors={[getSeverityColor(), getSeverityColor()]}
                style={styles.confirmButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmButtonText}>
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Text>
                {!isVerifying && !isLocked && (
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  lockoutTextContainer: {
    flex: 1,
  },
  lockoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockoutCountdown: {
    fontSize: 14,
    fontWeight: '500',
  },
  pinInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinInput: {
    width: '100%',
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 16,
  },
  pinInputDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    color: '#9CA3AF',
  },
  pinInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorContainerLocked: {
    backgroundColor: '#FEF3C7',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  forgotPinButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  forgotPinText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
