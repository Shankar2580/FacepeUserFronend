import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

export default function PinResetScreen() {
  const [step, setStep] = useState<'send_code' | 'verification' | 'current_pin' | 'new_pin'>('send_code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentPinError, setCurrentPinError] = useState(false);
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
      await apiService.sendEmailVerification(user.email);
      startCountdown();
      setStep('verification');
      showAlert('Success', 'Verification codes sent to your phone and email', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit verification code', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.verifyCode({
        phone_number: phoneNumber,
        code: verificationCode
      });
      setStep('current_pin');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentPinSubmit = () => {
    if (!currentPin || currentPin.length !== 4) {
      setCurrentPinError(true);
      showAlert('Error', 'Please enter your current 4-digit PIN', undefined, 'warning');
      return;
    }
    setCurrentPinError(false);
    setStep('new_pin');
  };

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
    if (newPin === currentPin) {
      setNewPinError(true);
      showAlert('Error', 'New PIN must be different from current PIN', undefined, 'warning');
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
      await apiService.resetPin({
        phone_number: phoneNumber,
        verification_code: verificationCode,
        email_verification_code: emailVerificationCode,
        current_pin: currentPin,
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

  const handleResendCode = async () => {
    if (countdown > 0 || isLoading) return;

    setIsLoading(true);
    try {
      await apiService.sendVerification({ phone_number: phoneNumber, method: 'sms' });
      await apiService.sendEmailVerification(user?.email || '');
      startCountdown();
      showAlert('Success', 'Verification codes resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', getVerificationError(error), undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'send_code': return 'Reset PIN';
      case 'verification': return 'Verify Your Phone';
      case 'current_pin': return 'Enter Current PIN';
      case 'new_pin': return 'Set New PIN';
      default: return 'Reset PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'send_code': return 'We\'ll send verification codes to your phone and email';
      case 'verification': return 'Enter the codes sent to your phone and email';
      case 'current_pin': return 'Enter your current 4-digit PIN for security';
      case 'new_pin': return 'Choose a new secure 4-digit PIN';
      default: return '';
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getStepTitle()}</Text>
              <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={[styles.progressLine, step !== 'send_code' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step !== 'send_code' ? styles.progressDotActive : null]} />
                <View style={[styles.progressLine, step === 'current_pin' || step === 'new_pin' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step === 'current_pin' || step === 'new_pin' ? styles.progressDotActive : null]} />
                <View style={[styles.progressLine, step === 'new_pin' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step === 'new_pin' ? styles.progressDotActive : null]} />
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {step === 'send_code' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="phone-portrait-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#999"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      editable={false}
                    />
                  </View>

                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={scale(20, 18, 24)} color="#6B46C1" />
                    <Text style={styles.infoText}>
                      We'll send a 6-digit verification code to this number
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleSendVerification}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Sending...' : 'Send Verification Code'}
                      </Text>
                      {!isLoading && <Ionicons name="send" size={scale(20, 18, 24)} color="#FFFFFF" />}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 'verification' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="phone-portrait-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#999"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      editable={false}
                    />
                  </View>

                  <Text style={styles.otpLabel}>SMS Code</Text>
                  <View style={styles.otpWrapper}>
                    <OTPInput
                      code={verificationCode}
                      setCode={setVerificationCode}
                      variant="grouped"
                    />
                  </View>

                  <Text style={[styles.otpLabel, { marginTop: scale(20) }]}>Email Code</Text>
                  <View style={styles.otpWrapper}>
                    <OTPInput
                      code={emailVerificationCode}
                      setCode={setEmailVerificationCode}
                      variant="grouped"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: scale(24) }, isLoading && styles.disabledButton]}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Verifying...' : 'Verify Codes'}
                      </Text>
                      {!isLoading && <Ionicons name="checkmark-circle" size={scale(20, 18, 24)} color="#FFFFFF" />}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, countdown > 0 && styles.disabledButton]}
                    onPress={handleResendCode}
                    disabled={countdown > 0}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Codes'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'current_pin' && (
                <>
                  <PINInput
                    pin={currentPin}
                    setPin={setCurrentPin}
                    label="Current PIN"
                    error={currentPinError}
                    variant="boxes"
                    secure
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: scale(24) }, isLoading && styles.disabledButton]}
                    onPress={handleCurrentPinSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={scale(20, 18, 24)} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 'new_pin' && (
                <>
                  <PINInput
                    pin={newPin}
                    setPin={setNewPin}
                    label="New PIN"
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
                    <Ionicons name="shield-checkmark" size={scale(16, 14, 18)} color="#10B981" />
                    <Text style={styles.securityTipText}>
                      Choose a secure PIN. Avoid common sequences like 1234, 0000, etc.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleNewPinSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Updating...' : 'Update PIN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  backButton: {
    position: 'absolute',
    top: scale(60),
    left: scale(16),
    zIndex: 10,
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
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingBottom: scale(24),
    paddingTop: scale(70),
  },
  title: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    marginBottom: scale(24),
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(20),
  },
  progressDot: {
    width: scale(12, 10, 14),
    height: scale(12, 10, 14),
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginHorizontal: scale(4),
  },
  progressDotActive: {
    backgroundColor: '#6B46C1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: scale(8),
  },
  progressLineActive: {
    backgroundColor: '#6B46C1',
  },
  form: {
    marginBottom: scale(40),
    width: '100%',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: scale(12),
    color: '#9CA3AF',
  },
  input: {
    flex: 1,
    fontSize: fontScale(16, 14, 18),
    color: '#1F2937',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: scale(24),
    gap: scale(12),
  },
  infoText: {
    flex: 1,
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    lineHeight: 20,
  },
  otpLabel: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(12),
    marginTop: scale(8),
  },
  otpWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: scale(2),
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: scale(12),
    borderRadius: 8,
    marginBottom: scale(24),
  },
  securityTipText: {
    fontSize: fontScale(14, 12, 16),
    color: '#065F46',
    marginLeft: scale(8),
    flex: 1,
  },
  primaryButton: {
    height: scale(56, 48, 64),
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: scale(16),
    minHeight: 48,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(8),
  },
  primaryButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: scale(16),
    alignItems: 'center',
    marginBottom: scale(16),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  secondaryButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#6B46C1',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
