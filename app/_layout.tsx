import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import Toast from 'react-native-toast-message';

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
    if (!loaded || authProps.isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    console.log('Root layout - Auth state:', {
      isAuthenticated: authProps.isAuthenticated,
      inAuthGroup,
      segments
    });

    if (authProps.isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth group, redirect to main app
      console.log('Authenticated user in auth group, redirecting to tabs...');
      router.replace('/(tabs)');
    } else if (!authProps.isAuthenticated && !inAuthGroup) {
      // User is not authenticated but not in auth group, redirect to login
      console.log('Unauthenticated user outside auth group, redirecting to login...');
      router.replace('/auth/login');
    }
  }, [authProps.isAuthenticated, authProps.isLoading, loaded, segments]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthContext.Provider value={authProps}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <Toast />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
