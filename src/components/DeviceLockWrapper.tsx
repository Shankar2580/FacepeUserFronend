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

  useEffect(() => {
    if (isLoading || isLoginLoading) return;

    const inAuthScreen = segments[0] === 'auth-screen';
    const inAuthGroup = segments[0] === 'auth';
    const currentPath = segments.join('/');
    
    // Only show device lock if user is already logged in
    // If user is not logged in, let the login auth handle it
    if (isLoggedIn && appLockEnabled && !isDeviceLockAuthenticated && !inAuthScreen) {
      // User is logged in but needs device authentication
      router.replace('/auth-screen');
    } else if (isDeviceLockAuthenticated && inAuthScreen) {
      // Device authenticated, navigate away from auth screen
      router.replace('/(tabs)');
    }
  }, [isDeviceLockAuthenticated, isLoggedIn, isLoading, isLoginLoading, appLockEnabled, segments, router]);

  // Show loading indicator while checking authentication
  if (isLoading || isLoginLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
      </View>
    );
  }

  // Always render children - let routing handle the screens
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
