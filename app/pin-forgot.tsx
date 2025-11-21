import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/hooks/useAuth';
import { useAlert } from '../src/components/ui/AlertModal';

// Custom OTP Input Component
const OTPInput = ({
  code,
  setCode,
}: {
  code: string;
  setCode: (code: string) => void;
}) => {
  const inputs = React.useRef<TextInput[]>([]);

  const handleTextChange = (text: string, index: number) => {
    if (text.length > 1) {
      // If pasting, distribute to all fields
      if (text.length === 6) {
        const newCode = text.split('');
        setCode(newCode.join(''));
        inputs.current[5].focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode.join(''));

    // Move to next input
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              if (el) {
                inputs.current[index] = el;
              }
            }}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(text) => handleTextChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            value={code[index] || ''}
          />
        ))}
    </View>
  );
};

// PIN Input Component
const PinInput = ({
  pin,
  setPin,
  placeholder,
  error,
}: {
  pin: string;
  setPin: (pin: string) => void;
  placeholder: string;
  error?: boolean;
}) => {
  const inputs = React.useRef<TextInput[]>([]);

  const handleTextChange = (text: string, index: number) => {
    if (text.length > 1) return;

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin.join(''));

    // Move to next input
    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.pinContainer}>
      <Text style={styles.pinLabel}>{placeholder}</Text>
      <View style={styles.pinInputsContainer}>
        <View style={styles.pinInputContainer}>
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  if (el) {
                    inputs.current[index] = el;
                  }
                }}
                style={[
                  styles.pinInput,
                  error && styles.pinInputError,
                  pin[index] && styles.pinInputFilled,
                ]}
                keyboardType="numeric"
                maxLength={1}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                value={pin[index] || ''}
                secureTextEntry={true}
              />
            ))}
        </View>
      </View>
    </View>
  );
};

export default function PinForgotScreen() {
  const [step, setStep] = useState<'send_code' | 'verification' | 'new_pin'>('send_code');
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

  // Start countdown timer
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

  // Validate PIN security (no common sequences)
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

    // Prevent multiple calls
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Send phone verification code
      await apiService.sendVerification({ phone_number: phoneNumber, method: 'sms' });
      
      // Send email verification code
      await apiService.sendEmailVerification(user.email);
      
      startCountdown();
      // Move to verification step after sending codes
      setStep('verification');
      showAlert('Success', 'Verification codes sent to your phone and email', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to send verification codes', undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Just load the phone number, don't auto-send code
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit phone verification code', undefined, 'warning');
      return;
    }

    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit email verification code', undefined, 'warning');
      return;
    }

    // Move to new PIN step after codes entered
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
      showAlert('Error', error.response?.data?.message || 'Failed to reset PIN', undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isLoading) return;
    
    setIsLoading(true);
    try {
      // Resend both verification codes
      await apiService.sendVerification({ phone_number: phoneNumber, method: 'sms' });
      await apiService.sendEmailVerification(user?.email || '');
      
      startCountdown();
      showAlert('Success', 'Verification codes resent successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to resend codes', undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'send_code': return 'Forgot PIN';
      case 'verification': return 'Verify Your Identity';
      case 'new_pin': return 'Set New PIN';
      default: return 'Forgot PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'send_code': return 'We\'ll send verification codes to your phone and email';
      case 'verification': return 'Enter the codes sent to your phone and email';
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
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
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
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={[styles.progressLine, step !== 'send_code' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step !== 'send_code' ? styles.progressDotActive : null]} />
                <View style={[styles.progressLine, step === 'new_pin' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step === 'new_pin' ? styles.progressDotActive : null]} />
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
                    <Ionicons name="information-circle" size={24} color="#6B46C1" />
                  </View>
                  <Text style={styles.infoText}>
                    Don't worry! We'll verify your identity using codes sent to your registered phone and email.
                  </Text>
                </View>

                <View style={styles.inputCard}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color="#6B46C1" style={styles.inputIcon} />
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
                      <Text style={styles.buttonText}>Send Verification Codes</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'verification' && (
              <>
                <View style={styles.inputCard}>
                  <Text style={styles.label}>Phone Verification Code</Text>
                  <OTPInput code={verificationCode} setCode={setVerificationCode} />

                  <Text style={[styles.label, { marginTop: 24 }]}>Email Verification Code</Text>
                  <OTPInput code={emailVerificationCode} setCode={setEmailVerificationCode} />

                  {countdown > 0 ? (
                    <Text style={styles.resendText}>
                      Resend codes in {countdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
                      <Text style={styles.resendLink}>Resend Verification Codes</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (isLoading || verificationCode.length !== 6 || emailVerificationCode.length !== 6) && styles.disabledButton
                    ]}
                    onPress={handleVerifyCode}
                    disabled={isLoading || verificationCode.length !== 6 || emailVerificationCode.length !== 6}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#8B5CF6']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>Verify Codes</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'new_pin' && (
              <>
                <View style={styles.inputCard}>
                  <PinInput
                    pin={newPin}
                    setPin={setNewPin}
                    placeholder="Enter New PIN"
                    error={newPinError}
                  />

                  <PinInput
                    pin={confirmNewPin}
                    setPin={setConfirmNewPin}
                    placeholder="Confirm New PIN"
                    error={newPinError}
                  />

                  <View style={styles.securityTip}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
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
    top: 50,
    left: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6B46C1',
    transform: [{ scale: 1.2 }],
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  progressLineActive: {
    backgroundColor: '#6B46C1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  pinInputsContainer: {
    alignItems: 'center',
  },
  pinInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pinInput: {
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pinInputFilled: {
    backgroundColor: '#EDE9FE',
    borderColor: '#6B46C1',
  },
  pinInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  securityTipText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    marginLeft: 8,
    lineHeight: 18,
  },
  resendText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 16,
  },
  resendLink: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
    marginVertical: 16,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
