import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';

export default function VerificationScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams();
  
  const phoneNumber = params.phone_number as string;
  const firstName = params.first_name as string;
  const lastName = params.last_name as string;
  const password = params.password as string;
  const email = (params.email as string) || '';

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

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = index + 1;
      // Focus logic would be implemented with refs in production
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete verification code');
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
        verification_code: codeToVerify
      });
      
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Please try again');
      setCode(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await apiService.sendVerification({
        phone_number: phoneNumber,
        method: 'sms'
      });
      
      setCountdown(60);
      setCanResend(false);
      Alert.alert('Success', 'Verification code sent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend code');
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
          <View style={styles.codeInputsContainer}>
            <View style={styles.codeInputs}>
              {code.map((digit, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null
                  ]}
                  onPress={() => {
                    // In production, you'd focus the TextInput here
                  }}
                >
                  <Text style={styles.codeInputText}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Simple number pad */}
        <View style={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.numberButton,
                num === '' ? styles.emptyButton : null
              ]}
              onPress={() => {
                if (num === 'delete') {
                  const lastFilledIndex = code.findLastIndex(digit => digit !== '');
                  if (lastFilledIndex >= 0) {
                    handleCodeChange('', lastFilledIndex);
                  }
                } else if (num !== '') {
                  const firstEmptyIndex = code.findIndex(digit => digit === '');
                  if (firstEmptyIndex >= 0) {
                    handleCodeChange(num.toString(), firstEmptyIndex);
                  }
                }
              }}
              disabled={num === ''}
            >
              {num === 'delete' ? (
                <Ionicons name="backspace" size={24} color="#1F2937" />
              ) : (
                <Text style={styles.numberButtonText}>{num}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.resendButton, !canResend && styles.disabledButton]}
            onPress={handleResend}
            disabled={!canResend}
          >
            <Text style={[styles.resendText, !canResend && styles.disabledText]}>
              {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.disabledButton]}
            onPress={() => handleVerify()}
            disabled={isLoading || code.some(digit => digit === '')}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
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
    marginBottom: 40,
  },
  codeLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
    fontWeight: '500',
  },
  codeInputsContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  codeInputs: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInputFilled: {
    borderColor: '#6B46C1',
    backgroundColor: '#F8F7FF',
  },
  codeInputText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    gap: 16,
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