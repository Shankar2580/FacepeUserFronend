import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProcessingAnimation } from '../../src/components/ui/ProcessingAnimation';
import { useAuth } from '../../src/hooks/useAuth';
import { getAuthError } from '../../src/utils/errorHandler';
import { fontScale, scale } from '../../src/utils/responsive';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState(''); // mobile number or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldType, setFieldType] = useState<'email' | 'phone' | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const router = useRouter();
  const { login } = useAuth();


  const detectFieldType = (input: string) => {
    if (!input) {
      setFieldType(null);
      return;
    }
    
    const trimmed = input.trim();
    if (validateEmail(trimmed)) {
      setFieldType('email');
    } else if (/^[\d\s\-\+]+$/.test(trimmed)) {
      setFieldType('phone');
    } else {
      setFieldType(null);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  };

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    detectFieldType(text);
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your mobile number/email and password');
      return;
    }

    // Determine if identifier is email or phone number
    const isEmail = validateEmail(identifier);
    let processedIdentifier = identifier.trim();
    
    // If it's not an email and looks like a phone number (only digits), add +1
    if (!isEmail) {
      // Remove any spaces or dashes
      const cleanedNumber = processedIdentifier.replace(/[\s-]/g, '');
      
      // Check if it's only digits (no + prefix)
      if (/^\d+$/.test(cleanedNumber)) {
        // Add +1 prefix for US numbers
        processedIdentifier = `+1${cleanedNumber}`;
      }
    }
    
    const isPhone = validatePhoneNumber(processedIdentifier);

    if (!isEmail && !isPhone) {
      Alert.alert('Error', 'Please enter a valid mobile number or email address');
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects 'username' field for both email and phone number
      const loginData = { 
        username: processedIdentifier, 
        password 
      };
      
      await login(loginData);
      
      // Reset login attempts on success
      setLoginAttempts(0);
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      setIsLoading(false);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Use centralized error handler for clean, user-friendly messages
      const errMsg = getAuthError(error);
      router.replace('/auth/login');
      
      // Use InteractionManager to ensure alert shows AFTER all state updates complete
      InteractionManager.runAfterInteractions(() => {
        const buttons: any[] = [
          {
            text: 'OK',
            onPress: () => {},
          },
        ];
        
        // After 2 failed attempts, suggest forgot password
        if (newAttempts >= 2) {
          buttons.unshift({
            text: 'Forgot Password?',
            onPress: () => {
              // Pre-fill identifier if it's a phone number
              const cleanedNumber = identifier.replace(/[\s\-]/g, '');
              if (/^\d+$/.test(cleanedNumber)) {
                router.push(`/auth/forgot-password?phone=${cleanedNumber}`);
              } else {
                router.push('/auth/forgot-password');
              }
            },
            style: 'default',
          });
        }
        
        Alert.alert(
          'Login Failed',
          newAttempts >= 2 
            ? `${errMsg}\n\nTrouble logging in? Try resetting your password.`
            : errMsg,
          buttons,
          { cancelable: false }
        );
      });
    }
  };

  return (
    <>
      {/* Processing animation overlay - always rendered */}
      {isLoading && (
        <ProcessingAnimation
          visible={isLoading}
          type="generic"
          title="Signing In"
          subtitle="Please wait while we authenticate your account"
        />
      )}
      
      {/* Main content */}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* keeps text below the notch on both OSes */}
        <StatusBar style="dark" translucent={false} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 32}
          style={{ flex: 1 }}
        >
          {/* makes long forms scroll past the keyboard */}
          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingHorizontal: scale(24), 
              paddingBottom: scale(16),
              justifyContent: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
                
                <View style={styles.tabContainer}>
                  <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                    <Text style={[styles.tabText, styles.activeTabText]}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.tab}
                    onPress={() => router.replace('/auth/register')}
                  >
                    <Text style={styles.tabText}>Signup</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={scale(20, 18, 24)} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number or Email"
                    placeholderTextColor="#999"
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {fieldType && (
                    <View style={styles.fieldTypeBadge}>
                      <Ionicons 
                        name={fieldType === 'email' ? 'mail' : 'call'} 
                        size={12} 
                        color="#6B46C1" 
                      />
                      <Text style={styles.fieldTypeBadgeText}>
                        {fieldType === 'email' ? 'Email' : 'Phone'}
                      </Text>
                    </View>
                  )}
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

                <View style={styles.optionsRow}>
                  <View />
                  <TouchableOpacity 
                    style={styles.forgotPasswordButton}
                    onPress={() => {
                      const cleanedNumber = identifier.replace(/[\s\-]/g, '');
                      if (/^\d+$/.test(cleanedNumber)) {
                        router.push(`/auth/forgot-password?phone=${cleanedNumber}`);
                      } else {
                        router.push('/auth/forgot-password');
                      }
                    }}
                  >
                    <Text style={[styles.forgotPasswordText, loginAttempts >= 2 && styles.forgotPasswordHighlight]}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#6B46C1', '#9333EA']}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>


              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account?{' '}
                  <Text 
                    style={styles.footerLink}
                    onPress={() => router.replace('/auth/register')}
                  >
                    Sign Up
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
    marginBottom: scale(48),
  },
  title: {
    fontSize: fontScale(32, 28, 36),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    marginBottom: scale(32),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 25,
    padding: scale(4),
    width: scale(200, 180, 240),
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
  form: {
    marginBottom: scale(40),
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
  fieldTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 12,
    gap: scale(4),
  },
  fieldTypeBadgeText: {
    fontSize: fontScale(11, 10, 12),
    color: '#6B46C1',
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  forgotPasswordButton: {
    minHeight: 44, // Minimum touch target
    justifyContent: 'center',
    paddingVertical: scale(8),
  },
  forgotPasswordText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B46C1',
    fontWeight: '600',
  },
  forgotPasswordHighlight: {
    color: '#9333EA',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
  loginButtonGradient: {
    paddingVertical: scale(16, 14, 18),
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scale(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: scale(16),
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(16),
  },
  socialButton: {
    width: scale(56, 48, 64),
    height: scale(56, 48, 64),
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48, // Minimum touch target
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});
