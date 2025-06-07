import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { PaymentMethod, Transaction } from '../../constants/types';

export default function HomeScreen() {
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentMethods, transactions] = await Promise.all([
        apiService.getPaymentMethods(),
        apiService.getTransactions()
      ]);
      
      const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
      setDefaultCard(defaultPaymentMethod || null);
      
      // Get only recent 3 transactions
      setRecentTransactions(transactions.slice(0, 3));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getTransactionIcon = (merchantName: string) => {
    if (!merchantName || typeof merchantName !== 'string') return '🏪';
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks')) return '☕';
    if (name.includes('amazon')) return '📦';
    if (name.includes('uber')) return '🚗';
    if (name.includes('netflix')) return '🎬';
    return '🏪';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
              style={styles.creditCard}
              onPress={() => router.push('/cards')}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardBrand}>
                  {getCardBrandIcon(defaultCard.card_brand)}
                </Text>
                <View style={styles.cardChip} />
              </View>
              <Text style={styles.cardNumber}>
                {formatCardNumber(defaultCard.card_last_four)}
              </Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Expires</Text>
                  <Text style={styles.cardValue}>
                    {defaultCard.card_exp_month && defaultCard.card_exp_year
                      ? `${String(defaultCard.card_exp_month).padStart(2, '0')}/${String(defaultCard.card_exp_year).slice(-2)}`
                      : '••/••'
                    }
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.addCardPrompt}
              onPress={() => router.push('/cards')}
            >
              <Ionicons name="add-circle-outline" size={48} color="#6B46C1" />
              <Text style={styles.addCardText}>Add Your First Card</Text>
              <Text style={styles.addCardSubtext}>
                Connect your payment method to get started
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            <View style={styles.transactionList}>
              {recentTransactions.map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => router.push('/(tabs)/history')}
                >
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionEmoji}>
                        {getTransactionIcon(transaction.merchant_name)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionMerchant}>
                        {transaction.merchant_name}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.status === 'completed' 
                        ? styles.amountCompleted 
                        : styles.amountPending
                    ]}>
                      {transaction.status === 'completed' ? '-' : ''}
                      {formatAmount(transaction.amount)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      transaction.status === 'completed' 
                        ? styles.statusCompleted 
                        : styles.statusPending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        transaction.status === 'completed' 
                          ? styles.statusTextCompleted 
                          : styles.statusTextPending
                      ]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your payment history will appear here
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
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
    backgroundColor: '#6B46C1',
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardChip: {
    width: 32,
    height: 24,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 32,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountCompleted: {
    color: '#1F2937',
  },
  amountPending: {
    color: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#D97706',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
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
