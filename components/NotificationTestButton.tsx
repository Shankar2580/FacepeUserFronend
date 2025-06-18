import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { notificationService } from '../services/notificationService';

interface NotificationTestButtonProps {
  onPress?: () => void;
}

export const NotificationTestButton: React.FC<NotificationTestButtonProps> = ({ onPress }) => {
  const testNotifications = async () => {
    Alert.alert(
      'Test Notifications',
      'Choose notification type to test:',
      [
        {
          text: 'Payment Request',
          onPress: () => {
            notificationService.notifyPaymentRequest({
              merchantName: 'Test Merchant',
              amount: 25.99,
              requestId: 'test-req-123',
              paymentId: 'test-pay-123',
              isAutoPayMerchant: false,
            });
          },
        },
        {
          text: 'Auto Payment',
          onPress: () => {
            notificationService.notifyAutoPaymentProcessed({
              merchantName: 'Auto Test Merchant',
              amount: 15.50,
              paymentId: 'test-auto-123',
            });
          },
        },
        {
          text: 'Payment Approved',
          onPress: () => {
            notificationService.notifyPaymentApproved({
              merchantName: 'Approved Merchant',
              amount: 45.00,
              paymentId: 'test-approved-123',
            });
          },
        },
        {
          text: 'Payment Failed',
          onPress: () => {
            notificationService.notifyPaymentFailed({
              merchantName: 'Failed Merchant',
              amount: 35.75,
              paymentId: 'test-failed-123',
              reason: 'Insufficient funds',
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    
    onPress?.();
  };

  return (
    <TouchableOpacity style={styles.testButton} onPress={testNotifications}>
      <Text style={styles.testButtonText}>🔔 Test Notifications</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 