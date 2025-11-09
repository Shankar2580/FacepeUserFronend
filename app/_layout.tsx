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

  // Handle authentication routing
  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === 'auth';
    const isWelcomeScreen = segments[0] === 'welcome';
    const isAuthenticatedScreen = !inAuthGroup && !isWelcomeScreen;
    
    // Navigation debugging removed for production

    // Wait for auth to finish loading before making navigation decisions
    if (authProps.isLoading) {
      // console.log removed for production
      return;
    }

    try {
      if (!authProps.isAuthenticated && isAuthenticatedScreen) {
        // User is not authenticated but trying to access protected screens
        // console.log removed for production
        router.replace('/welcome');
      } else if (authProps.isAuthenticated && (inAuthGroup || isWelcomeScreen)) {
        // User is authenticated but in auth group or welcome screen
        // console.log removed for production
        router.replace('/(tabs)');
      } else if (authProps.isAuthenticated && isAuthenticatedScreen) {
        // User is authenticated and accessing protected screens - this is fine
        // console.log removed for production
      }
    } catch (error) {
      // console.error removed for production
    }
  }, [authProps.isAuthenticated, authProps.isLoading, authProps.user, loaded, segments, router]);

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
