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
import { apiService } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../components/ui/AlertModal';

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

export default function PinResetScreen() {
  const [step, setStep] = useState<'verification' | 'current_pin' | 'new_pin'>('verification');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
      showAlert('Error', 'Phone number is required', undefined, 'error');
      return;
    }

    // Prevent multiple calls
    if (isLoading) return;

    setIsLoading(true);
    try {
      await apiService.sendVerification({ 
        phone_number: phoneNumber, 
        method: 'sms'
      });
      startCountdown();
      // Don't show success alert for manual send to prevent popup spam
      console.log('Manual verification code sent to:', phoneNumber);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to send verification code', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const init = async () => {
      if (user?.phone_number) {
        const phone = user.phone_number;
        setPhoneNumber(phone);

        setIsLoading(true);
        try {
          await apiService.sendVerification({ 
            phone_number: phone, 
            method: 'sms'
          });
          startCountdown();
          // Don't show success alert for auto-send to prevent popup spam
          console.log('Auto-sent verification code to:', phone);
        } catch (error: any) {
          showAlert('Error', error.response?.data?.message || 'Failed to send verification code', undefined, 'error');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Optional: Handle case where phone number is missing
        showAlert('Warning', 'No phone number associated with account. Please enter manually.', undefined, 'warning');
        // Allow editing if no phone
        // But for now, since editable=false, perhaps remove editable=false if !user?.phone_number
      }
    };

    init();
  }, [user]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit verification code', undefined, 'error');
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
      showAlert('Error', error.response?.data?.message || 'Invalid verification code', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentPinSubmit = () => {
    if (!currentPin || currentPin.length !== 4) {
      setCurrentPinError(true);
      showAlert('Error', 'Please enter your current 4-digit PIN', undefined, 'error');
      return;
    }
    setCurrentPinError(false);
    setStep('new_pin');
  };

  const handleNewPinSubmit = async () => {
    if (!newPin || newPin.length !== 4) {
      setNewPinError(true);
      showAlert('Error', 'Please enter a 4-digit PIN', undefined, 'error');
      return;
    }
    if (newPin !== confirmNewPin) {
      setNewPinError(true);
      showAlert('Error', 'PINs do not match', undefined, 'error');
      return;
    }
    if (newPin === currentPin) {
      setNewPinError(true);
      showAlert('Error', 'New PIN must be different from current PIN', undefined, 'error');
      return;
    }
    if (!validatePinSecurity(newPin)) {
      setNewPinError(true);
      showAlert('Error', 'Please choose a more secure PIN. Avoid common sequences like 1234, 0000, etc.', undefined, 'error');
      return;
    }

    setNewPinError(false);
    setIsLoading(true);
    try {
      await apiService.resetPin({
        phone_number: phoneNumber,
        verification_code: verificationCode,
        current_pin: currentPin,
        new_pin: newPin
      });

      showAlert(
        'Success',
        'Your PIN has been reset successfully!',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }],
        'success'
      );
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to reset PIN', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    await handleSendVerification();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'verification': return 'Verify Your Phone';
      case 'current_pin': return 'Enter Current PIN';
      case 'new_pin': return 'Set New PIN';
      default: return 'Reset PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'verification': return 'We\'ll send a verification code to confirm it\'s you';
      case 'current_pin': return 'Enter your current 4-digit PIN for security';
      case 'new_pin': return 'Choose a new secure 4-digit PIN';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
                <View style={[styles.progressLine, step !== 'verification' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step !== 'verification' ? styles.progressDotActive : null]} />
                <View style={[styles.progressLine, step === 'new_pin' ? styles.progressLineActive : null]} />
                <View style={[styles.progressDot, step === 'new_pin' ? styles.progressDotActive : null]} />
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {step === 'verification' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#999"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      editable={false} // Pre-filled from user data
                    />
                  </View>

                  <OTPInput
                    code={verificationCode}
                    setCode={setVerificationCode}
                  />

                  <TouchableOpacity 
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Verifying...' : 'Verify Code'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.secondaryButton, countdown > 0 && styles.disabledButton]}
                    onPress={handleResendCode}
                    disabled={countdown > 0}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'current_pin' && (
                <>
                  <PinInput
                    pin={currentPin}
                    setPin={setCurrentPin}
                    placeholder="Current PIN"
                    error={currentPinError}
                  />

                  <TouchableOpacity 
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleCurrentPinSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 'new_pin' && (
                <>
                  <PinInput
                    pin={newPin}
                    setPin={setNewPin}
                    placeholder="New PIN"
                    error={newPinError}
                  />

                  <PinInput
                    pin={confirmNewPin}
                    setPin={setConfirmNewPin}
                    placeholder="Confirm New PIN"
                    error={newPinError}
                  />

                  <View style={styles.securityTip}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
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
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60, // Adjust this value based on your status bar height
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 100, // Make it a circle
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 70, // Added padding to avoid overlap with back button
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#6B46C1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#6B46C1',
  },
  form: {
    marginBottom: 40,
    width: '100%',
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
    color: '#9CA3AF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  pinInputsContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    alignSelf: 'center',
  },
  pinInputContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  pinInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  pinInputFilled: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3F4F6',
  },
  pinInputError: {
    borderColor: '#EF4444',
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityTipText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 