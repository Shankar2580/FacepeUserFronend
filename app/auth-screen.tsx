import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import DeviceLockService from '../src/services/DeviceLockService';

export default function AuthScreen() {
  const { authenticate, securityInfo } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('biometric');

  useEffect(() => {
    // Auto-trigger authentication on mount
    handleAuthenticate();
  }, []);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const result = await authenticate();
      
      if (!result.success) {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (!securityInfo) return 'finger-print';
    
    if (securityInfo.biometricTypes.includes('Face ID')) {
      return 'scan';
    } else if (securityInfo.biometricTypes.includes('Fingerprint')) {
      return 'finger-print';
    } else {
      return 'lock-closed';
    }
  };

  const getBiometricLabel = () => {
    if (!securityInfo) return 'Biometric';
    
    if (securityInfo.biometricTypes.includes('Face ID')) {
      return 'Face ID';
    } else if (securityInfo.biometricTypes.includes('Fingerprint')) {
      return 'Fingerprint';
    } else {
      return 'Device Lock';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1F2937', '#374151', '#4B5563']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* App Logo/Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.appName}>FacePe</Text>
          <Text style={styles.tagline}>Secure Payment Made Simple</Text>
        </View>

        {/* Authentication Section */}
        <View style={styles.authSection}>
          <View style={styles.lockIconContainer}>
            <View style={styles.lockIconCircle}>
              <Ionicons
                name={getBiometricIcon()}
                size={48}
                color="#6B46C1"
              />
            </View>
          </View>

          <Text style={styles.title}>Unlock FacePe</Text>
          <Text style={styles.subtitle}>
            Use {getBiometricLabel()} or your device PIN to continue
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              {error.includes('Device lock not detected') && (
                <View style={styles.helpContainer}>
                  <Text style={styles.helpTitle}>How to set up device lock:</Text>
                  <Text style={styles.helpText}>
                    1. Go to Settings on your device{'\n'}
                    2. Find Security or Lock Screen{'\n'}
                    3. Set up PIN, Pattern, Password, or Biometric{'\n'}
                    4. Return to FacePe and try again
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Authenticate Button */}
          <TouchableOpacity
            style={[styles.button, isAuthenticating && styles.buttonDisabled]}
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name={getBiometricIcon()} size={24} color="#6B46C1" />
                <Text style={styles.buttonText}>Authenticate</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Info */}
          {securityInfo && securityInfo.biometricAvailable && (
            <View style={styles.infoContainer}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.infoText}>
                Protected by {securityInfo.biometricTypes.join(' & ')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.footerText}>
            Your data is secured with device encryption
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  authSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockIconContainer: {
    marginBottom: 24,
  },
  lockIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  helpContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 220,
    gap: 12,
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#6B46C1',
    fontSize: 18,
    fontWeight: '700',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoText: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
