import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  // Use a try-catch to safely access useAuth - if we're not in an AuthProvider yet, just return early
  let isAuthenticated = false;
  let user = null;
  
  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
    user = authContext.user;
  } catch (error) {
    // useAuth is not available yet - component is being called before AuthProvider is initialized
    console.log('useNotifications: AuthProvider not available yet, skipping notifications setup');
  }
  const intervalRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const previousPaymentRequestIds = useRef<string[]>([]);

  const checkForNewPaymentRequests = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const [requests, autoPaySettings] = await Promise.all([
        apiService.getPaymentRequests(),
        apiService.getAutoPay().catch(() => [])
      ]);

      const pendingRequests = requests.filter(request => request.status === 'pending');
      const currentRequestIds = pendingRequests.map(req => req.id);
      
      // Find new requests
      const newRequests = pendingRequests.filter(
        req => !previousPaymentRequestIds.current.includes(req.id)
      );

      // Update the reference
      previousPaymentRequestIds.current = currentRequestIds;

      // Process new requests
      for (const request of newRequests) {
        const isAutoPayMerchant = autoPaySettings.some(
          autoPay => 
            autoPay.merchant_name.toLowerCase() === request.merchant_name.toLowerCase() && 
            autoPay.is_enabled &&
            (autoPay.max_amount ? autoPay.max_amount >= request.amount : false)
        );

        if (isAutoPayMerchant) {
          try {
            // Auto-approve the payment
            await apiService.approvePayment(request.id);
            await notificationService.notifyAutoPaymentProcessed({
              merchantName: request.merchant_name,
              amount: request.amount,
              paymentId: request.id,
            });
          } catch (autoPayError) {
            console.error('Auto-payment failed:', autoPayError);
            // Fallback to manual request notification
            await notificationService.notifyPaymentRequest({
              merchantName: request.merchant_name,
              amount: request.amount,
              requestId: request.id,
              paymentId: request.id,
              isAutoPayMerchant: false,
            });
          }
        } else {
          // Send notification for manual approval
          await notificationService.notifyPaymentRequest({
            merchantName: request.merchant_name,
            amount: request.amount,
            requestId: request.id,
            paymentId: request.id,
            isAutoPayMerchant: false,
          });
        }
      }
    } catch (error) {
      console.error('Error checking for payment requests:', error);
    }
  };

  const startPeriodicCheck = () => {
    // Check every 30 seconds when app is active
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      checkForNewPaymentRequests();
    }, 30000); // 30 seconds
  };

  const stopPeriodicCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App became active - check for new requests and start periodic checking
      checkForNewPaymentRequests();
      startPeriodicCheck();
    } else {
      // App went to background - stop periodic checking
      stopPeriodicCheck();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      stopPeriodicCheck();
      return;
    }

    // Initial check
    checkForNewPaymentRequests();
    
    // Start periodic checking
    startPeriodicCheck();

    // Listen for app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopPeriodicCheck();
      appStateSubscription?.remove();
    };
  }, [isAuthenticated, user]);

  return {
    checkForNewPaymentRequests,
    notificationService,
  };
}; 