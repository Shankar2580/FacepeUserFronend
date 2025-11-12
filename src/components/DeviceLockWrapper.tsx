import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useAuth as useLoginAuth } from '../../src/hooks/useAuth';

interface DeviceLockWrapperProps {
  children: React.ReactNode;
}

export default function DeviceLockWrapper({ children }: DeviceLockWrapperProps) {
  const { isAuthenticated: isDeviceLockAuthenticated, isLoading, appLockEnabled } = useAuth();
  const { isAuthenticated: isLoggedIn, isLoading: isLoginLoading } = useLoginAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle device lock authentication navigation
  useEffect(() => {
    if (isLoading || isLoginLoading) {
      return;
    }

    const inAuthScreen = segments[0] === 'auth-screen';
    const inWelcomeOrAuth = segments[0] === 'welcome' || segments[0] === 'auth';

    // Only enforce device lock if user is logged in and app lock is enabled
    if (isLoggedIn && appLockEnabled) {
      if (!isDeviceLockAuthenticated && !inAuthScreen && !inWelcomeOrAuth) {
        // User is logged in but not device-authenticated, redirect to auth-screen
        router.replace('/auth-screen');
      }
    }
  }, [isDeviceLockAuthenticated, isLoggedIn, isLoading, isLoginLoading, appLockEnabled, segments]);

  // Show loading indicator while checking authentication
  if (isLoading || isLoginLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
      </View>
    );
  }

  // Render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7FF',
  },
});
