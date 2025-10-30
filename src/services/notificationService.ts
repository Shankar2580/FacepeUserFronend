import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { apiService } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PaymentNotificationData {
  [key: string]: unknown;
  type: 'payment_request' | 'payment_approved' | 'payment_failed' | 'payment_declined' | 'auto_payment_processed';
  paymentId: string;
  merchantName: string;
  amount: number;
  requestId?: string;
  isAutoPayMerchant?: boolean;
  reason?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    try {
      // Request permissions
      await this.registerForPushNotifications();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
    }
  }

  private async registerForPushNotifications() {
    if (!Device.isDevice) {
      // console.log removed for production
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // console.log removed for production
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '9e1f0d76-0db2-4b5e-b263-3fb11c9e737b', // Use the correct project ID from app.json
      });
      this.expoPushToken = token.data;
      // console.log removed for production
      
      // Send token to backend server
      await this.sendTokenToBackend(this.expoPushToken);
      
    } catch (error) {
      // console.error removed for production
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('payment-notifications', {
        name: 'Payment Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B46C1',
      });
    }
  }

  private async sendTokenToBackend(token: string) {
    try {
      await apiService.updatePushToken(token);
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
    }
  }

  private setupNotificationListeners() {
    // Listener for when notification is received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      // console.log removed for production
    });

    // Listener for when user taps on notification
    Notifications.addNotificationResponseReceivedListener(response => {
      // console.log removed for production
      this.handleNotificationTap(response.notification.request.content.data as PaymentNotificationData);
    });
  }

  private handleNotificationTap(data: PaymentNotificationData) {
    // console.log removed for production
    
    switch (data.type) {
      case 'payment_request':
        if (!data.isAutoPayMerchant) {
          // Navigate to payment request details or approval screen
          router.push('/(tabs)/' as any); // Main screen where payment requests are shown
        }
        break;
        
              case 'payment_approved':
      case 'payment_failed':
      case 'payment_declined':
      case 'auto_payment_processed':
        // Navigate to transaction detail in history
        if (data.paymentId) {
          router.push(`/transaction-detail?id=${data.paymentId}`);
        } else {
          router.push('/(tabs)/history');
        }
        break;
        
      default:
        // console.log removed for production
    }
  }

  // Send notification when user receives a payment request
  async notifyPaymentRequest(data: {
    merchantName: string;
    amount: number;
    requestId: string;
    paymentId: string;
    isAutoPayMerchant: boolean;
  }) {
    const notificationData: PaymentNotificationData = {
      type: 'payment_request',
      paymentId: data.paymentId,
      merchantName: data.merchantName,
      amount: data.amount,
      requestId: data.requestId,
      isAutoPayMerchant: data.isAutoPayMerchant,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💳 Payment Request',
        body: `${data.merchantName} is requesting $${data.amount.toFixed(2)}${data.isAutoPayMerchant ? ' (Auto-approved)' : ''}`,
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  }

  // Send notification when payment is approved
  async notifyPaymentApproved(data: {
    merchantName: string;
    amount: number;
    paymentId: string;
  }) {
    const notificationData: PaymentNotificationData = {
      type: 'payment_approved',
      paymentId: data.paymentId,
      merchantName: data.merchantName,
      amount: data.amount,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Payment Approved',
        body: `Payment of $${data.amount.toFixed(2)} to ${data.merchantName} was successful`,
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
  }

  // Send notification when payment fails
  async notifyPaymentFailed(data: {
    merchantName: string;
    amount: number;
    paymentId: string;
    reason?: string;
  }) {
    const notificationData: PaymentNotificationData = {
      type: data.reason === 'Declined by user' ? 'payment_declined' : 'payment_failed',
      paymentId: data.paymentId,
      merchantName: data.merchantName,
      amount: data.amount,
      reason: data.reason,
    };

    const isDeclined = data.reason === 'Declined by user';
    const title = isDeclined ? '🚫 Payment Declined' : '❌ Payment Failed';
    const body = isDeclined 
      ? `You declined payment of $${data.amount.toFixed(2)} to ${data.merchantName}`
      : `Payment of $${data.amount.toFixed(2)} to ${data.merchantName} failed${data.reason ? `: ${data.reason}` : ''}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  // Send notification when auto payment is processed
  async notifyAutoPaymentProcessed(data: {
    merchantName: string;
    amount: number;
    paymentId: string;
  }) {
    const notificationData: PaymentNotificationData = {
      type: 'auto_payment_processed',
      paymentId: data.paymentId,
      merchantName: data.merchantName,
      amount: data.amount,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Auto Payment Processed',
        body: `Auto payment of $${data.amount.toFixed(2)} to ${data.merchantName} was processed`,
        data: notificationData,
        sound: false, // Less intrusive for auto payments
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
  }

  // Clear all notifications
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Clear specific notification
  async clearNotification(notificationId: string) {
    await Notifications.dismissNotificationAsync(notificationId);
  }

  // Get notification permission status
  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Get push token
  getPushToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService(); 