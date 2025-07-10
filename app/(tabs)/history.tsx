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
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { Transaction, AutoPay, PaymentMethod } from '../../constants/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter]);

  const loadData = async () => {
    try {
      const [transactionsData, autoPayData, paymentMethodsData] = await Promise.all([
        apiService.getTransactions(),
        apiService.getAutoPay(),
        apiService.getPaymentMethods()
      ]);
      
      setTransactions(transactionsData);
      setAutoPay(autoPayData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.status === selectedFilter);
    }

    setFilteredTransactions(filtered);
  };

  const handleEnableAutoPay = async (transaction: Transaction) => {
    const defaultCard = paymentMethods.find(pm => pm.is_default);
    
    if (!defaultCard) {
      Alert.alert('No Default Card', 'Please set a default payment method first');
      return;
    }

    const existingAutoPay = autoPay.find(ap => ap.merchant_id === transaction.merchant_id);
    
    Alert.alert(
      'Enable AutoPay',
      `${existingAutoPay ? 'Update' : 'Enable'} automatic payments for ${transaction.merchant_name}?\n\nFuture payments will be automatically processed using your default card.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: existingAutoPay ? 'Update' : 'Enable',
          onPress: async () => {
            try {
              await apiService.addAutoPay({
                merchant_id: transaction.merchant_id,
                merchant_name: transaction.merchant_name,
                payment_method_id: defaultCard.id,
                max_amount: Math.ceil((transaction.amount / 100) * 1.5) * 100 // Convert to dollars, increase by 50%, convert back to cents
              });
              
              await loadData(); // Refresh data
              Alert.alert('Success', `AutoPay ${existingAutoPay ? 'updated' : 'enabled'} successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to enable AutoPay');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTransactionIcon = (merchantName: string) => {
    if (!merchantName || typeof merchantName !== 'string') return '🏪'; // Handle undefined/null/non-string merchantName
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks')) return '☕';
    if (name.includes('amazon')) return '📦';
    if (name.includes('uber')) return '🚗';
    if (name.includes('netflix')) return '🎬';
    if (name.includes('spotify')) return '🎵';
    if (name.includes('apple')) return '🍎';
    if (name.includes('google')) return '🔍';
    return '🏪';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const isAutoPayEnabled = (merchantId: string) => {
    return autoPay.some(ap => ap.merchant_id === merchantId && ap.is_enabled);
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: transactions.length },
    { key: 'completed', label: 'Completed', count: transactions.filter(t => t.status === 'completed').length },
    { key: 'pending', label: 'Pending', count: transactions.filter(t => t.status === 'pending').length },
    { key: 'failed', label: 'Failed', count: transactions.filter(t => t.status === 'failed').length },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>View all your payment transactions</Text>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {filterButtons.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
                {filter.count > 0 && (
                  <View style={[
                    styles.filterCount,
                    selectedFilter === filter.key && styles.filterCountActive
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      selectedFilter === filter.key && styles.filterCountTextActive
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: tabBarHeight + insets.bottom + 20, // Add padding for tab bar and some extra space
        }}
      >
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={() => router.push(`/transaction-detail?transactionId=${transaction.id}`)}
                activeOpacity={0.7}
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
                      {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                    </Text>
                    {transaction.description && (
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                    )}
                    <Text style={styles.viewDetailsText}>Tap for details</Text>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getStatusColor(transaction.status) }
                  ]}>
                    {transaction.status === 'completed' ? '-' : ''}
                    {formatAmount(transaction.amount)}
                  </Text>
                  
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(transaction.status)}20` }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(transaction.status) }
                    ]}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Text>
                  </View>
                  
                  {transaction.status === 'completed' && !isAutoPayEnabled(transaction.merchant_id) && (
                    <TouchableOpacity
                      style={styles.autoPayButton}
                      onPress={() => handleEnableAutoPay(transaction)}
                    >
                      <Text style={styles.autoPayButtonText}>Enable AutoPay</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isAutoPayEnabled(transaction.merchant_id) && (
                    <View style={styles.autoPayIndicator}>
                      <Ionicons name="flash" size={12} color="#10B981" />
                      <Text style={styles.autoPayText}>AutoPay On</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? 'Your transaction history will appear here'
                : `No ${selectedFilter} transactions found`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
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
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#6B46C1',
    marginTop: 4,
    fontStyle: 'italic',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  autoPayButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  autoPayButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  autoPayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  autoPayText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 