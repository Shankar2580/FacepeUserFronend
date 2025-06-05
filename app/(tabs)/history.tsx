import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Transaction, AutoPay, PaymentMethod } from '../../constants/types';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedFilter]);

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

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleEnableAutoPay = async (transaction: Transaction) => {
    const defaultCard = paymentMethods.find(pm => pm.is_default);
    
    if (!defaultCard) {
      Alert.alert('No Default Card', 'Please set a default payment method first');
      return;
    }

    const existingAutoPay = autoPay.find(ap => ap.merchant_name === transaction.merchant_name);
    
    if (existingAutoPay) {
      Alert.alert('AutoPay Already Enabled', 'AutoPay is already enabled for this merchant');
      return;
    }

    Alert.alert(
      'Enable AutoPay',
      `Enable automatic payments for ${transaction.merchant_name}?\n\nFuture payments will be automatically processed using your default card.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              await apiService.addAutoPay({
                merchant_name: transaction.merchant_name,
                payment_method_id: defaultCard.id,
                max_amount: Math.ceil(transaction.amount * 1.5) // Set max amount 50% higher than current transaction
              });
              
              await loadData(); // Refresh data
              Alert.alert('Success', 'AutoPay enabled successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to enable AutoPay');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
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

  const isAutoPayEnabled = (merchantName: string) => {
    return autoPay.some(ap => ap.merchant_name === merchantName && ap.is_enabled);
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: transactions.length },
    { key: 'completed', label: 'Completed', count: transactions.filter(t => t.status === 'completed').length },
    { key: 'pending', label: 'Pending', count: transactions.filter(t => t.status === 'pending').length },
    { key: 'failed', label: 'Failed', count: transactions.filter(t => t.status === 'failed').length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => {/* Could implement modal search */}}
        >
          <Ionicons name="search" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter.key && styles.activeFilterTabText
            ]}>
              {filter.label}
            </Text>
            <Text style={[
              styles.filterTabCount,
              selectedFilter === filter.key && styles.activeFilterTabCount
            ]}>
              {filter.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction, index) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
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
                      <Text style={styles.transactionDescription}>
                        {transaction.description || 'Payment'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.status === 'completed' ? '#1F2937' : getStatusColor(transaction.status) }
                    ]}>
                      {transaction.status === 'completed' ? '-' : ''}
                      {formatAmount(transaction.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionFooter}>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.created_at)} • {formatTime(transaction.created_at)}
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
                  </View>

                  {/* AutoPay Controls */}
                  {transaction.status === 'completed' && (
                    <View style={styles.autoPaySection}>
                      {isAutoPayEnabled(transaction.merchant_name) ? (
                        <View style={styles.autoPayEnabled}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                          <Text style={styles.autoPayEnabledText}>AutoPay Enabled</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.enableAutoPayButton}
                          onPress={() => handleEnableAutoPay(transaction)}
                        >
                          <Ionicons name="flash" size={16} color="#6B46C1" />
                          <Text style={styles.enableAutoPayText}>Enable AutoPay</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? "search" : "receipt-outline"} 
              size={64} 
              color="#9CA3AF" 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Results Found' : 'No Transactions Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No transactions found for "${searchQuery}"`
                : 'Your transaction history will appear here'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterTab: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterTabCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  activeFilterTabCount: {
    color: '#6B46C1',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  transactionList: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
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
  transactionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionFooter: {
    gap: 12,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  autoPaySection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  autoPayEnabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoPayEnabledText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  enableAutoPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  enableAutoPayText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 