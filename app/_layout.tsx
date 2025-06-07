import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../constants/Stripe';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="add-card" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" translucent={false} backgroundColor="#FFFFFF" />
            <Toast />
          </ThemeProvider>
        </AuthContext.Provider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
