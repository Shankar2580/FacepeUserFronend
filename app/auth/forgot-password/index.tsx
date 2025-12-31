import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../../src/components/ui/AlertModal';
import { OTPInput } from '../../../src/components/ui/OTPInput';
import { PasswordStrengthIndicator } from '../../../src/components/ui/PasswordStrengthIndicator';
import { SuccessModal } from '../../../src/components/ui/SuccessModal';
import { apiService } from '../../../src/services/api';
import { getErrorMessage, getVerificationError } from '../../../src/utils/errorHandler';
import { fontScale, scale } from '../../../src/utils/responsive';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams();
  const [step, setStep] = useState<'phone' | 'smsVerification' | 'emailVerification' | 'newPassword'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(params.phone ? String(params.phone) : '');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEmailInfoModal, setShowEmailInfoModal] = useState(false);

  const router = useRouter();
  const { showAlert, AlertComponent } = useAlert();
  const isScreenFocused = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      isScreenFocused.current = true;
      return () => {
        isScreenFocused.current = false;
      };
    }, [])
  );

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, '');
    return digits;
  };

  const handlePhoneNumberChange = (input: string) => {
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `+1${phoneNumber}` : '';
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

  const startEmailCountdown = () => {
    setEmailCountdown(60);
    const timer = setInterval(() => {
      setEmailCountdown((prev) => {
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

  // Step 1: Send SMS verification only
  const handleSendSmsVerification = async () => {
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
      const resetResponse = await apiService.requestPasswordReset(fullPhoneNumber);
      const email = resetResponse.data?.email || resetResponse.email;

      if (!email) {
        throw new Error('Email not found for this user. Please contact support.');
      }

      setUserEmail(email);
      await apiService.sendPhoneVerification(fullPhoneNumber);

      setIsLoading(false);
      setStep('smsVerification');
      startCountdown();

      if (isScreenFocused.current) {
        showAlert('Success', `Verification code sent to ${fullPhoneNumber}`, undefined, 'success');
      }
    } catch (error: any) {
      setIsLoading(false);
      if (isScreenFocused.current) {
        setTimeout(() => {
          showAlert('Error', getVerificationError(error), undefined, 'error');
        }, 100);
      }
    }
  };

  // Step 2: Verify SMS code and proceed to email verification
  const handleVerifySmsCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      showAlert('Error', 'Please enter a valid SMS verification code', undefined, 'error');
      return;
    }

    // Show email info popup before moving to email verification
    setShowEmailInfoModal(true);
  };

  // Step 3: Send email verification code
  const handleSendEmailVerification = async () => {
    setShowEmailInfoModal(false);
    setIsLoading(true);
    try {
      await apiService.sendEmailVerification(userEmail);
      setIsLoading(false);
      setStep('emailVerification');
      startEmailCountdown();
    } catch (error: any) {
      setIsLoading(false);
      if (isScreenFocused.current) {
        setTimeout(() => {
          showAlert('Error', getVerificationError(error), undefined, 'error');
        }, 100);
      }
    }
  };

  // Step 4: Verify email code and proceed to new password
  const handleVerifyEmailCode = async () => {
    if (!emailVerificationCode || emailVerificationCode.length < 4) {
      showAlert('Error', 'Please enter a valid email verification code', undefined, 'error');
      return;
    }

    setStep('newPassword');
  };

  const handleVerifyAndReset = async () => {
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
        email_verification_code: emailVerificationCode,
        password_reset: {
          new_password: newPassword
        }
      });

      setIsLoading(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setIsLoading(false);
      setTimeout(() => {
        showAlert('Error', getErrorMessage(error, 'Failed to reset password. Please try again.'), undefined, 'error');
      }, 100);
    }
  };

  const handleResendSmsCode = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const fullPhoneNumber = getFullPhoneNumber();
      await apiService.sendPhoneVerification(fullPhoneNumber);
      startCountdown();

      if (isScreenFocused.current) {
        showAlert('Success', 'SMS code resent successfully', undefined, 'success');
      }
    } catch (error: any) {
      if (isScreenFocused.current) {
        showAlert('Error', getVerificationError(error), undefined, 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleResendEmailCode = async () => {
    if (emailCountdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await apiService.sendEmailVerification(userEmail);
      startEmailCountdown();

      if (isScreenFocused.current) {
        showAlert('Success', 'Email code resent successfully', undefined, 'success');
      }
    } catch (error: any) {
      if (isScreenFocused.current) {
        showAlert('Error', getVerificationError(error), undefined, 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return 'Reset Password';
      case 'smsVerification': return 'Verify Mobile';
      case 'emailVerification': return 'Verify Email';
      case 'newPassword': return 'New Password';
      default: return 'Reset Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'phone': return 'Enter your mobile number to receive a verification code';
      case 'smsVerification': return `Enter the code sent to ${getFullPhoneNumber()}`;
      case 'emailVerification': return `Enter the code sent to ${userEmail ? userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''}`;
      case 'newPassword': return 'Create a strong password for your account';
      default: return '';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'phone': return 0;
      case 'smsVerification': return 1;
      case 'emailVerification': return 2;
      case 'newPassword': return 3;
      default: return 0;
    }
  };

  const progressStepIndex = getProgressStepIndex();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#6B46C1', '#9333EA']}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name={step === 'phone' ? 'key' : step === 'smsVerification' ? 'chatbox' : step === 'emailVerification' ? 'mail' : 'lock-closed'}
                    size={scale(32, 28, 36)}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.title}>{getStepTitle()}</Text>
              <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

              {/* Progress Indicator - 4 steps now */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, progressStepIndex >= 0 && styles.progressDotActive]} />
                <View style={[styles.progressLine, progressStepIndex >= 1 && styles.progressLineActive]} />
                <View style={[styles.progressDot, progressStepIndex >= 1 && styles.progressDotActive]} />
                <View style={[styles.progressLine, progressStepIndex >= 2 && styles.progressLineActive]} />
                <View style={[styles.progressDot, progressStepIndex >= 2 && styles.progressDotActive]} />
                <View style={[styles.progressLine, progressStepIndex >= 3 && styles.progressLineActive]} />
                <View style={[styles.progressDot, progressStepIndex >= 3 && styles.progressDotActive]} />
              </View>
            </View>

            {/* Step 1: Phone Number */}
            {step === 'phone' && (
              <View style={styles.form}>
                <View style={styles.phoneInputSection}>
                  <Text style={styles.inputLabel}>Enter Your Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
                    <Text style={styles.prefix}>+1</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="#999"
                      value={phoneNumber}
                      onChangeText={handlePhoneNumberChange}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    We'll send a verification code to your phone
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendSmsVerification}
                  disabled={isLoading || phoneNumber.length !== 10}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Sending...' : 'Send Verification Code'}
                    </Text>
                    {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: SMS Verification Code */}
            {step === 'smsVerification' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="chatbox" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.otpLabel}>SMS Code</Text>
                  </View>
                  <Text style={styles.otpHelperText}>Enter the 6-digit code sent to your phone</Text>
                  <OTPInput
                    code={verificationCode}
                    setCode={setVerificationCode}
                    variant="grouped"
                    disabled={isLoading}
                  />
                </View>

                {countdown > 0 ? (
                  <View style={styles.countdownContainer}>
                    <View style={styles.circularProgress}>
                      <View style={[styles.circularProgressInner, { 
                        transform: [{ rotate: `${(countdown / 60) * 360}deg` }] 
                      }]} />
                      <Text style={styles.countdownNumber}>{countdown}</Text>
                    </View>
                    <Text style={styles.countdownText}>
                      Resend code in {countdown}s
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendSmsCode}
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
                  onPress={handleVerifySmsCode}
                  disabled={isLoading || !verificationCode || verificationCode.length < 4}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeNumberButton}
                  onPress={() => setStep('phone')}
                >
                  <Text style={styles.changeNumberText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Email Verification Code */}
            {step === 'emailVerification' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="mail" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.otpLabel}>Email Code</Text>
                  </View>
                  <Text style={styles.otpHelperText}>Enter the 6-digit code sent to your email</Text>
                  <OTPInput
                    code={emailVerificationCode}
                    setCode={setEmailVerificationCode}
                    variant="grouped"
                    disabled={isLoading}
                  />
                </View>

                {emailCountdown > 0 ? (
                  <View style={styles.countdownContainer}>
                    <View style={styles.circularProgress}>
                      <View style={[styles.circularProgressInner, { 
                        transform: [{ rotate: `${(emailCountdown / 60) * 360}deg` }] 
                      }]} />
                      <Text style={styles.countdownNumber}>{emailCountdown}</Text>
                    </View>
                    <Text style={styles.countdownText}>
                      Resend code in {emailCountdown}s
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendEmailCode}
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
                  onPress={handleVerifyEmailCode}
                  disabled={isLoading || !emailVerificationCode || emailVerificationCode.length < 4}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 4: New Password */}
            {step === 'newPassword' && (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                      size={scale(20, 18, 24)}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
                
                <PasswordStrengthIndicator password={newPassword} />

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                      size={scale(20, 18, 24)}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordHint}>
                  <Ionicons name="information-circle" size={16} color="#6B7280" />
                  <Text style={styles.passwordHintText}>
                    Must contain uppercase, lowercase, number, and special character
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyAndReset}
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Text>
                    {!isLoading && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace('/auth/login')}
              >
                <Ionicons name="arrow-back" size={16} color="#6B46C1" />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AlertComponent />
      
      {/* Email Info Modal - Shown before email verification step */}
      <Modal
        visible={showEmailInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={['#6B46C1', '#9333EA']}
                style={styles.modalIconGradient}
              >
                <Ionicons name="mail" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>Email Verification</Text>
            <Text style={styles.modalSubtitle}>
              We'll send a verification code to your email address:
            </Text>
            <Text style={styles.modalEmail}>
              {userEmail ? userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSendEmailVerification}
            >
              <LinearGradient
                colors={['#6B46C1', '#9333EA']}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Send Email Code</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowEmailInfoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/auth/login');
        }}
        title="Password Reset Successful!"
        subtitle="Your password has been reset successfully. Please login with your new password."
        buttonText="Go to Login"
        iconName="checkmark-circle"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingBottom: scale(24),
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(32),
  },
  iconContainer: {
    marginBottom: scale(24),
  },
  iconGradient: {
    width: scale(80, 72, 88),
    height: scale(80, 72, 88),
    borderRadius: scale(40, 36, 44),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: fontScale(32, 28, 36),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scale(24),
    paddingHorizontal: scale(16),
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: scale(12, 10, 14),
    height: scale(12, 10, 14),
    borderRadius: scale(6, 5, 7),
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6B46C1',
    transform: [{ scale: 1.3 }],
  },
  progressLine: {
    width: scale(40, 32, 48),
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: scale(4),
  },
  progressLineActive: {
    backgroundColor: '#6B46C1',
  },
  form: {
    marginBottom: scale(32),
  },
  phoneInputSection: {
    marginBottom: scale(32),
  },
  inputLabel: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(12),
  },
  helperText: {
    fontSize: fontScale(13, 12, 14),
    color: '#6B7280',
    marginTop: scale(8),
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: scale(16),
    paddingHorizontal: scale(16),
    height: scale(56, 48, 64),
    minHeight: 48,
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
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16, 14, 18),
    color: '#1F2937',
  },
  prefix: {
    fontSize: fontScale(16, 14, 18),
    color: '#1F2937',
    marginRight: scale(8),
    fontWeight: '600',
  },
  eyeButton: {
    padding: scale(8),
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: scale(8),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: scale(16, 14, 18),
    paddingHorizontal: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  buttonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  otpSection: {
    marginBottom: scale(16),
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
    gap: scale(6),
  },
  otpLabel: {
    fontSize: fontScale(15, 13, 17),
    fontWeight: '600',
    color: '#1F2937',
  },
  otpHelperText: {
    fontSize: fontScale(12, 11, 13),
    color: '#6B7280',
    marginBottom: scale(8),
    lineHeight: 16,
  },
  maskedEmail: {
    fontSize: fontScale(12, 11, 14),
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: scale(4),
  },
  resendText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: scale(16),
    textDecorationLine: 'underline',
  },
  countdownContainer: {
    alignItems: 'center',
    marginVertical: scale(12),
    gap: scale(8),
  },
  circularProgress: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#6B46C1',
  },
  circularProgressInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: scale(25),
    borderWidth: 2,
    borderColor: '#9333EA',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  countdownNumber: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '700',
    color: '#6B46C1',
    zIndex: 1,
  },
  countdownText: {
    fontSize: fontScale(13, 12, 14),
    color: '#6B7280',
    textAlign: 'center',
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: scale(12),
    marginBottom: scale(16),
    gap: scale(8),
  },
  passwordHintText: {
    flex: 1,
    fontSize: fontScale(12, 11, 14),
    color: '#6B46C1',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: scale(24),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    minHeight: 44,
  },
  backButtonText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    fontWeight: '600',
  },
  changeNumberButton: {
    alignItems: 'center',
    marginTop: scale(16),
    paddingVertical: scale(8),
  },
  changeNumberText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: scale(32),
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: scale(20),
  },
  modalIconGradient: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontScale(22, 20, 24),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontScale(14, 13, 16),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scale(8),
    lineHeight: 22,
  },
  modalEmail: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#6B46C1',
    marginBottom: scale(24),
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  modalButtonGradient: {
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCancelButton: {
    paddingVertical: scale(12),
  },
  modalCancelText: {
    fontSize: fontScale(14, 13, 16),
    color: '#6B7280',
    fontWeight: '500',
  },
});
