import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { notificationService } from '../services/notificationService';
import { useAlert } from './ui/AlertModal';

export default function NotificationTestButton() {
  const { showAlert, AlertComponent } = useAlert();

  const testNotifications = async () => {
    try {
      // Test different notification types
      await notificationService.notifyPaymentRequest({
        merchantName: 'Test Merchant',
        amount: 25.50,
        requestId: 'test-request-123',
        paymentId: 'test-payment-123',
        isAutoPayMerchant: false,
      });

      // Wait a bit then test payment approved
      setTimeout(async () => {
        await notificationService.notifyPaymentApproved({
          merchantName: 'Test Merchant',
          amount: 25.50,
          paymentId: 'test-payment-123',
        });
      }, 2000);

      // Wait a bit then test payment declined
      setTimeout(async () => {
        await notificationService.notifyPaymentFailed({
          merchantName: 'Another Merchant',
          amount: 15.75,
          paymentId: 'test-payment-456',
          reason: 'Declined by user',
        });
      }, 4000);

      // Test auto payment
      setTimeout(async () => {
        await notificationService.notifyAutoPaymentProcessed({
          merchantName: 'Auto Pay Merchant',
          amount: 12.99,
          paymentId: 'test-payment-789',
        });
      }, 6000);

      showAlert('Success', 'Test notifications sent! Check your notification panel.', undefined, 'success');
    } catch (error) {
      // console.error removed for production
      showAlert('Error', 'Failed to send test notifications', undefined, 'error');
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={testNotifications}>
        <Text style={styles.buttonText}>🔔 Test Notifications</Text>
      </TouchableOpacity>
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 