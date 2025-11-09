import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../src/services/api';
import { Transaction, AutoPay, PaymentMethod } from '../../src/constants/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAlert } from '../../src/components/ui/AlertModal';
import FilterModal from '../../src/components/ui/FilterModal';

type TimeFilter = 'all' | 'daily' | 'weekly' | 'monthly';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';
type CardFilter = 'all' | string; // 'all' or payment method ID

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
  const [selectedCardFilter, setSelectedCardFilter] = useState<CardFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { showAlert, AlertComponent } = useAlert();

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTransactions(true);
  }, [selectedStatusFilter, selectedTimeFilter, selectedCardFilter]);

  const loadData = async () => {
    try {
      const [autoPayData, paymentMethodsData] = await Promise.all([
        apiService.getAutoPay(),
        apiService.getPaymentMethods()
      ]);
      
      setAutoPay(autoPayData);
      setPaymentMethods(paymentMethodsData);
      await loadTransactions(true);
    } catch (error) {
      showAlert('Error', 'Failed to load data', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      }

      const params: any = {
        limit: 20,
      };

      if (selectedStatusFilter !== 'all') {
        params.status_filter = selectedStatusFilter;
      }

      if (selectedTimeFilter !== 'all') {
        params.time_filter = selectedTimeFilter;
      }

      if (selectedCardFilter !== 'all') {
        params.payment_method_id = selectedCardFilter;
      }

      if (!reset && nextCursor) {
        params.cursor = nextCursor;
      }

      const response = await apiService.getTransactions(params);
      
      if (reset) {
        setTransactions(response.transactions);
      } else {
        setTransactions((prev: Transaction[]) => [...prev, ...response.transactions]);
      }

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (error) {
      showAlert('Error', 'Failed to load transactions', undefined, 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      await loadTransactions(false);
    }
  };

  const handleEnableAutoPay = async (transaction: Transaction) => {
    const defaultCard = paymentMethods.find(pm => pm.is_default);
    
    if (!defaultCard) {
      showAlert('No Default Card', 'Please set a default payment method first', undefined, 'warning');
      return;
    }

    const existingAutoPay = autoPay.find(ap => ap.merchant_id === transaction.merchant_id);
    
    showAlert(
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
              showAlert('Success', `AutoPay ${existingAutoPay ? 'updated' : 'enabled'} successfully`, undefined, 'success');
            } catch (error: any) {
              showAlert('Error', error.response?.data?.message || 'Failed to enable AutoPay', undefined, 'error');
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
    if (!merchantName || typeof merchantName !== 'string') return '🏪';
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

  const groupTransactionsByDate = (): GroupedTransactions => {
    const grouped: GroupedTransactions = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach((transaction: Transaction) => {
      const transactionDate = new Date(transaction.created_at);
      transactionDate.setHours(0, 0, 0, 0);
      
      let dateKey: string;
      if (transactionDate.getTime() === today.getTime()) {
        dateKey = 'Today';
      } else if (transactionDate.getTime() === yesterday.getTime()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = transactionDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: transactionDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return grouped;
  };

  const isAutoPayEnabled = (merchantId: string) => {
    return autoPay?.some((ap: AutoPay) => ap?.merchant_id === merchantId && ap?.is_enabled) || false;
  };

  const timeFilters: { key: TimeFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All Time', icon: 'calendar-outline' },
    { key: 'daily', label: 'Today', icon: 'today-outline' },
    { key: 'weekly', label: 'This Week', icon: 'calendar-outline' },
    { key: 'monthly', label: 'This Month', icon: 'calendar' },
  ];

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: 0 },
    { key: 'completed', label: 'Completed', count: 0 },
    { key: 'pending', label: 'Pending', count: 0 },
    { key: 'failed', label: 'Failed', count: 0 },
  ];

  const groupedTransactions = groupTransactionsByDate();

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
      </LinearGradient>

      {/* Filter Button */}
      <View style={styles.filterTriggerContainer}>
        <TouchableOpacity 
          style={styles.filterTriggerButton} 
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={18} color="#374151" />
          <Text style={styles.filterTriggerButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <ScrollView style={styles.scrollView}>
          {[...Array(8)].map((_, index) => (
            <View key={index} style={styles.skeletonContainer}>
              <View style={styles.skeletonLeft}>
                <View style={styles.skeletonIcon} />
                <View>
                  <View style={styles.skeletonLineLg} />
                  <View style={styles.skeletonLineSm} />
                </View>
              </View>
              <View style={styles.skeletonRight}>
                <View style={styles.skeletonLineMd} />
                <View style={styles.skeletonLineSm} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: tabBarHeight + insets.bottom + 20,
          }}
        >
          {transactions.length > 0 ? (
            <View style={styles.transactionsContainer}>
              {Object.entries(groupedTransactions).map(([dateKey, transactionsInGroup]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{dateKey}</Text>
                  <View style={styles.transactionsList}>
                    {transactionsInGroup.map((transaction) => (
                      <TouchableOpacity 
                        key={transaction.id} 
                        style={styles.transactionItem}
                        onPress={() => router.push(`/transaction-detail?transactionId=${transaction.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.transactionIcon}>
                          <Text style={styles.transactionEmoji}>
                            {getTransactionIcon(transaction.merchant_name)}
                          </Text>
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={styles.transactionMerchant}>{transaction.merchant_name}</Text>
                          <Text style={styles.transactionDate}>{formatTime(transaction.created_at)}</Text>
                        </View>
                        <View style={styles.transactionAmountContainer}>
                          <Text style={styles.transactionAmount}>{formatAmount(transaction.amount)}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(transaction.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <View style={styles.loadMoreContainer}>
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator size="small" color="#6B46C1" />
                    ) : (
                      <>
                        <Text style={styles.loadMoreText}>Load More</Text>
                        <Ionicons name="chevron-down" size={16} color="#6B46C1" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyDescription}>
                Your transaction history will appear here once you make a payment.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      <AlertComponent />

      <FilterModal 
        visible={isFilterModalVisible} 
        onClose={() => setIsFilterModalVisible(false)}
      >
        {/* Time Period Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Time Period</Text>
          <View style={styles.filterOptionGroup}>
            {timeFilters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, selectedTimeFilter === f.key && styles.filterChipActive]}
                onPress={() => setSelectedTimeFilter(f.key)}
              >
                <Text style={[styles.filterChipText, selectedTimeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Status</Text>
          <View style={styles.filterOptionGroup}>
            {statusFilters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, selectedStatusFilter === f.key && styles.filterChipActive]}
                onPress={() => setSelectedStatusFilter(f.key)}
              >
                <Text style={[styles.filterChipText, selectedStatusFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Payment Method</Text>
          <View style={styles.filterOptionGroup}>
            <TouchableOpacity
              style={[styles.filterChip, selectedCardFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedCardFilter('all')}
            >
              <Text style={[styles.filterChipText, selectedCardFilter === 'all' && styles.filterChipTextActive]}>All Cards</Text>
            </TouchableOpacity>
            {paymentMethods.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.filterChip, selectedCardFilter === card.id && styles.filterChipActive]}
                onPress={() => setSelectedCardFilter(card.id)}
              >
                <Text style={[styles.filterChipText, selectedCardFilter === card.id && styles.filterChipTextActive]}>•••• {card.last_four}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.applyFiltersButton} onPress={() => setIsFilterModalVisible(false)}>
          <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </FilterModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
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
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  transactionsContainer: {
    paddingHorizontal: 24,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionEmoji: {
    fontSize: 22,
  },
  transactionDetails: {
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
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Skeleton Loader Styles
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  skeletonLineLg: {
    width: 120,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonLineMd: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonLineSm: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonRight: {
    alignItems: 'flex-end',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6B46C1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  
  // New Filter UI Styles
  filterTriggerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F8F7FF',
  },
  filterTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  filterTriggerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Filter Modal Styles
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  filterOptionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#6B46C1',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  applyFiltersButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});