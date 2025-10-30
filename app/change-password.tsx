import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';
import { useAlert } from '../src/components/ui/AlertModal';
import { PasswordStrengthIndicator } from '../src/components/ui/PasswordStrengthIndicator';

export default function ChangePasswordScreen() {
  const [step, setStep] = useState<'verification' | 'newPassword'>('verification');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  // Remove auto-send functionality to prevent popup spam

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCode = async () => {
    if (!user?.phone_number) {
      showAlert('Error', 'Phone number not found', undefined, 'error');
      return;
    }

    // Prevent multiple calls
    if (isLoading) return;

    try {
      setIsLoading(true);
      await apiService.requestPasswordReset(user.phone_number);
      setCountdown(60);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to send verification code', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Error', 'Please enter the 6-digit verification code', undefined, 'error');
      return;
    }

    // For now, just move to the next step - we'll verify the code when changing password
    setStep('newPassword');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters long', undefined, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match', undefined, 'error');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.verifyPasswordReset({
        phone_number: user?.phone_number || '',
        verification_code: verificationCode,
        password_reset: {
          new_password: newPassword
        }
      });
      
      showAlert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ], 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to change password', undefined, 'error');
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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F7FF']}
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={24} color="#6B46C1" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
            <View style={styles.placeholder} />
          </View>

          {step === 'verification' ? (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={48} color="#6B46C1" />
              </View>
              
              <Text style={styles.stepTitle}>Verify Your Identity</Text>
              <Text style={styles.stepSubtitle}>
                We'll send a verification code to{'\n'}
                {formatPhoneNumber(user?.phone_number || '')}
              </Text>

              {countdown === 0 && !verificationCode && (
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={() => sendVerificationCode()}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Sending...' : 'Send Code'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {countdown > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="Enter 6-digit code"
                    keyboardType="numeric"
                    maxLength={6}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {countdown > 0 && (
                <TouchableOpacity
                  style={[styles.button, (!verificationCode || isLoading) && styles.disabledButton]}
                  onPress={handleVerifyCode}
                  disabled={!verificationCode || isLoading}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {countdown > 0 && (
                <TouchableOpacity
                  style={[styles.resendButton, countdown > 0 && styles.disabledButton]}
                  onPress={() => sendVerificationCode()}
                  disabled={countdown > 0 || isLoading}
                >
                  <Text style={styles.resendText}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="key" size={48} color="#6B46C1" />
              </View>
              
              <Text style={styles.stepTitle}>Create New Password</Text>
              <Text style={styles.stepSubtitle}>
                Choose a strong password for your account
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
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
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                <PasswordStrengthIndicator password={newPassword} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
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
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, (!newPassword || !confirmPassword || isLoading) && styles.disabledButton]}
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
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    borderRadius: 22,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
    padding: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#6B46C1',
    textAlign: 'center',
  },
}); 