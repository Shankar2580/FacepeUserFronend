import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { TransactionDetail, PaymentMethod, CreateAutoPayRequest, AutoPay } from '../constants/types';

export default function TransactionDetailScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // This screen is in a stack outside the tab navigator, so there is no bottom tab bar.
  const tabBarHeight = 0;
  
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [existingAutoPay, setExistingAutoPay] = useState<AutoPay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [autoPayLimit, setAutoPayLimit] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [settingUpAutoPay, setSettingUpAutoPay] = useState(false);

  useEffect(() => {
    loadTransactionDetail();
    loadPaymentMethods();
    loadExistingAutoPay();
  }, [transactionId]);

  const loadTransactionDetail = async () => {
    try {
      if (!transactionId) return;
      const data = await apiService.getTransactionDetail(transactionId);
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction detail:', error);
      Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await apiService.getPaymentMethods();
      setPaymentMethods(methods);
      const defaultMethod = methods.find((m: PaymentMethod) => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadExistingAutoPay = async () => {
    try {
      const autoPay = await apiService.getAutoPay();
      setExistingAutoPay(autoPay);
    } catch (error) {
      console.error('Error loading auto pay:', error);
    }
  };

  const isAutoPayAlreadyEnabled = () => {
    if (!transaction) return false;
    
    // First check if this specific transaction was auto-paid
    if (transaction.is_auto_paid) return true;
    
    // Then check if AutoPay is configured for this merchant
    return existingAutoPay.some(ap => 
      (ap.merchant_name === transaction.merchant_name || ap.merchant_id === transaction.merchant_id) 
      && ap.is_enabled
    );
  };

  const handleSetupAutoPay = async () => {
    if (!transaction || !selectedPaymentMethod || !autoPayLimit) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const limitAmount = parseFloat(autoPayLimit);
    if (isNaN(limitAmount) || limitAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid limit amount');
      return;
    }

    setSettingUpAutoPay(true);
    try {
      const autoPayData: CreateAutoPayRequest = {
        merchant_id: transaction.merchant_id,
        merchant_name: transaction.merchant_name,
        payment_method_id: selectedPaymentMethod,
        max_amount: limitAmount * 100, // Convert to cents
      };

      await apiService.addAutoPay(autoPayData);
      
      // Refresh auto pay data
      await loadExistingAutoPay();
      
      Alert.alert(
        'Success',
        `Auto-pay has been set up for ${transaction.merchant_name} with a limit of $${limitAmount.toFixed(2)}`
      );
      setShowAutoPayModal(false);
      setAutoPayLimit('');
    } catch (error) {
      console.error('Error setting up auto-pay:', error);
      Alert.alert('Error', 'Failed to set up auto-pay');
    } finally {
      setSettingUpAutoPay(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#6B46C1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
        </View>

        {/* Transaction Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(transaction.status)}
              size={32}
              color={getStatusColor(transaction.status)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>{transaction.status.toUpperCase()}</Text>
              <Text style={styles.amountText}>{formatCurrency(transaction.amount)}</Text>
            </View>
          </View>
          {transaction.is_auto_paid && (
            <View style={styles.autoPayBadge}>
              <Ionicons name="flash" size={16} color="#4CAF50" />
              <Text style={styles.autoPayText}>Auto-paid</Text>
            </View>
          )}
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Transaction Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>{transaction.merchant_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(transaction.amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValue}>{transaction.currency.toUpperCase()}</Text>
          </View>

          {transaction.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
          </View>

          {transaction.stripe_payment_intent_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stripe Payment ID</Text>
              <Text style={styles.detailValue}>{transaction.stripe_payment_intent_id}</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        {transaction.payment_method && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Payment Method</Text>
            
            <View style={styles.paymentMethodInfo}>
              <Ionicons name="card" size={24} color="#6B46C1" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>
                  {transaction.payment_method.card_brand.toUpperCase()} •••• {transaction.payment_method.card_last_four}
                </Text>
                <Text style={styles.cardExpiry}>
                  Expires {transaction.payment_method.card_exp_month}/{transaction.payment_method.card_exp_year}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Auto Pay Setup */}
        {transaction.status === 'completed' && !isAutoPayAlreadyEnabled() && (
          <View style={styles.autoPayCard}>
            <View style={styles.autoPayHeader}>
              <Ionicons name="flash" size={24} color="#4CAF50" />
              <Text style={styles.autoPayTitle}>Set up Auto-Pay</Text>
            </View>
            <Text style={styles.autoPayDescription}>
              Enable automatic payments for {transaction.merchant_name} to skip approval for future transactions under your set limit.
            </Text>
            <TouchableOpacity
              style={styles.setupAutoPayButton}
              onPress={() => setShowAutoPayModal(true)}
            >
              <Text style={styles.setupAutoPayButtonText}>Set Up Auto-Pay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auto Pay Already Enabled */}
        {isAutoPayAlreadyEnabled() && (
          <View style={styles.autoPayCard}>
            <View style={styles.autoPayHeader}>
              <Ionicons name="flash" size={24} color="#10B981" />
              <Text style={styles.autoPayTitle}>Auto-Pay Enabled</Text>
            </View>
            <Text style={styles.autoPayDescription}>
              Automatic payments are configured for {transaction.merchant_name}. You can manage your auto-pay settings, edit limits, or disable auto-pay.
            </Text>
            <TouchableOpacity
              style={[styles.setupAutoPayButton, { backgroundColor: '#6B46C1' }]}
              onPress={() => router.push('/autopay-settings')}
            >
              <Text style={styles.setupAutoPayButtonText}>Manage Auto-Pay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auto Pay Setup Modal */}
        <Modal
          visible={showAutoPayModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAutoPayModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAutoPayModal(false)}>
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Set Up Auto-Pay</Text>
              <TouchableOpacity onPress={handleSetupAutoPay} disabled={settingUpAutoPay}>
                <Text style={[styles.modalSaveButton, settingUpAutoPay && styles.disabledButton]}>
                  {settingUpAutoPay ? 'Setting Up...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalMerchant}>{transaction.merchant_name}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Amount Limit</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={autoPayLimit}
                    onChangeText={(text) => {
                      // Allow only numbers and decimal point
                      const filteredText = text.replace(/[^0-9.]/g, '');
                      // Ensure only one decimal point
                      const parts = filteredText.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      // Limit to 2 decimal places
                      if (parts[1] && parts[1].length > 2) {
                        return;
                      }
                      setAutoPayLimit(filteredText);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    editable={!settingUpAutoPay}
                    returnKeyType="done"
                  />
                </View>
                <Text style={styles.inputHint}>
                  Any transaction from {transaction.merchant_name} under this amount will be automatically approved and charged to your selected payment method.
                </Text>
                <Text style={styles.inputExample}>
                  Examples: $25.00 for coffee shops, $100.00 for grocery stores
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodOption,
                      selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                    disabled={settingUpAutoPay}
                  >
                    <Ionicons name="card" size={20} color="#6B46C1" />
                    <Text style={styles.paymentMethodText}>
                      {method.card_brand.toUpperCase()} •••• {method.card_last_four}
                    </Text>
                    {method.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  autoPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  autoPayText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalFee: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 12,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  autoPayCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoPayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoPayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  autoPayDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  setupAutoPayButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setupAutoPayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B46C1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalMerchant: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  inputExample: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 4,
    fontStyle: 'italic',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3F4F6',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
}); 