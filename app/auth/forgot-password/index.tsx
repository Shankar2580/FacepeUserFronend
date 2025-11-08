import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../../src/services/api';
import { useAlert } from '../../../src/components/ui/AlertModal';

// Country codes configuration
const COUNTRY_CODES = [
  {
    code: '+1',
    country: 'US',
    flag: '🇺🇸',
    name: 'United States',
    maxLength: 10,
    placeholder: '(555) 123-4567'
  },
  {
    code: '+91',
    country: 'IN',
    flag: '🇮🇳',
    name: 'India',
    maxLength: 10,
    placeholder: '98765 43210'
  }
];

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'phone' | 'verification' | 'newPassword'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default to US
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  const router = useRouter();
  const { showAlert, AlertComponent } = useAlert();
  const isScreenFocused = useRef(true);

  // Track screen focus to prevent alerts when user navigates away
  useFocusEffect(
    React.useCallback(() => {
      isScreenFocused.current = true;
      return () => {
        isScreenFocused.current = false;
      };
    }, [])
  );

  // Format phone number with +1 prefix
  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, '');
    return digits;
  };

  const handlePhoneNumberChange = (input: string) => {
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${selectedCountry.code}${phoneNumber}` : '';
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validatePassword = (pass: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSendVerification = async () => {
    if (!phoneNumber) {
      showAlert('Error', 'Please enter your mobile number', undefined, 'error');
      return;
    }

    if (phoneNumber.length !== 10) {
      showAlert('Error', 'Please enter a valid 10-digit mobile number', undefined, 'error');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    try {
      await apiService.requestPasswordReset(fullPhoneNumber);
      setIsLoading(false);
      setStep('verification');
      startCountdown();
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      // Only show alert if screen is still focused
      if (isScreenFocused.current) {
        setTimeout(() => {
          showAlert('Error', error.response?.data?.detail || 'Failed to send verification code', undefined, 'error');
        }, 100);
      }
    }
  };

  const handleVerifyAndReset = async () => {
    if (!verificationCode) {
      showAlert('Error', 'Please enter the verification code', undefined, 'error');
      return;
    }

    if (verificationCode.length < 4) {
      showAlert('Error', 'Please enter a valid verification code', undefined, 'error');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showAlert('Error', passwordError, undefined, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match', undefined, 'error');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    try {
      await apiService.verifyPasswordReset({
        phone_number: fullPhoneNumber,
        verification_code: verificationCode,
        password_reset: {
          new_password: newPassword
        }
      });
      
      setIsLoading(false);
      showAlert(
        'Success', 
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/login')
          }
        ],
        'success'
      );
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      setTimeout(() => {
        showAlert('Error', error.response?.data?.detail || 'Failed to reset password', undefined, 'error');
      }, 100);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await handleSendVerification();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 'phone' && 'Enter the phone number linked to your account, and we\'ll send you a code to reset your password'}
              {step === 'verification' && 'Enter the verification code sent to your mobile number'}
              {step === 'newPassword' && 'Create a new password for your account'}
            </Text>
          </View>

          {step === 'phone' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                <Text style={styles.prefix}>+1</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendVerification}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'verification' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Verification Code"
                  placeholderTextColor="#999"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>

              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend code in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity 
                  onPress={handleResendCode}
                  disabled={isResending}
                  style={[isResending && { opacity: 0.5 }]}
                >
                  <Text style={styles.resendText}>
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={() => setStep('newPassword')}
                disabled={isLoading || !verificationCode}
              >
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'newPassword' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyAndReset}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.backButtonContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/auth/login')}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  prefix: {
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
    textAlign: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B46C1',
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  backButtonContainer: {
    marginTop: 32,
    alignSelf: 'center',
  },
  backButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  countdownText: {
    fontSize: 14,
    color: '#E9D8FD',
    textAlign: 'center',
    marginTop: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
}); 