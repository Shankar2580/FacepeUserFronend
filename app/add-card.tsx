import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { apiService } from '../services/api';

export default function AddCardScreen() {
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmSetupIntent } = useStripe();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Setup Intent on backend (with customer association)
      console.log('Creating Setup Intent...');
      const { client_secret, setup_intent_id } = await apiService.createSetupIntent();
      console.log('Setup Intent created:', setup_intent_id);

      // Step 2: Confirm Setup Intent with Stripe (securely collects card data)
      const { error } = await confirmSetupIntent(client_secret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Stripe Setup Intent error:', error);
        throw new Error(error.message || 'Failed to process card details');
      }

      console.log('Setup Intent confirmed successfully');

      // Step 3: Backend confirms Setup Intent and saves payment method
      console.log('Confirming Setup Intent with backend:', setup_intent_id);
      const result = await apiService.confirmSetupIntent(setup_intent_id);
      
      if (!result.success) {
        console.error('Backend confirmation failed:', result);
        throw new Error('Failed to save payment method');
      }

      console.log('Payment method saved:', result.payment_method.id);

      Alert.alert('Success', 'Payment method added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Add Your Card</Text>
          <Text style={styles.subtitle}>Enter your card details securely</Text>
        </View>
        
        <View style={styles.cardPreview}>
          <View style={styles.previewCard}>
            <View style={styles.previewChip} />
            <Text style={styles.previewNumber}>•••• •••• •••• ••••</Text>
            <View style={styles.previewFooter}>
              <Text style={styles.previewLabel}>••/••</Text>
              <Text style={styles.previewBrand}>CARD</Text>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Card Information</Text>
          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                textColor: '#1F2937',
                placeholderColor: '#9CA3AF',
                fontSize: 16,
              }}
              style={styles.cardFieldWrapper}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>
        </View>

        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Bank-level Security</Text>
              <Text style={styles.securityText}>
                Your card details are encrypted and processed securely by Stripe
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            (!cardComplete || loading) && styles.addButtonDisabled,
          ]}
          onPress={handleAddCard}
          disabled={!cardComplete || loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.loadingText}>Adding Card...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Test Cards Info */}
        <View style={styles.testInfo}>
          <Text style={styles.testTitle}>Test Cards for Development</Text>
          <View style={styles.testCardRow}>
            <Text style={styles.testCard}>4242 4242 4242 4242</Text>
            <Text style={styles.testStatus}>✅ Success</Text>
          </View>
          <View style={styles.testCardRow}>
            <Text style={styles.testCard}>4000 0000 0000 0002</Text>
            <Text style={styles.testStatusError}>❌ Declined</Text>
          </View>
          <Text style={styles.testSubtext}>Use any future expiry date and any 3-digit CVC</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  cardPreview: {
    marginBottom: 32,
    alignItems: 'center',
  },
  previewCard: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    aspectRatio: 1.586, // Standard credit card ratio
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  previewChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 28,
    borderRadius: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  previewNumber: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  previewBrand: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  formSection: {
    marginBottom: 32,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  cardFieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFieldWrapper: {
    width: '100%',
    height: 56,
  },

  securityInfo: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 32,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityIcon: {
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testInfo: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  testCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testCard: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  testStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  testStatusError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  testSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 16,
  },
}); 