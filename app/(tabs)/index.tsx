import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { PaymentMethod, Transaction, PaymentRequest } from '../../constants/types';

export default function HomeScreen() {
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Load data function
  const loadData = useCallback(async () => {
    try {
      // Always load payment methods first
      const paymentMethods = await apiService.getPaymentMethods();
      const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
      setDefaultCard(defaultPaymentMethod || null);
      
      // Try to load payment requests (optional - API might not exist yet)
      try {
        const requests = await apiService.getPaymentRequests();
        setPaymentRequests(requests.filter(request => request.status === 'pending'));
      } catch (requestError) {
        console.log('Payment requests API not available yet, showing empty state');
        setPaymentRequests([]);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', 'Failed to load your payment methods');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh when screen is focused (fixes the refresh issue)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
  };

  const handleFaceRegistration = () => {
    router.push('/face-registration');
  };

  const formatCardNumber = (lastFour: string) => {
    if (!lastFour || typeof lastFour !== 'string') return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${lastFour}`;
  };

  const getCardBrandIcon = (brand: string) => {
    if (!brand || typeof brand !== 'string') return 'CARD'; // Handle undefined/null/non-string brand
    switch (brand.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'AMEX';
      case 'discover': return 'DISCOVER';
      default: return 'CARD';
    }
  };

  // Updated getCardColor function to match cards section - brand-based colors
  const getCardColor = (brand: string) => {
    if (!brand || typeof brand !== 'string') return ['#4A5568', '#2D3748']; // Handle undefined/null/non-string brand
    
    switch (brand.toLowerCase()) {
      case 'visa': return ['#1e3c72', '#2a5298']; // Premium blue gradient
      case 'mastercard': return ['#2D3748', '#4A5568']; // Dark grey gradient
      case 'amex': return ['#2c3e50', '#34495e']; // Premium dark gradient
      case 'discover': return ['#f39c12', '#e67e22']; // Premium orange gradient
      default: return ['#4A5568', '#2D3748'];
    }
  };

  const formatExpiry = (month: number, year: number) => {
    if (!month || !year || isNaN(month) || isNaN(year)) return '••/••';
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year).slice(-2);
    return `${monthStr}/${yearStr}`;
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMerchantIcon = (merchantName: string) => {
    if (!merchantName || typeof merchantName !== 'string') return '🏪';
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks')) return '☕';
    if (name.includes('amazon')) return '📦';
    if (name.includes('uber')) return '🚗';
    if (name.includes('netflix')) return '🎬';
    return '🏪';
  };

  const handleApprovePayment = async (requestId: string) => {
    try {
      await apiService.approvePayment(requestId);
      Alert.alert('Success', 'Payment request approved!');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Failed to approve payment:', error);
      Alert.alert('Error', 'Failed to approve payment request');
    }
  };

  const handleDeclinePayment = async (requestId: string) => {
    try {
      await apiService.declinePayment(requestId);
      Alert.alert('Success', 'Payment request declined');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Failed to decline payment:', error);
      Alert.alert('Error', 'Failed to decline payment request');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 100 // Extra padding for tab bar
          }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.first_name}</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Face Registration Prompt */}
        {user && !user.has_face_registered && (
          <TouchableOpacity 
            style={styles.facePrompt}
            onPress={handleFaceRegistration}
          >
            <View style={styles.facePromptContent}>
              <View style={styles.facePromptIcon}>
                <Ionicons name="scan" size={24} color="#6B46C1" />
              </View>
              <View style={styles.facePromptText}>
                <Text style={styles.facePromptTitle}>Register Your Face</Text>
                <Text style={styles.facePromptSubtitle}>
                  Enable face recognition for secure payments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        )}

        {/* Default Card */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Your Cards</Text>
          {defaultCard ? (
            <TouchableOpacity 
              style={[
                styles.creditCard,
                { backgroundColor: getCardColor(defaultCard.card_brand)[0] }
              ]}
              onPress={() => router.push('/(tabs)/cards')}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardBrand}>
                  {getCardBrandIcon(defaultCard.card_brand)}
                </Text>
                <View style={styles.cardActions}>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>DEFAULT</Text>
                  </View>
                  <View style={styles.cardChip} />
                </View>
              </View>
              
              {/* Card Number */}
              <Text style={styles.cardNumber}>
                {formatCardNumber(defaultCard.card_last_four)}
              </Text>
              
              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.cardExpiry}>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>
                    {formatExpiry(defaultCard.card_exp_month, defaultCard.card_exp_year)}
                  </Text>
                </View>
                <View style={styles.cardNetwork}>
                  <Text style={styles.networkText}>
                    {getCardBrandIcon(defaultCard.card_brand)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.addCardPrompt}
              onPress={() => router.push('/(tabs)/cards')}
            >
              <Ionicons name="add-circle-outline" size={48} color="#6B46C1" />
              <Text style={styles.addCardText}>Add Your First Card</Text>
              <Text style={styles.addCardSubtext}>
                Connect your payment method to get started
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Requests */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Requests</Text>
            {paymentRequests.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {paymentRequests.length > 0 ? (
            <View style={styles.transactionList}>
              {paymentRequests.slice(0, 3).map((request) => (
                <View key={request.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionEmoji}>
                        {getMerchantIcon(request.merchant_name)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionMerchant}>
                        {request.merchant_name}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(request.created_at)} • {getTimeRemaining(request.expires_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestRight}>
                    <Text style={styles.requestAmount}>
                      {formatAmount(request.amount)}
                    </Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={styles.declineButton}
                        onPress={() => handleDeclinePayment(request.id)}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.approveButton}
                        onPress={() => handleApprovePayment(request.id)}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No payment requests</Text>
              <Text style={styles.emptyStateSubtext}>
                Payment requests from merchants will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  facePrompt: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  facePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facePromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  facePromptText: {
    flex: 1,
  },
  facePromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  facePromptSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  cardSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  creditCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 32,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardExpiry: {
    flex: 1,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardNetwork: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addCardPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  addCardSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  requestAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
