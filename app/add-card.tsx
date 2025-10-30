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
import { LinearGradient } from 'expo-linear-gradient';
import { CardField, useStripe, CardFieldInput } from '@stripe/stripe-react-native';
import { apiService } from '../src/services/api';
import { PaymentCard } from '../src/components/ui/PaymentCard';
import { CardSuccessModal } from '../src/components/ui/CardSuccessModal';
import { ProcessingAnimation } from '../src/components/ui/ProcessingAnimation';
import { useAlert } from '../src/components/ui/AlertModal';

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
    // console.error removed for production
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // console.error removed for production
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
  const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
  const [addedCardDetails, setAddedCardDetails] = useState<{brand?: string; last4?: string} | null>(null);
  const [addedCardIsDefault, setAddedCardIsDefault] = useState<boolean>(false);
  const { confirmSetupIntent } = useStripe();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
    // console.log removed for production
  };

  const handleAddCard = async () => {
    try {
      addDebugInfo('Starting add card process...');
      
      if (!cardComplete) {
        addDebugInfo('Card details incomplete');
        showAlert('Error', 'Please enter complete card details', undefined, 'error');
        return;
      }

      // Validate Stripe hook is available
      if (!confirmSetupIntent) {
        addDebugInfo('Stripe confirmSetupIntent hook not available');
        throw new Error('Stripe not properly initialized. Please try restarting the app.');
      }

      setShowProcessingAnimation(true);
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
        // console.error removed for production
        
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
        // console.error removed for production
        throw new Error(`Stripe error: ${stripeError.message}`);
      }

      if (stripeResult.error) {
        addDebugInfo(`Stripe Setup Intent error: ${stripeResult.error.message}`);
        // console.error removed for production
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
        // console.error removed for production
        
        if (confirmError.response) {
          addDebugInfo(`Confirm API Response status: ${confirmError.response.status}`);
          addDebugInfo(`Confirm API Response data: ${JSON.stringify(confirmError.response.data)}`);
        }
        
        throw new Error(`Failed to confirm setup intent: ${confirmError.message}`);
      }
      
      if (!confirmResult.success) {
        addDebugInfo('Backend confirmation returned success: false');
        // console.error removed for production
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

      // Hide processing animation and show success modal
      setShowProcessingAnimation(false);
      setShowSuccessModal(true);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugInfo(`Final error: ${errorMessage}`);
      // console.error removed for production
      
      setShowProcessingAnimation(false);
      showAlert(
        'Error',
        `Failed to add payment method: ${errorMessage}`,
        [
          {
            text: 'Show Debug Info',
            onPress: () => {
              showAlert('Debug Information', debugInfo);
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ],
        'error'
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
      // console.error removed for production
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F7FF']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#6B46C1" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjusted offset for iOS
      >
        {/* Main Content Area */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card Preview */}
          <View style={styles.cardPreviewContainer}>
            <PaymentCard
              cardDetails={cardDetails || undefined}
              variant="preview"
              isPreview={true}
            />
          </View>

          {/* Card Input Field */}
          <View style={styles.cardInputWrapper}>
            <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={false}
              cardStyle={{
                textColor: '#1F2937',
                placeholderColor: '#9CA3AF',
                fontSize: 18,
              }}
              style={styles.cardFieldWrapper}
              onCardChange={updateCardPreview}
            />
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Action Area */}
        <View style={[styles.bottomAction, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
          {/* Secure Payment Text */}
          <View style={styles.securePaymentContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.securePaymentText}>Your payment info is stored securely.</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, (!cardComplete || loading) && styles.disabledButton]}
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
        </View>
      </KeyboardAvoidingView>

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

      {/* Processing Animation */}
      <ProcessingAnimation
        visible={showProcessingAnimation}
        type="card"
        title="Adding Card"
        subtitle="Securing your payment method..."
      />

      {/* Alert Component */}
      <AlertComponent />
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
    backgroundColor: '#F8F7FF',
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
    borderRadius: 22,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.1)',
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
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
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
  cardPreviewContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardInputWrapper: {
    paddingHorizontal: 24,
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
    borderRadius: 12,
    padding: 18,
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
    height: 60, // Set a fixed height for consistency
    justifyContent: 'center',
  },
  cardFieldContainerValid: {
    borderColor: '#10B981',
  },
  cardField: {
    color: '#1F2937',
    fontSize: 18,
    // Add any other specific text styling for the card field here
  },
  cardFieldWrapper: {
    flex: 1,
    height: '100%',
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
  securePaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  securePaymentText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#F8F7FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#A78BFA',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF0F0',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 