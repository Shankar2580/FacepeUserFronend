import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext, useAuthProvider } from '../src/hooks/useAuth';
import { AuthProvider as DeviceLockAuthProvider } from '../src/contexts/AuthContext';
import DeviceLockWrapper from '../src/components/DeviceLockWrapper';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../src/constants/Stripe';
import { notificationService } from '../src/services/notificationService';
import UpdateService from '../src/services/updateService';
// ErrorBoundary temporarily disabled due to TypeScript config issues

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const authProps = useAuthProvider();
  const router = useRouter();
  const segments = useSegments();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        // console.log removed for production
      } catch (error) {
        // console.error removed for production
      }
    };

    if (loaded) {
      initializeNotifications();
    }
  }, [loaded]);

  // Initialize update service and check for updates
  useEffect(() => {
    const initializeUpdates = async () => {
      try {
        // console.log removed for production
        
        // Check if app was recently updated
        const wasUpdated = await UpdateService.checkIfRecentlyUpdated();
        if (wasUpdated) {
          // Small delay to ensure UI is ready
          setTimeout(() => {
            UpdateService.showUpdateCompleteMessage();
          }, 2000);
        }

        // Check for new updates (with a small delay to not interfere with app startup)
        setTimeout(async () => {
          await UpdateService.checkForUpdatesOnStartup();
        }, 3000);

        // console.log removed for production
      } catch (error) {
        // console.error removed for production
      }
    };

    if (loaded && authProps.isAuthenticated) {
      initializeUpdates();
    }
  }, [loaded, authProps.isAuthenticated]);

  // Handle authentication-based navigation
  useEffect(() => {
    if (!loaded || authProps.isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inWelcome = segments[0] === 'welcome';
    const inAuthScreen = segments[0] === 'auth-screen'; // Device lock screen
    const inProtectedRoute = segments[0] === '(tabs)' || 
                             segments[0] === 'face-registration' ||
                             segments[0] === 'security-settings' ||
                             segments[0] === 'add-card' ||
                             segments[0] === 'change-password' ||
                             segments[0] === 'transaction-detail' ||
                             segments[0] === 'edit-profile' ||
                             segments[0] === 'autopay-settings' ||
                             segments[0] === 'account-management' ||
                             segments[0] === 'delete-account' ||
                             segments[0] === 'pin-reset' ||
                             segments[0] === 'update-face';

    if (authProps.isAuthenticated) {
      // User is authenticated (logged in)
      if (inAuthGroup || inWelcome) {
        // Redirect to home if on auth/welcome screens
        // Note: DeviceLockWrapper will handle redirecting to auth-screen if needed
        router.replace('/(tabs)');
      } else if (segments.length === 0) {
        // No route specified, go to tabs (DeviceLockWrapper will handle device auth)
        router.replace('/(tabs)');
      }
    } else {
      // User is not authenticated (not logged in)
      if (inProtectedRoute || inAuthScreen) {
        // Redirect to welcome if trying to access protected routes or auth-screen
        router.replace('/welcome');
      } else if (segments.length === 0) {
        // No route specified, go to welcome
        router.replace('/welcome');
      }
    }
  }, [authProps.isAuthenticated, authProps.isLoading, loaded, segments]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={STRIPE_CONFIG.PUBLISHABLE_KEY}
        merchantIdentifier={STRIPE_CONFIG.MERCHANT_DISPLAY_NAME}
      >
        <AuthContext.Provider value={authProps}>
          <DeviceLockAuthProvider>
            <ThemeProvider value={DefaultTheme}>
              <DeviceLockWrapper>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="welcome" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="auth-screen" />
                  <Stack.Screen name="security-settings" />
                  <Stack.Screen name="add-card" />
                  <Stack.Screen name="change-password" />
                  <Stack.Screen name="transaction-detail" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </DeviceLockWrapper>
              <StatusBar style="dark" translucent={false} backgroundColor="#FFFFFF" />
              <Toast />
            </ThemeProvider>
          </DeviceLockAuthProvider>
        </AuthContext.Provider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
