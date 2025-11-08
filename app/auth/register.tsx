import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, // Renamed for clarity
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../src/components/ui/AlertModal';
import { PasswordStrengthIndicator } from '../../src/components/ui/PasswordStrengthIndicator';
import { PrivacyPolicyModal } from '../../src/components/ui/PrivacyPolicyModal';
import { ProcessingAnimation } from '../../src/components/ui/ProcessingAnimation';
import { TermsModal } from '../../src/components/ui/TermsModal';
import { apiService } from '../../src/services/api';

// Custom OTP Input Component
const OTPInput = ({
  code,
  setCode,
  onComplete,
}: {
  code: string;
  setCode: (code: string) => void;
  onComplete: (code: string) => void;
}) => {
  const inputs = React.useRef<TextInput[]>([]);

  const handleTextChange = (text: string, index: number) => {
    // Filter to only digits
    const digitsOnly = text.replace(/\D/g, '');

    if (digitsOnly.length > 1) {
      // If pasting multiple digits
      if (digitsOnly.length >= 6) {
        setCode(digitsOnly.slice(0, 6));
        inputs.current[5].focus();
      }
      return;
    }

    const newCode = code.split('');
    newCode[index] = digitsOnly;
    setCode(newCode.join(''));

    // Move to next input
    if (digitsOnly && index < 5) {
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
      {Array(3)
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
      <Text style={styles.otpSeparator}>-</Text>
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index + 3}
            ref={(el) => {
              if (el) {
                inputs.current[index + 3] = el;
              }
            }}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(text) => handleTextChange(text, index + 3)}
            onKeyPress={(e) => handleKeyPress(e, index + 3)}
            value={code[index + 3] || ''}
          />
        ))}
    </View>
  );
};

export default function RegisterScreen() {
  const [step, setStep] = useState<'mobile' | 'verification' | 'details'>('mobile');
  const [phoneNumber, setPhoneNumber] = useState(''); // This will store the formatted number
  const [rawPhoneNumber, setRawPhoneNumber] = useState(''); // This will store raw digits
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loadingType, setLoadingType] = useState<'verification' | 'verify' | 'register' | 'auto-login'>('verification');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  
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

  const formatPhoneNumberForDisplay = (digits: string) => {
    if (!digits) return '';
    const areaCode = digits.slice(0, 3);
    const middle = digits.slice(3, 6);
    const last = digits.slice(6, 10);
  
    if (digits.length > 6) {
      return `(${areaCode}) ${middle}-${last}`;
    } else if (digits.length > 3) {
      return `(${areaCode}) ${middle}`;
    } else if (digits.length > 0) {
      return `(${areaCode}`;
    }
    return '';
  };

  const handlePhoneNumberChange = (input: string) => {
    // Get only digits from the input
    const digits = input.replace(/\D/g, '');
    // Remove leading '1' if present
    const cleanDigits = digits.startsWith('1') ? digits.slice(1) : digits;
    // Limit to 10 digits
    const limitedDigits = cleanDigits.slice(0, 10);
    
    setRawPhoneNumber(limitedDigits);
    setPhoneNumber(formatPhoneNumberForDisplay(limitedDigits));
  };


  // Get full phone number with +1 prefix
  const getFullPhoneNumber = () => {
    return rawPhoneNumber ? `+1${rawPhoneNumber}` : '';
  };

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

  const handleSendVerification = async () => {
    if (!rawPhoneNumber) {
      showAlert('Error', 'Please enter your mobile number', undefined, 'error');
      return;
    }

    if (rawPhoneNumber.length !== 10) {
      showAlert('Error', 'Please enter a valid 10-digit mobile number', undefined, 'error');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    setLoadingType('verification');
    try {
      await apiService.sendVerification({ 
        phone_number: fullPhoneNumber, 
        method: 'sms'
      });
      setIsLoading(false);
      setStep('verification');
      startCountdown();
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      // Only show alert if screen is still focused
      if (isScreenFocused.current) {
        setTimeout(() => {
          showAlert('Error', error.response?.data?.message || 'Failed to send verification code', undefined, 'error');
        }, 100);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      showAlert('Error', 'Please enter the verification code', undefined, 'error');
      return;
    }

    if (verificationCode.length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit verification code', undefined, 'error');
      return;
    }

    // Frontend validation: Check if code contains only digits
    if (!/^\d{6}$/.test(verificationCode)) {
      showAlert('Error', 'Verification code must contain only numbers', undefined, 'error');
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    setLoadingType('verify');
    try {
      await apiService.verifyCode({
        phone_number: fullPhoneNumber,
        code: verificationCode
      });
      setIsLoading(false);
      setStep('details');
      showAlert('Success', 'Mobile number verified! Please complete your registration', undefined, 'success');
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      // API error - show the message from backend
      setTimeout(() => {
        showAlert('Error', error.response?.data?.message || 'Invalid verification code', undefined, 'error');
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!email || !firstName || !lastName || !password || !confirmPassword || !pin || !confirmPin) {
      showAlert('Error', 'Please fill in all fields', undefined, 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address', undefined, 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match', undefined, 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters', undefined, 'error');
      return;
    }

    if (pin.length !== 4) {
      showAlert('Error', 'PIN must be exactly 4 digits', undefined, 'error');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      showAlert('Error', 'PIN must contain only digits', undefined, 'error');
      return;
    }

    if (pin !== confirmPin) {
      showAlert('Error', 'PINs do not match', undefined, 'error');
      return;
    }

    if (!termsAccepted) {
      showAlert('Error', 'Please accept the Terms & Conditions', undefined, 'error');
      return;
    }

    if (!privacyAccepted) {
      showAlert('Error', 'Please accept the Privacy Policy', undefined, 'error');
      return;
    }

    // Both checkboxes are checked, proceed with registration
    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    setLoadingType('register');
    
    try {
      // Create the account directly since both policies are accepted via checkboxes
      await apiService.register({
        phone_number: fullPhoneNumber,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password: password,
        pin: pin,
        verification_code: verificationCode
      });
      
      // Account created successfully, now auto-login
      setLoadingType('auto-login');
      
      try {
        await apiService.login({
          username: email,
          password: password
        });
        
        setIsLoading(false);
        // Success - user will be redirected by auth system
        // console.log removed for production
        
      } catch (loginError: any) {
        setIsLoading(false); // Hide processing animation before showing alert
        // console.log removed for production
        // If auto-login fails, redirect to login page as fallback
        setTimeout(() => {
          showAlert(
            'Registration Successful', 
            'Your account has been created successfully. Please login to continue.',
            [
              {
                text: 'OK',
                onPress: () => router.push('/auth/login')
              }
            ],
            'success'
          );
        }, 100);
      }
      
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      setTimeout(() => {
        showAlert('Registration Failed', error.response?.data?.message || 'Please try again', undefined, 'error');
      }, 100);
    }
  };

  const handlePrivacyAccept = () => {
    setShowPrivacyModal(false);
    setPrivacyAccepted(true); // Auto-check the privacy policy checkbox when user reads and accepts
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    // Just close the modal - user can still check the checkbox manually if they want
  };

  const handleTermsPress = () => {
    setShowTermsModal(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacyModal(true);
  };

  const handleTermsAccept = () => {
    setShowTermsModal(false);
    setTermsAccepted(true); // Auto-check the terms checkbox when user reads and accepts
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    // Just close the modal - user can still check the checkbox manually if they want
  };

  const getStepTitle = () => {
    switch (step) {
      case 'mobile': return 'Register Your Mobile';
      case 'verification': return 'Verify Your Mobile';
      case 'details': return ''; // Remove header text for details step
      default: return 'Sign Up';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'mobile': return 'Enter your mobile number to get started';
      case 'verification': return `Code sent to ${getFullPhoneNumber()}`;
      case 'details': return ''; // Remove subtitle for details step
      default: return '';
    }
  };

  // Show processing animation during loading states
  if (isLoading) {
    const getLoadingProps = () => {
      switch (loadingType) {
        case 'verification':
          return {
            title: 'Sending Verification',
            subtitle: 'Please wait while we send a verification code to your mobile number'
          };
        case 'verify':
          return {
            title: 'Verifying Code',
            subtitle: 'Please wait while we verify your mobile number'
          };
        case 'register':
          return {
            title: 'Creating Account',
            subtitle: 'Please wait while we set up your new account'
          };
        case 'auto-login':
          return {
            title: 'Logging You In',
            subtitle: 'Please wait while we log you into your new account'
          };
        default:
          return {
            title: 'Processing',
            subtitle: 'Please wait...'
          };
      }
    };

    const loadingProps = getLoadingProps();
    return (
      <ProcessingAnimation
        visible={isLoading}
        type="generic"
        title={loadingProps.title}
        subtitle={loadingProps.subtitle}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="dark" translucent={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 32}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingHorizontal: 24, 
            paddingBottom: 24 
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header - Only show for mobile and verification steps */}
            {(step === 'mobile' || step === 'verification') && (
              <View style={styles.header}>
                <Text style={styles.title}>{getStepTitle()}</Text>
                <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
                
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={styles.tab}
                    onPress={() => router.push('/auth/login')}
                  >
                    <Text style={styles.tabText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={[styles.tabText, styles.activeTabText]}>Signup</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={[styles.progressLine, step === 'verification' ? styles.progressLineActive : null]} />
                  <View style={[styles.progressDot, step === 'verification' ? styles.progressDotActive : null]} />
                  <View style={[styles.progressLine, null]} />
                  <View style={[styles.progressDot, null]} />
                </View>
              </View>
            )}

            {/* For details step, show minimal header with just tabs and progress */}
            {step === 'details' && (
              <View style={[styles.header, { marginBottom: 20 }]}>
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={styles.tab}
                    onPress={() => router.push('/auth/login')}
                  >
                    <Text style={styles.tabText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={[styles.tabText, styles.activeTabText]}>Signup</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Indicator - All steps active for details */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={[styles.progressLine, styles.progressLineActive]} />
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={[styles.progressLine, styles.progressLineActive]} />
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                </View>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {step === 'mobile' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#999" style={styles.inputIcon} />
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.phonePrefix}>+1</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter Mobile Number"
                        placeholderTextColor="#999"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                    </View>
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
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 'verification' && (
                <>
                  <OTPInput
                    code={verificationCode}
                    setCode={setVerificationCode}
                    onComplete={() => {}}
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
                    style={[styles.secondaryButton, (countdown > 0 || isResending) && styles.disabledButton]}
                    onPress={handleResendCode}
                    disabled={countdown > 0 || isResending}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setStep('mobile')}
                  >
                    <Text style={styles.backButtonText}>Change Mobile Number</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'details' && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      placeholderTextColor="#999"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      placeholderTextColor="#999"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
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
                  
                  {/* Password Strength Indicator */}
                  <PasswordStrengthIndicator password={password} />

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
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
                    {password && confirmPassword && password === confirmPassword && (
                      <View style={styles.checkMark}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="4-Digit PIN"
                      placeholderTextColor="#999"
                      value={pin}
                      onChangeText={setPin}
                      secureTextEntry={true}
                      keyboardType="numeric"
                      maxLength={4}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm PIN"
                      placeholderTextColor="#999"
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      secureTextEntry={true}
                      keyboardType="numeric"
                      maxLength={4}
                      autoCapitalize="none"
                    />
                    {pin && confirmPin && pin === confirmPin && (
                      <View style={styles.checkMark}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </View>

                  {/* Terms and Conditions */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                      <View style={[styles.checkbox, termsAccepted && styles.checkedBox]}>
                        {termsAccepted && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text 
                          style={styles.linkText}
                          onPress={handleTermsPress}
                        >
                          Terms & Conditions
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Privacy Policy */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => setPrivacyAccepted(!privacyAccepted)}
                    >
                      <View style={[styles.checkbox, privacyAccepted && styles.checkedBox]}>
                        {privacyAccepted && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text 
                          style={styles.linkText}
                          onPress={handlePrivacyPress}
                        >
                          Privacy Policy
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setStep('verification')}
                  >
                    <Text style={styles.backButtonText}>Back to Verification</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text 
                  style={styles.footerLink}
                  onPress={() => router.push('/auth/login')}
                >
                  Sign In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
      
      {/* Terms & Conditions Modal */}
      <TermsModal
        visible={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
      
      {/* Alert Component */}
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 25,
    padding: 4,
    width: 200,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    width: '100%', // Make form take full width like login screen
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
  eyeButton: {
    padding: 4,
  },
  checkMark: {
    padding: 4,
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
  backButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  termsTextContainer: {
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  otpSeparator: {
    marginHorizontal: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
}); 