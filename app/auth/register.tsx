import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../src/components/ui/AlertModal';
import { OTPInput } from '../../src/components/ui/OTPInput';
import { PasswordStrengthIndicator } from '../../src/components/ui/PasswordStrengthIndicator';
import { PrivacyPolicyModal } from '../../src/components/ui/PrivacyPolicyModal';
import { ProcessingAnimation } from '../../src/components/ui/ProcessingAnimation';
import { TermsModal } from '../../src/components/ui/TermsModal';
import { apiService } from '../../src/services/api';
import { getErrorMessage, getVerificationError } from '../../src/utils/errorHandler';
import { fontScale, scale } from '../../src/utils/responsive';

export default function RegisterScreen() {
  const [step, setStep] = useState<'mobile' | 'verification' | 'emailVerification' | 'details'>('mobile');
  const [showEmailInfoModal, setShowEmailInfoModal] = useState(false);
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
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [loadingType, setLoadingType] = useState<'verification' | 'verify' | 'register' | 'auto-login' | 'email-verification'>('verification');
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
          showAlert('Error', getVerificationError(error), undefined, 'error');
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
      // Show email info modal and proceed to email verification
      setStep('details');
      showAlert('Success', 'Mobile number verified! Please complete your registration', undefined, 'success');
    } catch (error: any) {
      setIsLoading(false); // Hide processing animation before showing error
      // API error - show the message from backend
      setTimeout(() => {
        showAlert('Error', getVerificationError(error), undefined, 'error');
      }, 100);
    }
  };

  // Handle proceed to email verification step with popup
  const handleProceedToEmailVerification = () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address', undefined, 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address', undefined, 'error');
      return;
    }

    // Show email info popup
    setShowEmailInfoModal(true);
  };

  // Send email code and move to email verification step
  const handleSendEmailCodeAndProceed = async () => {
    setShowEmailInfoModal(false);
    setIsLoading(true);
    setLoadingType('email-verification');
    try {
      await apiService.sendEmailVerification(email);
      setIsLoading(false);
      setEmailCodeSent(true);
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

  // Verify email code and proceed to final details
  const handleVerifyEmailCode = () => {
    if (!emailVerificationCode || emailVerificationCode.length < 4) {
      showAlert('Error', 'Please enter the email verification code', undefined, 'error');
      return;
    }

    // Proceed to final registration step
    setStep('details');
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

  // Start email countdown timer
  const startEmailCountdown = () => {
    setEmailCountdown(60);
    const timer = setInterval(() => {
      setEmailCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailCode = async () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address', undefined, 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address', undefined, 'error');
      return;
    }

    setIsLoading(true);
    setLoadingType('email-verification');
    try {
      await apiService.sendEmailVerification(email);
      setIsLoading(false);
      setEmailCodeSent(true);
      startEmailCountdown();
      showAlert('Success', 'Verification code sent to your email', undefined, 'success');
    } catch (error: any) {
      setIsLoading(false);
      if (isScreenFocused.current) {
        setTimeout(() => {
          showAlert('Error', getVerificationError(error), undefined, 'error');
        }, 100);
      }
    }
  };

  const handleResendEmailCode = async () => {
    if (emailCountdown > 0) return;
    await handleSendEmailCode();
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

    if (!emailCodeSent) {
      showAlert('Error', 'Please send email verification code first', undefined, 'error');
      return;
    }

    if (!emailVerificationCode || emailVerificationCode.length < 4) {
      showAlert('Error', 'Please enter the email verification code', undefined, 'error');
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
        verification_code: verificationCode,
        email_verification_code: emailVerificationCode
      });
      
      // Account created successfully, now auto-login
      setLoadingType('auto-login');
      
      try {
        await apiService.login({
          username: email,
          password: password
        });
        
        setIsLoading(false);
        
        // Show success message and navigate to face registration
        setTimeout(() => {
          showAlert(
            'Welcome to FacePe!', 
            'Your account has been created successfully. Let\'s set up face recognition for secure payments.',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/face-registration')
              }
            ],
            'success'
          );
        }, 100);
        
      } catch (loginError: any) {
        setIsLoading(false); // Hide processing animation before showing alert
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
        showAlert('Registration Failed', getErrorMessage(error, 'Registration failed. Please try again.'), undefined, 'error');
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
      case 'emailVerification': return 'Verify Your Email';
      case 'details': return ''; // Remove header text for details step
      default: return 'Sign Up';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'mobile': return 'Enter your mobile number to get started';
      case 'verification': return `Code sent to ${getFullPhoneNumber()}`;
      case 'emailVerification': return `Code sent to ${email}`;
      case 'details': return ''; // Remove subtitle for details step
      default: return '';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'mobile': return 0;
      case 'verification': return 1;
      case 'emailVerification': return 2;
      case 'details': return 3;
      default: return 0;
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
            paddingHorizontal: scale(24), 
            paddingBottom: scale(24) 
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header - Show for mobile, verification, and emailVerification steps */}
            {(step === 'mobile' || step === 'verification' || step === 'emailVerification') && (
              <View style={styles.header}>
                <Text style={styles.title}>{getStepTitle()}</Text>
                <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
                
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={styles.tab}
                    onPress={() => router.replace('/auth/login')}
                  >
                    <Text style={styles.tabText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={[styles.tabText, styles.activeTabText]}>Signup</Text>
                  </TouchableOpacity>
                </View>

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
            )}

            {/* For details step, show minimal header with just tabs and progress */}
            {step === 'details' && (
              <View style={[styles.header, { marginBottom: scale(20) }]}>
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={styles.tab}
                    onPress={() => router.replace('/auth/login')}
                  >
                    <Text style={styles.tabText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={[styles.tabText, styles.activeTabText]}>Signup</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Indicator - All 4 steps active for details */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={[styles.progressLine, styles.progressLineActive]} />
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
                    <Ionicons name="phone-portrait-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                  <View style={{ marginBottom: scale(24) }}>
                    <OTPInput
                      code={verificationCode}
                      setCode={setVerificationCode}
                      variant="grouped"
                    />
                  </View>

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

              {/* Email Verification Step - New separate page for email OTP */}
              {step === 'emailVerification' && (
                <>
                  <View style={{ marginBottom: scale(24) }}>
                    <OTPInput
                      code={emailVerificationCode}
                      setCode={setEmailVerificationCode}
                      variant="grouped"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleVerifyEmailCode}
                    disabled={isLoading || !emailVerificationCode || emailVerificationCode.length < 4}
                  >
                    <LinearGradient
                      colors={['#6B46C1', '#9333EA']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.secondaryButton, (emailCountdown > 0 || isResending) && styles.disabledButton]}
                    onPress={handleResendEmailCode}
                    disabled={emailCountdown > 0 || isResending}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isResending ? 'Sending...' : emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'details' && (
                <>
                  {/* Email entry with popup for verification */}
                  {!emailCodeSent && (
                    <>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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

                      <TouchableOpacity
                        style={[styles.secondaryButton, !email && styles.buttonDisabled]}
                        onPress={handleProceedToEmailVerification}
                        disabled={!email}
                      >
                        <Text style={styles.secondaryButtonText}>Verify Email</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Show verified email badge if email is verified */}
                  {emailCodeSent && emailVerificationCode && (
                    <View style={[styles.inputContainer, { backgroundColor: '#F0FDF4', borderColor: '#10B981', borderWidth: 1 }]}>
                      <Ionicons name="mail-outline" size={scale(20, 18, 24)} color="#10B981" style={styles.inputIcon} />
                      <Text style={[styles.input, { color: '#1F2937' }]}>{email}</Text>
                      <Ionicons name="checkmark-circle" size={scale(20, 18, 24)} color="#10B981" />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                    <Ionicons name="person-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                    <Ionicons name="lock-closed-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                        size={scale(20, 18, 24)} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password Strength Indicator */}
                  <PasswordStrengthIndicator password={password} />

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                        size={scale(20, 18, 24)}
                        color="#999"
                      />
                    </TouchableOpacity>
                    {password && confirmPassword && password === confirmPassword && (
                      <View style={styles.checkMark}>
                        <Ionicons name="checkmark-circle" size={scale(20, 18, 24)} color="#10B981" />
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                    <Ionicons name="keypad-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
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
                        <Ionicons name="checkmark-circle" size={scale(20, 18, 24)} color="#10B981" />
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
                          <Ionicons name="checkmark" size={scale(16, 14, 18)} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        <Text>I agree to the </Text>
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
                          <Ionicons name="checkmark" size={scale(16, 14, 18)} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        <Text>I agree to the </Text>
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
                  onPress={() => router.replace('/auth/login')}
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

      {/* Email Info Modal - Shown before email verification */}
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
            <Text style={styles.modalEmail}>{email}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSendEmailCodeAndProceed}
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
    marginBottom: scale(40),
  },
  title: {
    fontSize: fontScale(28, 24, 32),
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 25,
    padding: scale(4),
    width: scale(200, 180, 240),
    marginBottom: scale(24),
  },
  tab: {
    flex: 1,
    paddingVertical: scale(8),
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    minHeight: 48, // Minimum touch target
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
  eyeButton: {
    padding: scale(4),
    minWidth: 44, // Minimum touch target
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    padding: scale(4),
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: scale(16),
    minHeight: 48, // Minimum touch target
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
    paddingVertical: scale(16, 14, 18),
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: scale(16, 14, 18),
    alignItems: 'center',
    marginBottom: scale(16),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48, // Minimum touch target
  },
  secondaryButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#6B46C1',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: scale(8),
    minHeight: 44, // Minimum touch target
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#6B46C1',
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
    minHeight: scale(24, 22, 28),
  },
  checkboxContainer: {
    marginRight: scale(12),
    width: scale(24, 22, 28),
    height: scale(24, 22, 28),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  termsTextContainer: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: scale(24, 22, 28),
  },
  checkbox: {
    width: scale(20, 18, 24),
    height: scale(20, 18, 24),
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
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    lineHeight: fontScale(20, 18, 22),
    includeFontPadding: false,
  },
  linkText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontScale(14, 12, 16),
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
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: scale(8),
  },
  phoneInput: {
    flex: 1,
    fontSize: fontScale(16, 14, 18),
    color: '#1F2937',
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
