import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { apiService } from '../../services/api';

interface AddPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentMethodAdded: () => void;
  authToken: string;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  visible,
  onClose,
  onPaymentMethodAdded,
  authToken,
}) => {
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { createPaymentMethod } = useStripe();

  const handleAddPaymentMethod = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create PaymentMethod with Stripe.js (tokenize card data)
      // Raw card information never touches our server - Stripe handles it securely
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Stripe error:', error);
        throw new Error(error.message || 'Failed to process card details');
      }

      if (!paymentMethod?.id) {
        throw new Error('Failed to create payment method');
      }

      console.log('PaymentMethod created:', paymentMethod.id);

      // Step 2: Send only the PaymentMethod ID to backend (secure)
      // Backend will fetch card details from Stripe directly
      await apiService.addPaymentMethodSecure({
        stripe_payment_method_id: paymentMethod.id,
        is_default: true, // Usually make the new card default
      });

      Alert.alert('Success', 'Payment method added successfully!');
      onPaymentMethodAdded();
      onClose();

    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add payment method'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Payment Method</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Enter your card details</Text>
          
          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={styles.cardField}
              style={styles.cardFieldWrapper}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={styles.securityInfo}>
            <Text style={styles.securityText}>
              🔒 Your card information is encrypted and secure
            </Text>
            <Text style={styles.securitySubtext}>
              Card details are processed by Stripe and never stored on our servers
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (!cardComplete || loading) && styles.addButtonDisabled,
            ]}
            onPress={handleAddPaymentMethod}
            disabled={!cardComplete || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  cardFieldContainer: {
    marginBottom: 30,
  },
  cardFieldWrapper: {
    width: '100%',
    height: 50,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    fontSize: 16,
  },
  securityInfo: {
    marginBottom: 40,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  securitySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCC',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 