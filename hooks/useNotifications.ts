import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const previousPaymentRequestIds = useRef<string[]>([]);

  const getDisplayName = (request: any) => {
    // Prioritize business_name if available
    if (request.business_name && request.business_name.trim()) {
      return request.business_name;
    }
    
    // Clean up merchant_name if it contains the merchant ID pattern
    if (request.merchant_name) {
      // If merchant_name contains "(acct_...)" pattern, extract just the business name part
      const match = request.merchant_name.match(/^(.+?)\s*\(acct_[^)]+\)$/);
      if (match) {
        return match[1].trim();
      }
      
      // If it's just "Merchant (acct_...)", try to use a fallback
      if (request.merchant_name.startsWith('Merchant (acct_')) {
        return 'Business'; // Generic fallback
      }
      
      return request.merchant_name;
    }
    
    return 'Unknown Merchant';
  };

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
            autoPay.merchant_name.toLowerCase() === getDisplayName(request).toLowerCase() && 
            autoPay.is_enabled &&
            (autoPay.max_amount ? autoPay.max_amount >= request.amount : false)
        );

        if (isAutoPayMerchant) {
          try {
            // Auto-approve the payment
            await apiService.approvePayment(request.id);
            await notificationService.notifyAutoPaymentProcessed({
              merchantName: getDisplayName(request),
              amount: request.amount,
              paymentId: request.id,
            });
          } catch (autoPayError) {
            console.error('Auto-payment failed:', autoPayError);
            // Fallback to manual request notification
            await notificationService.notifyPaymentRequest({
              merchantName: getDisplayName(request),
              amount: request.amount,
              requestId: request.id,
              paymentId: request.id,
              isAutoPayMerchant: false,
            });
          }
        } else {
          // Send notification for manual approval
          await notificationService.notifyPaymentRequest({
            merchantName: getDisplayName(request),
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