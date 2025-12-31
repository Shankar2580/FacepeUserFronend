import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../src/components/ui/AlertModal';
import { EmptyState } from '../../src/components/ui/EmptyState';
import FilterModal from '../../src/components/ui/FilterModal';
import { PaymentMethod, Transaction } from '../../src/constants/types';
import { apiService } from '../../src/services/api';
import { getErrorMessage } from '../../src/utils/errorHandler';
import { fontScale, scale } from '../../src/utils/responsive';

type TimeFilter = 'all' | 'daily' | 'weekly' | 'monthly';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';
type CardFilter = 'all' | string;

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  // Load payment methods for filter
  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await apiService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      // Silent fail - payment methods filter will just be empty
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }
      
      const params: any = {
        page,
        limit: 20,
      };
      
      if (timeFilter !== 'all') {
        params.time_filter = timeFilter;
      }
      if (statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }
      if (cardFilter !== 'all') {
        params.payment_method_id = cardFilter;
      }
      
      const response = await apiService.getTransactions(params);
      
      if (append) {
        setTransactions(prev => [...prev, ...response.transactions]);
      } else {
        setTransactions(response.transactions);
      }
      setHasMore(response.transactions.length === 20);
      setCurrentPage(page);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showAlert('Oops', getErrorMessage(error, 'Unable to load transactions. Please try again.'), undefined, 'error');
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [timeFilter, statusFilter, cardFilter]);

  // Auto-refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions(1, false);
      loadPaymentMethods();
    }, [loadTransactions, loadPaymentMethods])
  );

  // Reload when filters change
  useEffect(() => {
    loadTransactions(1, false);
  }, [timeFilter, statusFilter, cardFilter, loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions(1, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadTransactions(currentPage + 1, true);
  };

  // Reset all filters
  const resetFilters = () => {
    setTimeFilter('all');
    setStatusFilter('all');
    setCardFilter('all');
  };

  // Filter options
  const timeFilterOptions: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
  ];

  const statusFilterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
  ];

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#059669';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#DC2626';
      default:
        return '#6B7280';
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
      default:
        return 'ellipse';
    }
  };

  const getMerchantIcon = (merchantName: string) => {
    if (!merchantName || typeof merchantName !== 'string') return '🏪';
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks')) return '☕';
    if (name.includes('amazon')) return '📦';
    if (name.includes('uber')) return '🚗';
    if (name.includes('netflix')) return '🎬';
    if (name.includes('grocery')) return '🛒';
    if (name.includes('restaurant')) return '🍽️';
    return '🏪';
  };

  const getMerchantName = (transaction: Transaction) => {
    // Prioritize business_name if available
    if (transaction.business_name && transaction.business_name.trim()) {
      return transaction.business_name;
    }
    
    // Clean up merchant_name if it contains the merchant ID pattern
    if (transaction.merchant_name) {
      // If merchant_name contains "(acct_...)" pattern, extract just the business name part
      const match = transaction.merchant_name.match(/^(.+?)\s*\(acct_[^)]+\)$/);
      if (match) {
        return match[1].trim();
      }
      
      // If it's just "Merchant (acct_...)", try to use a fallback
      if (transaction.merchant_name.startsWith('Merchant (acct_')) {
        return 'Business'; // Generic fallback
      }
      
      return transaction.merchant_name;
    }
    
    return 'Unknown Merchant';
  };


  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = formatDate(transaction.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Skeleton loading state
  if (isLoading && transactions.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.title}>Transaction History</Text>
        </LinearGradient>

        <View style={styles.filterTriggerContainer}>
          <View style={styles.filterTriggerButton}>
            <Ionicons name="filter" size={scale(18)} color="#374151" />
            <Text style={styles.filterTriggerButtonText}>Filters</Text>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonContent}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonSubtitle} />
                </View>
                <View style={styles.skeletonAmount} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

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
          <Ionicons name="filter" size={scale(18)} color="#374151" />
          <Text style={styles.filterTriggerButtonText}>Filters</Text>
          {(timeFilter !== 'all' || statusFilter !== 'all' || cardFilter !== 'all') && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {[timeFilter !== 'all', statusFilter !== 'all', cardFilter !== 'all'].filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {(timeFilter !== 'all' || statusFilter !== 'all' || cardFilter !== 'all') && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + scale(100) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={({ nativeEvent }) => {
          // Load more when near the bottom
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - scale(50)) {
            loadMore();
          }
        }}
      >
        {transactions.length > 0 ? (
          <>
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                <View style={styles.transactionList}>
                  {dateTransactions.map((transaction, index) => (
                    <TouchableOpacity
                      key={transaction.id}
                      style={[
                        styles.transactionItem,
                        index === dateTransactions.length - 1 && styles.lastItem,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/transaction-detail',
                          params: { transactionId: transaction.id },
                        } as any)
                      }
                    >
                      <View style={styles.transactionIcon}>
                        <Text style={styles.transactionEmoji}>
                          {getMerchantIcon(getMerchantName(transaction))}
                        </Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.merchantName} numberOfLines={1}>
                          {getMerchantName(transaction)}
                        </Text>
                        <Text style={styles.transactionTime}>
                          {formatTime(transaction.created_at)}
                        </Text>
                      </View>
                      <View style={styles.transactionAmountContainer}>
                        <Text style={styles.transactionAmount}>
                          -{formatAmount(transaction.amount)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(transaction.status)}20` },
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(transaction.status) as any}
                            size={scale(10, 8, 12)}
                            color={getStatusColor(transaction.status)}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(transaction.status) },
                            ]}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#6B46C1" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon="receipt-outline"
            title="No Transactions"
            subtitle="Your transaction history will appear here once you start making payments"
            variant="transactions"
            animated={true}
          />
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal 
        visible={isFilterModalVisible} 
        onClose={() => setIsFilterModalVisible(false)}
      >
        {/* Time Period Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Time Period</Text>
          <View style={styles.filterOptionGroup}>
            {timeFilterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  timeFilter === option.key && styles.filterChipActive,
                ]}
                onPress={() => setTimeFilter(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  timeFilter === option.key && styles.filterChipTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.filterOptionGroup}>
            {statusFilterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  statusFilter === option.key && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  statusFilter === option.key && styles.filterChipTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Payment Method</Text>
          <View style={styles.filterOptionGroup}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                cardFilter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setCardFilter('all')}
            >
              <Text style={[
                styles.filterChipText,
                cardFilter === 'all' && styles.filterChipTextActive,
              ]}>
                All Cards
              </Text>
            </TouchableOpacity>
            {paymentMethods.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.filterChip,
                  cardFilter === card.id && styles.filterChipActive,
                ]}
                onPress={() => setCardFilter(card.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  cardFilter === card.id && styles.filterChipTextActive,
                ]}>
                  {card.card_brand} •••• {card.card_last_four}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Apply Button */}
        <TouchableOpacity 
          style={styles.applyFiltersButton} 
          onPress={() => setIsFilterModalVisible(false)}
        >
          <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </FilterModal>

      {/* Alert Component */}
      <AlertComponent />
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
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    paddingBottom: scale(16),
    minHeight: scale(80),
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: scale(8),
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
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Filter Trigger Button
  filterTriggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    gap: scale(12),
  },
  filterTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTriggerButtonText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#374151',
  },
  filterBadge: {
    backgroundColor: '#6B46C1',
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(4),
  },
  filterBadgeText: {
    fontSize: fontScale(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  clearFiltersText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#6B46C1',
  },
  // Filter Modal Styles
  filterSection: {
    marginBottom: scale(24),
  },
  filterSectionTitle: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: scale(16),
  },
  filterOptionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  filterChip: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#6B46C1',
  },
  filterChipText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  applyFiltersButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    marginTop: scale(24),
    marginBottom: scale(8),
    minHeight: scale(52),
    justifyContent: 'center',
  },
  applyFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(16),
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
  },
  dateGroup: {
    marginBottom: scale(24),
  },
  dateHeader: {
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: scale(12),
    paddingLeft: scale(4),
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 72, // Minimum touch target
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: scale(44, 40, 52),
    height: scale(44, 40, 52),
    borderRadius: scale(22),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  transactionEmoji: {
    fontSize: fontScale(20, 18, 24),
  },
  transactionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(2),
  },
  transactionTime: {
    fontSize: fontScale(13, 11, 15),
    color: '#9CA3AF',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: scale(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
    gap: scale(4),
  },
  statusText: {
    fontSize: fontScale(10, 8, 12),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: scale(24),
    gap: scale(16),
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(16),
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#F3F4F6',
  },
  skeletonContent: {
    flex: 1,
    marginLeft: scale(12),
    gap: scale(8),
  },
  skeletonTitle: {
    width: '60%',
    height: scale(16),
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  skeletonSubtitle: {
    width: '40%',
    height: scale(12),
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  skeletonAmount: {
    width: scale(60),
    height: scale(20),
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(20),
    gap: scale(8),
  },
  loadingMoreText: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(48),
    paddingVertical: scale(80),
  },
  emptyIconContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(24),
  },
  emptyTitle: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
  },
  emptySubtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
