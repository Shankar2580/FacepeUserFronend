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
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
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
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  helpTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.9)',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    gap: 6,
  },
  infoText: {
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
