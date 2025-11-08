import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

interface UseScreenSecurityOptions {
  preventScreenshots?: boolean;
  onSecurityViolation?: () => void;
}

export const useScreenSecurity = (options: UseScreenSecurityOptions = {}) => {
  const {
    preventScreenshots = true,
    onSecurityViolation,
  } = options;

  const [isSecured, setIsSecured] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const enableSecurity = async () => {
      try {
        if (preventScreenshots) {
          await ScreenCapture.preventScreenCaptureAsync();
        }

        if (mounted) {
          setIsSecured(true);
        }
      } catch (error) {
        // Silent fail - security is optional
      }
    };

    const disableSecurity = async () => {
      try {
        if (preventScreenshots) {
          await ScreenCapture.allowScreenCaptureAsync();
        }

        if (mounted) {
          setIsSecured(false);
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (mounted) {
        setAppState(nextAppState);
        
        // If app goes to background, ensure security is disabled to avoid issues
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          disableSecurity();
        } else if (nextAppState === 'active') {
          enableSecurity();
        }
      }
    };

    // Enable security when component mounts
    enableSecurity();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription?.remove();
      disableSecurity();
      mounted = false;
    };
  }, [preventScreenshots, onSecurityViolation]);

  // Manual control functions
  const enableScreenSecurity = async () => {
    try {
      if (preventScreenshots) {
        await ScreenCapture.preventScreenCaptureAsync();
      }
      setIsSecured(true);
    } catch (error) {
      // Silent fail
    }
  };

  const disableScreenSecurity = async () => {
    try {
      if (preventScreenshots) {
        await ScreenCapture.allowScreenCaptureAsync();
      }
      setIsSecured(false);
    } catch (error) {
      // Silent fail
    }
  };

  return {
    isSecured,
    appState,
    enableScreenSecurity,
    disableScreenSecurity,
  };
};
