import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import DeviceLockService from '../services/DeviceLockService';

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  appLockEnabled: false,
  securityInfo: null,
  authenticate: async () => {},
  setAuthenticated: () => {},
  checkAppLockStatus: async () => {},
  toggleAppLock: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appLockEnabled, setAppLockEnabled] = useState(true); // Always enabled
  const [securityInfo, setSecurityInfo] = useState(null);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);

  // Check app lock status on mount - ALWAYS ENABLED
  useEffect(() => {
    checkAppLockStatus();
  }, []);

  // Listen for app state changes with improved logic
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appState.current;
      appState.current = nextAppState;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background - record the time
        backgroundTime.current = Date.now();
      } else if (nextAppState === 'active' && previousState.match(/inactive|background/)) {
        // App came back to foreground
        const timeInBackground = backgroundTime.current ? Date.now() - backgroundTime.current : 0;
        
        // ONLY require re-authentication if app was in background for more than 5 minutes (300 seconds)
        // Ignore first launch flag to prevent double authentication
        // User will authenticate once when first opening the app (via auth-screen auto-trigger)
        if (timeInBackground > 300000) { // 5 minutes = 300000ms
          setIsAuthenticated(false);
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkAppLockStatus = async () => {
    try {
      setIsLoading(true);
      const info = await DeviceLockService.getSecurityInfo();
      
      // App lock is ALWAYS enabled
      setAppLockEnabled(true);
      setSecurityInfo(info);

      // User must authenticate - never automatically authenticated
      setIsAuthenticated(false);
    } catch (error) {

      // Even on error, require authentication
      setAppLockEnabled(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    try {
      const result = await DeviceLockService.authenticateWithFallback();
      
      if (result.success) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Authentication failed' 
        };
      }
    } catch (error) {

      return { 
        success: false, 
        error: error.message || 'Authentication failed' 
      };
    }
  };

  const setAuthenticated = (value) => {
    setIsAuthenticated(value);
  };

  const toggleAppLock = async (enabled) => {
    // App lock is ALWAYS enabled - cannot be toggled off
    return { 
      success: false, 
      error: 'App lock is always enabled for security' 
    };
  };

  const value = {
    isAuthenticated,
    isLoading,
    appLockEnabled,
    securityInfo,
    authenticate,
    setAuthenticated,
    checkAppLockStatus,
    toggleAppLock,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
