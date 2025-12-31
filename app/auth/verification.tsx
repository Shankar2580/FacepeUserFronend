import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlert } from '../../src/components/ui/AlertModal';
import { OTPInput } from '../../src/components/ui/OTPInput';
import { useAuth } from '../../src/hooks/useAuth';
import { apiService } from '../../src/services/api';
import { getVerificationError } from '../../src/utils/errorHandler';
import { fontScale, scale } from '../../src/utils/responsive';

export default function VerificationScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams();
  const { showAlert, AlertComponent } = useAlert();
  const isScreenFocused = useRef(true);
  
  const phoneNumber = params.phone_number as string;
  const firstName = params.first_name as string;
  const lastName = params.last_name as string;
  const password = params.password as string;
  const email = (params.email as string) || '';

  // Track screen focus to prevent alerts when user navigates away
  useFocusEffect(
    React.useCallback(() => {
      isScreenFocused.current = true;
      return () => {
        isScreenFocused.current = false;
      };
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code;
    
    if (codeToVerify.length !== 6) {
      showAlert('Error', 'Please enter the complete verification code', undefined, 'error');
      return;
    }

    setIsLoading(true);
    try {
      // First verify the code
      await apiService.verifyCode({
        phone_number: phoneNumber,
        code: codeToVerify
      });
      
      // Then register the user
      await register({
        phone_number: phoneNumber,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password: password,
        verification_code: codeToVerify,
        pin: ''
      });
      
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert('Verification Failed', getVerificationError(error), undefined, 'error');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    try {
      await apiService.sendVerification({
        phone_number: phoneNumber,
        method: 'sms'
      });
      
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      // Only show alert if screen is still focused
      if (isScreenFocused.current) {
        showAlert('Error', getVerificationError(error), undefined, 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length > 6) {
      return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait" size={48} color="#6B46C1" />
          </View>
          <Text style={styles.title}>Phone Verification</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            <Text style={styles.phoneText}>{formatPhoneNumber(phoneNumber)}</Text>
          </Text>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Enter verification code</Text>
          <OTPInput
            code={code}
            setCode={setCode}
            variant="grouped"
            onComplete={(completedCode) => handleVerify(completedCode)}
            autoFocus
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.resendButton, (!canResend || isResending) && styles.disabledButton]}
            onPress={handleResend}
            disabled={!canResend || isResending}
          >
            <Text style={[styles.resendText, (!canResend || isResending) && styles.disabledText]}>
              {isResending ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.disabledButton]}
            onPress={() => handleVerify()}
            disabled={isLoading || code.length !== 6}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.1)',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: scale(24),
  },
  codeLabel: {
    fontSize: fontScale(16),
    color: '#1F2937',
    marginBottom: scale(16),
    fontWeight: '500',
  },
  footer: {
    gap: scale(20),
    marginTop: scale(8),
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '500',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  verifyButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 
