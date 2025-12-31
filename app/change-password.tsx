import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { AppText as Text } from '../src/components/ui/AppText';
import { OTPInput } from '../src/components/ui/OTPInput';
import { PasswordStrengthIndicator } from '../src/components/ui/PasswordStrengthIndicator';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';
import { getErrorMessage, getVerificationError } from '../src/utils/errorHandler';
import { fontScale, scale } from '../src/utils/responsive';

export default function ChangePasswordScreen() {
  const [step, setStep] = useState<'sendCode' | 'smsVerification' | 'emailVerification' | 'newPassword'>('sendCode');
  const [showEmailInfoModal, setShowEmailInfoModal] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  React.useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  const sendVerificationCodes = async () => {
    if (!user?.phone_number) {
      showAlert('Error', 'Phone number not found', undefined, 'warning');
      return;
    }

    if (!user?.email) {
      showAlert('Error', 'Email not found', undefined, 'warning');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      // Send phone verification code only
      await apiService.sendPhoneVerification(user.phone_number);

      setCountdown(60);
      setStep('smsVerification');
      showAlert('Success', 'Verification code sent to your phone', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify SMS code and show email popup
  const handleVerifySmsCode = () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      showAlert('Error', 'Please enter the 6-digit phone verification code', undefined, 'warning');
      return;
    }
    setShowEmailInfoModal(true);
  };

  // Send email code and proceed to email verification
  const handleSendEmailCode = async () => {
    setShowEmailInfoModal(false);
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      await apiService.sendEmailVerification(user.email);
      setEmailCountdown(60);
      setStep('emailVerification');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email code and proceed to new password
  const handleVerifyEmailCode = () => {
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      showAlert('Error', 'Please enter the 6-digit email verification code', undefined, 'warning');
      return;
    }
    setStep('newPassword');
  };

  // Resend SMS code
  const handleResendSmsCode = async () => {
    if (countdown > 0 || isLoading) return;
    
    setIsLoading(true);
    try {
      await apiService.sendPhoneVerification(user?.phone_number || '');
      setCountdown(60);
      showAlert('Success', 'SMS code resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend email code
  const handleResendEmailCode = async () => {
    if (emailCountdown > 0 || isLoading) return;
    
    setIsLoading(true);
    try {
      await apiService.sendEmailVerification(user?.email || '');
      setEmailCountdown(60);
      showAlert('Success', 'Email code resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };


  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters long', undefined, 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match', undefined, 'warning');
      return;
    }

    // Validate password requirements
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      showAlert('Error', 'Password must contain uppercase, lowercase, number, and special character', undefined, 'warning');
      return;
    }

    try {
      setIsLoading(true);

      // Use the correct API format matching forgot password
      await apiService.verifyPasswordReset({
        phone_number: user?.phone_number || '',
        verification_code: phoneVerificationCode,
        email_verification_code: emailVerificationCode,
        password_reset: {
          new_password: newPassword
        }
      });

      showAlert('Success', 'Password changed successfully', [
        {
          text: 'Done',
          onPress: () => router.back()
        }
      ], 'success');
    } catch (error: any) {
      showAlert('Error', getErrorMessage(error, 'Failed to change password. Please try again.'), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    if (phone.length > 6) {
      return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    return phone;
  };

  const formatEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length === 2) {
      return parts[0].substring(0, 2) + '***@' + parts[1];
    }
    return email;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'sendCode': return 'Change Password';
      case 'smsVerification': return 'Verify Mobile';
      case 'emailVerification': return 'Verify Email';
      case 'newPassword': return 'New Password';
      default: return 'Change Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'sendCode': return 'We\'ll send a verification code to your phone';
      case 'smsVerification': return `Enter the code sent to ${formatPhoneNumber(user?.phone_number || '')}`;
      case 'emailVerification': return `Enter the code sent to ${formatEmail(user?.email || '')}`;
      case 'newPassword': return 'Create a strong password for your account';
      default: return '';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'sendCode': return 0;
      case 'smsVerification': return 1;
      case 'emailVerification': return 2;
      case 'newPassword': return 3;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F7FF']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={scale(24, 20, 28)} color="#6B46C1" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Icon and Title */}
            <View style={styles.topSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#6B46C1', '#9333EA']}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name={step === 'sendCode' ? 'shield-checkmark' : step === 'verification' ? 'key' : 'lock-closed'}
                    size={scale(32, 28, 36)}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>

              <Text style={styles.stepTitle}>{getStepTitle()}</Text>
              <Text style={styles.stepSubtitle}>{getStepSubtitle()}</Text>

              {/* Progress Indicator - 4 steps */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, getProgressStepIndex() >= 0 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 1 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 1 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 2 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 2 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 3 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 3 && styles.progressDotActive]} />
              </View>
            </View>

            {/* Step 1: Send Verification Code */}
            {step === 'sendCode' && (
              <View style={styles.form}>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{formatPhoneNumber(user?.phone_number || '')}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{formatEmail(user?.email || '')}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={sendVerificationCodes}
                  disabled={isLoading}
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

            {/* Step 2: SMS Verification */}
            {step === 'smsVerification' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="chatbox" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.otpLabel}>Phone Code</Text>
                  </View>
                  <OTPInput
                    code={phoneVerificationCode}
                    setCode={setPhoneVerificationCode}
                    variant="grouped"
                  />
                </View>

                {countdown > 0 ? (
                  <Text style={styles.resendText}>
                    Resend code in {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendSmsCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.resendLinkText}>
                      {isLoading ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, (!phoneVerificationCode || phoneVerificationCode.length !== 6) && styles.buttonDisabled]}
                  onPress={handleVerifySmsCode}
                  disabled={!phoneVerificationCode || phoneVerificationCode.length !== 6}
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
                  style={styles.changeButton}
                  onPress={() => setStep('sendCode')}
                >
                  <Text style={styles.changeButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Email Verification */}
            {step === 'emailVerification' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="mail" size={scale(20)} color="#6B46C1" />
                    <Text style={styles.otpLabel}>Email Code</Text>
                  </View>
                  <OTPInput
                    code={emailVerificationCode}
                    setCode={setEmailVerificationCode}
                    variant="grouped"
                  />
                </View>

                {emailCountdown > 0 ? (
                  <Text style={styles.resendText}>
                    Resend code in {emailCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendEmailCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.resendLinkText}>
                      {isLoading ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, (!emailVerificationCode || emailVerificationCode.length !== 6) && styles.buttonDisabled]}
                  onPress={handleVerifyEmailCode}
                  disabled={!emailVerificationCode || emailVerificationCode.length !== 6}
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

            {/* Step 3: New Password */}
            {step === 'newPassword' && (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <RNTextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#999"
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
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  <PasswordStrengthIndicator password={newPassword} />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <RNTextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor="#999"
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
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordHint}>
                  <Ionicons name="information-circle" size={16} color="#6B7280" />
                  <Text style={styles.passwordHintText}>
                    Must contain uppercase, lowercase, number, and special character
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, (!newPassword || !confirmPassword || isLoading) && styles.buttonDisabled]}
                  onPress={handleChangePassword}
                  disabled={!newPassword || !confirmPassword || isLoading}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Changing Password...' : 'Change Password'}
                    </Text>
                    {!isLoading && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Info Modal */}
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
              {user?.email ? formatEmail(user.email) : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSendEmailCode}
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

      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    backgroundColor: '#F8F7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    borderRadius: scale(22),
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonGradient: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.1)',
    minWidth: 44,
    minHeight: 44,
  },
  headerTitle: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: scale(44),
  },
  keyboardView: {
    flex: 1,
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
  topSection: {
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
  stepTitle: {
    fontSize: fontScale(28, 24, 32),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  stepSubtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scale(24),
    lineHeight: 24,
    paddingHorizontal: scale(16),
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
    width: '100%',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(20),
    marginBottom: scale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  infoLabel: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: scale(12),
    width: scale(60),
  },
  infoValue: {
    fontSize: fontScale(14, 12, 16),
    color: '#1F2937',
    flex: 1,
  },
  otpSection: {
    marginBottom: scale(24),
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
    gap: scale(8),
  },
  otpLabel: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
  },
  resendText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: scale(16),
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: scale(16),
    minHeight: 44,
    justifyContent: 'center',
  },
  resendLinkText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: scale(20),
  },
  inputLabel: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    height: scale(56, 48, 64),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingRight: scale(50),
    fontSize: fontScale(16, 14, 18),
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    minHeight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: scale(16),
    top: '50%',
    transform: [{ translateY: -scale(22) }],
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
  changeButton: {
    alignItems: 'center',
    marginTop: scale(16),
    paddingVertical: scale(8),
  },
  changeButtonText: {
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
    shadowOffset: { width: 0, height: 4 },
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
