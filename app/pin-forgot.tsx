import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { AppText as Text, AppTextInput as TextInput } from '../src/components/ui/AppText';
import { OTPInput } from '../src/components/ui/OTPInput';
import { PINInput } from '../src/components/ui/PINInput';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';
import { getPinError, getVerificationError } from '../src/utils/errorHandler';
import { fontScale, scale } from '../src/utils/responsive';

export default function PinForgotScreen() {
  const [step, setStep] = useState<'send_code' | 'sms_verification' | 'email_verification' | 'new_pin'>('send_code');
  const [showEmailInfoModal, setShowEmailInfoModal] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [newPinError, setNewPinError] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

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

  const validatePinSecurity = (pin: string): boolean => {
    const commonPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '1122', '2211'];
    return !commonPins.includes(pin);
  };

  const handleSendVerification = async () => {
    if (!phoneNumber) {
      showAlert('Error', 'Phone number is required', undefined, 'warning');
      return;
    }

    if (!user?.email) {
      showAlert('Error', 'Email not found. Please update your profile.', undefined, 'warning');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await apiService.sendVerification({ phone_number: phoneNumber, method: 'sms' });
      startCountdown();
      setStep('sms_verification');
      showAlert('Success', 'Verification code sent to your phone', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify SMS code and show email popup
  const handleVerifySmsCode = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit phone verification code', undefined, 'warning');
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
      startEmailCountdown();
      setStep('email_verification');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email code and proceed to new PIN
  const handleVerifyEmailCode = () => {
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit email verification code', undefined, 'warning');
      return;
    }
    setStep('new_pin');
  };

  React.useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);


  const handleNewPinSubmit = async () => {
    if (!newPin || newPin.length !== 4) {
      setNewPinError(true);
      showAlert('Error', 'Please enter a 4-digit PIN', undefined, 'warning');
      return;
    }
    if (newPin !== confirmNewPin) {
      setNewPinError(true);
      showAlert('Error', 'PINs do not match', undefined, 'warning');
      return;
    }
    if (!validatePinSecurity(newPin)) {
      setNewPinError(true);
      showAlert('Error', 'Please choose a more secure PIN. Avoid common sequences like 1234, 0000, etc.', undefined, 'warning');
      return;
    }

    setNewPinError(false);
    setIsLoading(true);
    try {
      await apiService.forgotPin({
        phone_number: phoneNumber,
        verification_code: verificationCode,
        email_verification_code: emailVerificationCode,
        new_pin: newPin
      });

      showAlert(
        'Success',
        'Your PIN has been reset successfully!',
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/profile') }],
        'success'
      );
    } catch (error: any) {
      showAlert('Error', getPinError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSmsCode = async () => {
    if (countdown > 0 || isLoading) return;

    setIsLoading(true);
    try {
      await apiService.sendVerification({ phone_number: phoneNumber, method: 'sms' });
      startCountdown();
      showAlert('Success', 'SMS code resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    if (emailCountdown > 0 || isLoading) return;

    setIsLoading(true);
    try {
      await apiService.sendEmailVerification(user?.email || '');
      startEmailCountdown();
      showAlert('Success', 'Email code resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'send_code': return 'Forgot PIN';
      case 'sms_verification': return 'Verify Mobile';
      case 'email_verification': return 'Verify Email';
      case 'new_pin': return 'Set New PIN';
      default: return 'Forgot PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'send_code': return 'We\'ll send a verification code to your phone';
      case 'sms_verification': return `Enter the code sent to ${phoneNumber}`;
      case 'email_verification': return `Enter the code sent to ${user?.email}`;
      case 'new_pin': return 'Choose a new secure 4-digit PIN';
      default: return '';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'send_code': return 0;
      case 'sms_verification': return 1;
      case 'email_verification': return 2;
      case 'new_pin': return 3;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Back Button */}
      <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F7FF']}
          style={styles.backButtonGradient}
        >
          <Ionicons name="arrow-back" size={scale(24, 20, 28)} color="#6B46C1" />
        </LinearGradient>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 32}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {/* Progress Indicator - 4 steps */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressDot, getProgressStepIndex() >= 0 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 1 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 1 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 2 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 2 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 3 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 3 && styles.progressDotActive]} />
              </View>
            </View>

            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
          </View>

          <View style={styles.content}>
            {step === 'send_code' && (
              <>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="information-circle" size={scale(24, 20, 28)} color="#6B46C1" />
                  </View>
                  <Text style={styles.infoText}>
                    Don't worry! We'll verify your identity using codes sent to your registered phone and email.
                  </Text>
                </View>

                <View style={styles.inputCard}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={scale(20, 18, 24)} color="#6B46C1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#9CA3AF"
                      value={phoneNumber}
                      editable={false}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleSendVerification}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#8B5CF6']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>Send Verification Code</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* SMS Verification Step */}
            {step === 'sms_verification' && (
              <>
                <View style={styles.inputCard}>
                  <Text style={styles.otpSectionLabel}>Phone Verification Code</Text>
                  <View style={styles.otpWrapper}>
                    <OTPInput code={verificationCode} setCode={setVerificationCode} variant="grouped" />
                  </View>

                  {countdown > 0 ? (
                    <Text style={styles.resendText}>
                      Resend code in {countdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendSmsCode} disabled={isLoading}>
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { marginTop: scale(8) },
                      (isLoading || verificationCode.length !== 6) && styles.disabledButton
                    ]}
                    onPress={handleVerifySmsCode}
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#8B5CF6']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => setStep('send_code')}
                  >
                    <Text style={styles.changeButtonText}>Change Phone Number</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Email Verification Step */}
            {step === 'email_verification' && (
              <>
                <View style={styles.inputCard}>
                  <Text style={styles.otpSectionLabel}>Email Verification Code</Text>
                  <View style={styles.otpWrapper}>
                    <OTPInput code={emailVerificationCode} setCode={setEmailVerificationCode} variant="grouped" />
                  </View>

                  {emailCountdown > 0 ? (
                    <Text style={styles.resendText}>
                      Resend code in {emailCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendEmailCode} disabled={isLoading}>
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { marginTop: scale(8) },
                      (isLoading || emailVerificationCode.length !== 6) && styles.disabledButton
                    ]}
                    onPress={handleVerifyEmailCode}
                    disabled={isLoading || emailVerificationCode.length !== 6}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#8B5CF6']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'new_pin' && (
              <>
                <View style={styles.inputCard}>
                  <PINInput
                    pin={newPin}
                    setPin={setNewPin}
                    label="Enter New PIN"
                    error={newPinError}
                    variant="boxes"
                    secure
                  />

                  <PINInput
                    pin={confirmNewPin}
                    setPin={setConfirmNewPin}
                    label="Confirm New PIN"
                    error={newPinError}
                    variant="boxes"
                    secure
                  />

                  <View style={[styles.securityTip, { marginTop: scale(24) }]}>
                    <Ionicons name="shield-checkmark" size={scale(20, 18, 24)} color="#10B981" />
                    <Text style={styles.securityTipText}>
                      Avoid common patterns like 1234, 0000, or repeated digits
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (isLoading || newPin.length !== 4 || confirmNewPin.length !== 4) && styles.disabledButton
                    ]}
                    onPress={handleNewPinSubmit}
                    disabled={isLoading || newPin.length !== 4 || confirmNewPin.length !== 4}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#8B5CF6']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>
                        {isLoading ? 'Resetting PIN...' : 'Reset PIN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
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
                colors={['#6B46C1', '#8B5CF6']}
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
              {user?.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSendEmailCode}
            >
              <LinearGradient
                colors={['#6B46C1', '#8B5CF6']}
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
  backButton: {
    position: 'absolute',
    top: scale(50),
    left: scale(16),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonGradient: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: scale(100),
    paddingBottom: scale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(32),
  },
  progressContainer: {
    width: '100%',
    marginBottom: scale(32),
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: scale(12, 10, 14),
    height: scale(12, 10, 14),
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6B46C1',
    transform: [{ scale: 1.2 }],
  },
  progressLine: {
    width: scale(60),
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  progressLineActive: {
    backgroundColor: '#6B46C1',
  },
  title: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(24),
    alignItems: 'center',
  },
  infoIconContainer: {
    marginRight: scale(12),
  },
  infoText: {
    flex: 1,
    fontSize: fontScale(14, 12, 16),
    color: '#5B21B6',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    padding: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    marginBottom: scale(16),
    minHeight: 48,
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16, 14, 18),
    color: '#1F2937',
    fontWeight: '500',
  },
  label: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(12),
  },
  otpSectionLabel: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(12),
  },
  otpWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: scale(2),
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: scale(12),
    marginBottom: scale(24),
  },
  securityTipText: {
    flex: 1,
    fontSize: fontScale(13, 11, 15),
    color: '#059669',
    marginLeft: scale(8),
    lineHeight: 18,
  },
  resendText: {
    textAlign: 'center',
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginVertical: scale(16),
  },
  resendLink: {
    textAlign: 'center',
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    fontWeight: '600',
    marginVertical: scale(16),
    textDecorationLine: 'underline',
  },
  primaryButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    minHeight: 48,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  gradientButton: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
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
