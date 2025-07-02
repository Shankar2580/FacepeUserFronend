import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe, CardFieldInput } from '@stripe/stripe-react-native';
import { apiService } from '../services/api';
import { PaymentCard } from '../components/ui/PaymentCard';
import { CardSuccessModal } from '../components/ui/CardSuccessModal';

// Define types for card details
interface CardDetails {
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  complete: boolean;
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

function AddCardContent() {
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedCardDetails, setAddedCardDetails] = useState<{brand?: string; last4?: string} | null>(null);
  const [addedCardIsDefault, setAddedCardIsDefault] = useState<boolean>(false);
  const { confirmSetupIntent } = useStripe();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
    console.log(`[AddCard Debug] ${info}`);
  };

  const handleAddCard = async () => {
    try {
      addDebugInfo('Starting add card process...');
      
      if (!cardComplete) {
        addDebugInfo('Card details incomplete');
        Alert.alert('Error', 'Please enter complete card details');
        return;
      }

      // Validate Stripe hook is available
      if (!confirmSetupIntent) {
        addDebugInfo('Stripe confirmSetupIntent hook not available');
        throw new Error('Stripe not properly initialized. Please try restarting the app.');
      }

      setLoading(true);
      addDebugInfo('Setting loading state to true');

      // Step 1: Create Setup Intent on backend (with customer association)
      addDebugInfo('Step 1: Creating Setup Intent...');
      
      let setupIntentResult;
      try {
        setupIntentResult = await apiService.createSetupIntent();
        addDebugInfo(`Setup Intent created successfully: ${setupIntentResult.setup_intent_id}`);
      } catch (apiError: any) {
        addDebugInfo(`API Error creating setup intent: ${apiError.message}`);
        console.error('API Error details:', apiError);
        
        if (apiError.response) {
          addDebugInfo(`API Response status: ${apiError.response.status}`);
          addDebugInfo(`API Response data: ${JSON.stringify(apiError.response.data)}`);
        }
        
        throw new Error(`Failed to create setup intent: ${apiError.message}`);
      }

      const { client_secret, setup_intent_id } = setupIntentResult;
      
      if (!client_secret) {
        addDebugInfo('No client_secret received from backend');
        throw new Error('Invalid setup intent response from server');
      }

      // Step 2: Confirm Setup Intent with Stripe (securely collects card data)
      addDebugInfo('Step 2: Confirming Setup Intent with Stripe...');
      
      let stripeResult;
      try {
        stripeResult = await confirmSetupIntent(client_secret, {
          paymentMethodType: 'Card',
        });
        addDebugInfo('Stripe Setup Intent confirmation completed');
      } catch (stripeError: any) {
        addDebugInfo(`Stripe Error: ${stripeError.message}`);
        console.error('Stripe Error details:', stripeError);
        throw new Error(`Stripe error: ${stripeError.message}`);
      }

      if (stripeResult.error) {
        addDebugInfo(`Stripe Setup Intent error: ${stripeResult.error.message}`);
        console.error('Stripe Setup Intent error:', stripeResult.error);
        throw new Error(stripeResult.error.message || 'Failed to process card details with Stripe');
      }

      addDebugInfo('Stripe Setup Intent confirmed successfully');

      // Step 3: Backend confirms Setup Intent and saves payment method
      addDebugInfo(`Step 3: Confirming Setup Intent with backend: ${setup_intent_id}`);
      
      let confirmResult;
      try {
        confirmResult = await apiService.confirmSetupIntent(setup_intent_id);
        addDebugInfo('Backend confirmation completed');
      } catch (confirmError: any) {
        addDebugInfo(`Backend confirmation error: ${confirmError.message}`);
        console.error('Backend confirmation error:', confirmError);
        
        if (confirmError.response) {
          addDebugInfo(`Confirm API Response status: ${confirmError.response.status}`);
          addDebugInfo(`Confirm API Response data: ${JSON.stringify(confirmError.response.data)}`);
        }
        
        throw new Error(`Failed to confirm setup intent: ${confirmError.message}`);
      }
      
      if (!confirmResult.success) {
        addDebugInfo('Backend confirmation returned success: false');
        console.error('Backend confirmation failed:', confirmResult);
        throw new Error('Failed to save payment method on server');
      }

      addDebugInfo(`Payment method saved successfully: ${confirmResult.payment_method.id}`);

      // Capture default status to control "Default" badge in success modal
      setAddedCardIsDefault(!!confirmResult.payment_method.is_default);

      // Store card details for success modal
      setAddedCardDetails({
        brand: cardDetails?.brand,
        last4: cardDetails?.last4
      });

      // Show success modal instead of alert
      setShowSuccessModal(true);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugInfo(`Final error: ${errorMessage}`);
      console.error('Complete error in handleAddCard:', error);
      
      Alert.alert(
        'Error',
        `Failed to add payment method: ${errorMessage}`,
        [
          {
            text: 'Show Debug Info',
            onPress: () => {
              Alert.alert('Debug Information', debugInfo, [
                { text: 'OK' }
              ]);
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } finally {
      addDebugInfo('Cleaning up - setting loading to false');
      setLoading(false);
    }
  };

  const updateCardPreview = (details: CardFieldInput.Details) => {
    try {
      addDebugInfo(`Card details updated: ${details.brand} ending in ${details.last4}, complete: ${details.complete}`);
      const cardInfo: CardDetails = {
        brand: details.brand,
        last4: details.last4,
        expiryMonth: details.expiryMonth,
        expiryYear: details.expiryYear,
        complete: details.complete
      };
      setCardDetails(cardInfo);
      setCardComplete(details.complete);
    } catch (error: any) {
      addDebugInfo(`Error updating card preview: ${error.message}`);
      console.error('Error in updateCardPreview:', error);
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjusted offset for iOS
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Add New Card</Text>
            <Text style={styles.subtitle}>
              Securely add your payment method using bank-level encryption
            </Text>
          </View>

          {/* Card Preview */}
          <View style={styles.cardPreview}>
            <PaymentCard
              cardDetails={cardDetails || undefined}
              variant="preview"
              isPreview={true}
            />
          </View>

          {/* Enhanced Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Card Information</Text>
            <View style={[
              styles.cardFieldContainer,
              cardComplete && styles.cardFieldContainerValid
            ]}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '1234 5678 9012 3456',
                }}
                cardStyle={{
                  textColor: '#1F2937',
                  placeholderColor: '#9CA3AF',
                  fontSize: 16,
                  // backgroundColor: 'transparent',
                }}
                style={styles.cardFieldWrapper}
                onCardChange={updateCardPreview}
              />
              {cardComplete && (
                <View style={styles.validationIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}
            </View>
            
            {/* Card hints */}
            <View style={styles.hintsContainer}>
              <View style={styles.hint}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.hintText}>
                  We accept Visa, Mastercard, American Express, and Discover
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Security Info */}
          <View style={styles.securityInfo}>
            <View style={styles.securityHeader}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <Text style={styles.securityTitle}>Bank-level Security</Text>
            </View>
            <Text style={styles.securityText}>
              Your card details are encrypted and processed securely by Stripe. We never store your full card number.
            </Text>
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <Ionicons name="lock-closed" size={14} color="#047857" />
                <Text style={styles.securityFeatureText}>256-bit SSL encryption</Text>
              </View>
              <View style={styles.securityFeature}>
                <Ionicons name="shield" size={14} color="#047857" />
                <Text style={styles.securityFeatureText}>PCI DSS compliant</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <SafeAreaView 
        edges={['bottom']}
        style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]} 
      >
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
      </SafeAreaView>

      {/* Card Success Modal */}
      <CardSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          addDebugInfo('Navigating back after success modal');
          router.back();
        }}
        cardDetails={addedCardDetails || undefined}
        isDefault={addedCardIsDefault}
      />
    </View>
  );
}

export default function AddCardScreen() {
  return (
    <ErrorBoundary>
      <AddCardContent />
    </ErrorBoundary>
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
    paddingVertical: 16,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFieldContainerValid: {
    borderColor: '#10B981',
  },
  cardFieldWrapper: {
    flex: 1,
    height: 56,
  },
  validationIcon: {
    paddingRight: 12,
  },
  hintsContainer: {
    marginTop: 12,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 18,
  },
  securityInfo: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 32,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
  securityText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    marginBottom: 12,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityFeatureText: {
    fontSize: 12,
    color: '#047857',
    marginLeft: 6,
    fontWeight: '500',
  },

  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
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
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 