import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../constants/Stripe';
import { notificationService } from '../services/notificationService';
import UpdateService from '../services/updateService';

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
        console.log('✅ Notification service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize notification service:', error);
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
        console.log('🔄 Initializing update service...');
        
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

        console.log('✅ Update service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize update service:', error);
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
    const isAuthenticatedScreen = !inAuthGroup;
    
    console.log('Root layout - Navigation check:', {
      loaded,
      isLoading: authProps.isLoading,
      isAuthenticated: authProps.isAuthenticated,
      hasUser: !!authProps.user,
      inAuthGroup,
      segments: segments.join('/'),
      currentRoute: segments.length > 0 ? segments[segments.length - 1] : 'root'
    });

    // Wait for auth to finish loading before making navigation decisions
    if (authProps.isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    try {
      if (!authProps.isAuthenticated && isAuthenticatedScreen) {
        // User is not authenticated but trying to access protected screens
        console.log('Redirecting unauthenticated user to login');
        router.replace('/auth/login');
      } else if (authProps.isAuthenticated && inAuthGroup) {
        // User is authenticated but in auth group
        console.log('Redirecting authenticated user to main app');
        router.replace('/(tabs)');
      } else if (authProps.isAuthenticated && isAuthenticatedScreen) {
        // User is authenticated and accessing protected screens - this is fine
        console.log('Authenticated user accessing protected screen - OK');
      }
    } catch (error) {
      console.error('Navigation error:', error);
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
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="add-card" />
              <Stack.Screen name="change-password" />
              <Stack.Screen name="transaction-detail" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="dark" translucent={false} backgroundColor="#FFFFFF" />
            <Toast />
          </ThemeProvider>
        </AuthContext.Provider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
