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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function AuthScreen() {
  const { authenticate, securityInfo } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('biometric');
  const router = useRouter();

  useEffect(() => {
    // Auto-trigger authentication on mount
    handleAuthenticate();
  }, []);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const result = await authenticate();
      
      if (result.success) {
        // Authentication successful - navigate to home
        router.replace('/(tabs)');
      } else {
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Centered Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>FacePe</Text>

        {/* Simple Message */}
        <Text style={styles.message}>Authenticate to continue</Text>

        {/* Error Message (if any) */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
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
              <Ionicons name={getBiometricIcon()} size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 160,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: 2,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
