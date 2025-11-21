import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

interface PaymentRequestState {
  id: string;
  status: string;
}

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);
  // Store both ID and status to detect changes
  const previousPaymentRequests = useRef<PaymentRequestState[]>([]);
  const onRequestsUpdatedRef = useRef<(() => void) | null>(null);

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

  const checkForPaymentRequestUpdates = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const [requests, autoPaySettings] = await Promise.all([
        apiService.getPaymentRequests(),
        apiService.getAutoPay().catch(() => [])
      ]);

      // Track ALL requests (not just pending) to detect cancellations
      const allCurrentRequests = requests.map(req => ({
        id: req.id,
        status: req.status.toLowerCase(),
        request: req
      }));

      const pendingRequests = requests.filter(request => request.status === 'pending');
      
      // Find new pending requests
      const newRequests = pendingRequests.filter(
        req => !previousPaymentRequests.current.some(prev => prev.id === req.id)
      );

      // Find cancelled/failed requests (were pending, now failed/cancelled)
      const cancelledRequests = previousPaymentRequests.current.filter(prev => {
        const current = allCurrentRequests.find(curr => curr.id === prev.id);
        // Check if status changed from pending to failed/completed
        return prev.status === 'pending' && 
               current && 
               (current.status === 'failed' || current.status === 'completed');
      });

      // Update the reference with current pending requests only
      previousPaymentRequests.current = pendingRequests.map(req => ({
        id: req.id,
        status: req.status.toLowerCase()
      }));

      // Notify about cancelled requests
      for (const cancelledReq of cancelledRequests) {
        const cancelledRequest = allCurrentRequests.find(r => r.id === cancelledReq.id)?.request;
        if (cancelledRequest) {
          await notificationService.notifyPaymentFailed({
            merchantName: getDisplayName(cancelledRequest),
            amount: cancelledRequest.amount,
            paymentId: cancelledRequest.id,
            reason: 'Payment request cancelled by merchant',
          });
        }
      }

      // If there were cancellations, trigger UI update
      if (cancelledRequests.length > 0 && onRequestsUpdatedRef.current) {
        onRequestsUpdatedRef.current();
      }

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
            // console.error removed for production
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
      // console.error removed for production
    }
  };

  // Register callback for when requests are updated
  const registerUpdateCallback = (callback: () => void) => {
    onRequestsUpdatedRef.current = callback;
  };

  const startPeriodicCheck = () => {
    // Check every 10 seconds when app is active (faster to catch cancellations)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      checkForPaymentRequestUpdates();
    }, 10000); // 10 seconds for faster updates
  };

  const stopPeriodicCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App became active - check for updates and start periodic checking
      checkForPaymentRequestUpdates();
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
    checkForPaymentRequestUpdates();
    
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
    checkForPaymentRequestUpdates,
    registerUpdateCallback,
    notificationService,
  };
}; 
