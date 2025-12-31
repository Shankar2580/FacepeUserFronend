import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../src/components/ui/AlertModal';
import { PaymentCard } from '../../src/components/ui/PaymentCard';
import { PaymentMethod, PaymentRequest } from '../../src/constants/types';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotifications } from '../../src/hooks/useNotifications';
import { apiService } from '../../src/services/api';
import { notificationService } from '../../src/services/notificationService';
import { isExpired, formatTimeRemaining, getExpiryColor } from '../../src/utils/timeUtils';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { wp, scale, fontScale } from '../../src/utils/responsive';

export default function HomeScreen() {
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [countdown, setCountdown] = useState<number>(0); // Force re-render for countdown
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [completedTransactionsCount, setCompletedTransactionsCount] = useState<number>(0);
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { showAlert, AlertComponent } = useAlert();
  const { registerUpdateCallback } = useNotifications();

  // Load data function
  const loadData = useCallback(async () => {
    try {
      // Always load payment methods first
      const paymentMethods = await apiService.getPaymentMethods();
      const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
      setDefaultCard(defaultPaymentMethod || null);
      
      // Load transactions and calculate summary - use time_filter for today
      const transactionsResponse = await apiService.getTransactions({ 
        time_filter: 'daily',
        status_filter: 'completed'
      });
      
      const todaysTransactions = transactionsResponse.transactions;
      
      const total = todaysTransactions.reduce((sum, t) => sum + t.amount, 0) / 100; // Convert cents to dollars
      setTotalEarnings(total);
      setCompletedTransactionsCount(todaysTransactions.length);

      // Try to load payment requests (optional - API might not exist yet)
      try {
        const requests = await apiService.getPaymentRequests();
        // Filter out expired requests and only show pending ones
        const activeRequests = requests.filter(request => 
          request.status === 'pending' && !isExpired(request.expires_at)
        );
        setPaymentRequests(activeRequests);
      } catch (requestError) {
        setPaymentRequests([]);
      }
    } catch (error: any) {
      // If the user is not authenticated (401), silently ignore to avoid panic
      if (error?.response?.status !== 401) {
        showAlert('Oops', 'Something went wrong while loading your data. Please try again later.', undefined, 'error');
      }
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

  // Register callback for notification hook to refresh data when requests are updated
  useEffect(() => {
    registerUpdateCallback(() => {
      // Silently refresh data when a payment request is cancelled
      loadData();
    });
  }, [registerUpdateCallback, loadData]);

  // Countdown timer - updates every second to refresh time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => prev + 1);
      // Remove expired requests automatically
      setPaymentRequests(prevRequests => 
        prevRequests.filter(request => !isExpired(request.expires_at))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Real-time polling for payment request updates (to detect cancellations instantly)
  useEffect(() => {
    // Only poll if there are active payment requests
    if (paymentRequests.length === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const requests = await apiService.getPaymentRequests();
        // Filter out expired requests and only show pending ones
        const activeRequests = requests.filter(request => 
          request.status === 'pending' && !isExpired(request.expires_at)
        );
        setPaymentRequests(activeRequests);
      } catch (error) {
        // Silently fail - don't interrupt user experience
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [paymentRequests.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
  };

  const handleFaceRegistration = () => {
    router.push('/face-registration');
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

  const getDisplayName = (request: PaymentRequest) => {
    // Prioritize business_name if available
    if (request.business_name && request.business_name.trim()) {
      return request.business_name;
    }
    
    // Clean up merchant_name if it contains the merchant ID pattern
    if (request.merchant_name) {
      // If merchant_name contains "(acct_...)" pattern, extract just the business name part
      const match = request.merchant_name.match(/^(.+?)\s*\(acct_[^)]+\)$/);
      if (match) {
        return match[1].trim();
      }
      
      // If it's just "Merchant (acct_...)", try to use a fallback
      if (request.merchant_name.startsWith('Merchant (acct_')) {
        return 'Business'; // Generic fallback
      }
      
      return request.merchant_name;
    }
    
    return 'Unknown Merchant';
  };

  const handleApprovePayment = async (requestId: string) => {
    try {
      const request = paymentRequests.find(req => req.id === requestId);
      if (!request) {
        showAlert('Error', 'Payment request not found', undefined, 'error');
        return;
      }

      await apiService.approvePayment(requestId);
      
      // Send notification for successful payment approval
      await notificationService.notifyPaymentApproved({
        merchantName: getDisplayName(request),
        amount: request.amount,
        paymentId: requestId,
      });

      showAlert('Success', 'Payment request approved!', undefined, 'success');
      // Remove the approved request immediately from the list
      setPaymentRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      loadData(); // Refresh other data if necessary
    } catch (error: any) {
      // Handle specific error cases
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail || '';
        if (detail.includes('expired')) {
          showAlert(
            'Request Expired', 
            'This payment request has expired. The list will be refreshed automatically.', 
            undefined, 
            'warning'
          );
        } else if (detail.includes('cancelled') || detail.includes('not pending')) {
          showAlert(
            'Request Cancelled', 
            'This payment request has been cancelled by the merchant.', 
            undefined, 
            'warning'
          );
        } else {
          showAlert('Error', detail, undefined, 'error');
        }
        // Auto-refresh to remove the request
        await loadData();
      } else if (error?.response?.status === 404) {
        showAlert(
          'Request Not Found', 
          'This payment request has been cancelled by the merchant or no longer exists.', 
          undefined, 
          'warning'
        );
        // Auto-refresh to remove the request
        await loadData();
      } else {
        showAlert('Error', 'Failed to approve payment request', undefined, 'error');
      }
    }
  };

  const handleDeclinePayment = async (requestId: string) => {
    try {
      const request = paymentRequests.find(req => req.id === requestId);
      if (!request) {
        showAlert('Error', 'Payment request not found', undefined, 'error');
        return;
      }

      await apiService.declinePayment(requestId);
      
      // Send notification for payment decline
      await notificationService.notifyPaymentFailed({
        merchantName: getDisplayName(request),
        amount: request.amount,
        paymentId: requestId,
        reason: 'Declined by user',
      });

      showAlert('Success', 'Payment request declined', undefined, 'success');
      // Remove the declined request immediately from the list
      setPaymentRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      // Auto-refresh to get updated state
      await loadData();
    } catch (error: any) {
      showAlert('Error', 'Failed to decline payment request', undefined, 'error');
      // Refresh on error to ensure state is correct
      await loadData();
    }
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
          <View>
            <Text style={styles.greeting}>Hello, {user?.first_name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: tabBarHeight + insets.bottom + scale(20),
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Payment Requests - Top Priority */}
          {paymentRequests.length > 0 && (
            <View style={styles.transactionSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Requests</Text>
                {/* <TouchableOpacity onPress={() => router.navigate('/(tabs)/history')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity> */}
              </View>
              
              <View style={styles.transactionList}>
                {paymentRequests.slice(0, 2).map((request) => (
                  <View key={request.id} style={styles.transactionItem}>
                    <View style={styles.transactionTopRow}>
                      <View style={styles.transactionLeft}>
                        <View style={styles.transactionIcon}>
                          <Text style={styles.transactionEmoji}>
                            {getMerchantIcon(getDisplayName(request))}
                          </Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionMerchant}>
                            {getDisplayName(request)}
                          </Text>
                          <Text style={[styles.transactionDate, { color: getExpiryColor(request.expires_at) }]}>
                            {formatDate(request.created_at)} • {formatTimeRemaining(request.expires_at)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.requestAmount}>
                        {formatAmount(request.amount)}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.declineButton, styles.requestButton]}
                        onPress={() => handleDeclinePayment(request.id)}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.approveButton, styles.requestButtonPrimary]}
                        onPress={() => handleApprovePayment(request.id)}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Face Registration Prompt */}
          {user && !user.has_face_registered && (
          <TouchableOpacity 
            style={styles.facePrompt}
            onPress={handleFaceRegistration}
          >
            <View style={styles.facePromptContent}>
              <View style={styles.facePromptIcon}>
                <Ionicons name="scan" size={scale(24, 20, 28)} color="#6B46C1" />
              </View>
              <View style={styles.facePromptText}>
                <Text style={styles.facePromptTitle}>Register Your Face</Text>
                <Text style={styles.facePromptSubtitle}>
                  Enable face recognition for secure payments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(20, 18, 24)} color="#6B7280" />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCardsContainer}>
            <TouchableOpacity style={[styles.summaryCard, styles.earningsCard]}>
              <Ionicons name="trending-down" size={scale(24, 20, 28)} color="#FFFFFF" style={styles.summaryIcon} />
              <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Spent Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.summaryCard, styles.transactionsCard]}>
              <Ionicons name="swap-horizontal" size={scale(24, 20, 28)} color="#FFFFFF" style={styles.summaryIcon} />
              <Text style={styles.summaryAmount}>{completedTransactionsCount}</Text>
              <Text style={styles.summaryLabel}>Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Default Card */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Your Cards</Text>
          {defaultCard ? (
            <PaymentCard
              card={defaultCard}
              showDefaultBadge={true}
              onPress={() => router.navigate('/(tabs)/cards')}
            />
          ) : (
            <TouchableOpacity 
              style={styles.addCardPrompt}
              onPress={() => router.push('/add-card')}
            >
              <Ionicons name="add-circle-outline" size={scale(48, 40, 56)} color="#6B46C1" />
              <Text style={styles.addCardText}>Add Your First Card</Text>
              <Text style={styles.addCardSubtext}>
                Connect your payment method to get started
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
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
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    paddingBottom: scale(16),
    minHeight: scale(80),
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: scale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#FFFFFF',
    marginTop: scale(4),
    opacity: 0.9,
  },
  avatarContainer: {
    width: scale(48, 44, 56),
    height: scale(48, 44, 56),
    borderRadius: scale(24),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // Minimum touch target
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#6B46C1',
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
  },
  facePrompt: {
    marginHorizontal: scale(24),
    marginBottom: scale(24),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
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
    width: scale(48, 44, 56),
    height: scale(48, 44, 56),
    borderRadius: scale(24),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  facePromptText: {
    flex: 1,
  },
  facePromptTitle: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
  },
  facePromptSubtitle: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginTop: scale(2),
  },
  cardSection: {
    marginHorizontal: scale(24),
    marginBottom: scale(32),
  },
  sectionTitle: {
    fontSize: fontScale(20, 18, 24),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(16),
  },

  addCardPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(32),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: scale(16),
  },
  addCardSubtext: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginTop: scale(8),
    textAlign: 'center',
  },
  transactionSection: {
    marginHorizontal: scale(24),
    marginBottom: scale(32),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  viewAllText: {
    color: '#6B46C1',
    fontSize: fontScale(14, 12, 16),
    fontWeight: '500',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    overflow: 'hidden',
    padding: scale(8),
  },
  transactionItem: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: scale(12),
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: scale(40, 36, 48),
    height: scale(40, 36, 48),
    borderRadius: scale(20),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  transactionEmoji: {
    fontSize: fontScale(18, 16, 22),
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginTop: scale(2),
  },
  requestAmount: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 0,
  },
  requestActions: {
    flexDirection: 'row',
    gap: scale(12),
    alignItems: 'center',
  },
  requestButton: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 44, // Minimum touch target
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: 10,
  },
  declineButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: fontScale(14, 12, 16),
  },
  approveButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: 10,
  },
  requestButtonPrimary: {
    flex: 1,
    alignItems: 'center',
    minHeight: 44, // Minimum touch target
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontScale(14, 12, 16),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: scale(40),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    marginHorizontal: scale(24),
    marginTop: scale(20),
  },
  emptyStateText: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '600',
    color: '#4B5563',
    marginTop: scale(16),
  },
  emptyStateSubtext: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginTop: scale(4),
    textAlign: 'center',
    paddingHorizontal: scale(20),
  },
  summarySection: {
    marginHorizontal: scale(24),
    marginBottom: scale(24),
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: scale(16),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: scale(100, 90, 120),
  },
  earningsCard: {
    backgroundColor: '#10B981',
  },
  transactionsCard: {
    backgroundColor: '#6B46C1',
  },
  summaryIcon: {
    marginBottom: scale(8),
  },
  summaryAmount: {
    fontSize: fontScale(18, 16, 22),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: scale(4),
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: fontScale(12, 10, 14),
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500',
  },
  paymentRequestsTop: {
    marginHorizontal: scale(24),
    marginBottom: scale(20),
    backgroundColor: '#FEF3F2',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#FEE2E2',
    padding: scale(16),
  },
  sectionTitleTop: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: scale(4),
  },
  urgentTransactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentTransactionIcon: {
    width: scale(44, 40, 52),
    height: scale(44, 40, 52),
    borderRadius: scale(22),
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  urgentTransactionMerchant: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '700',
    color: '#1F2937',
  },
  urgentTransactionDate: {
    fontSize: fontScale(14, 12, 16),
    color: '#DC2626',
    marginTop: scale(2),
    fontWeight: '600',
  },
  urgentRequestAmount: {
    fontSize: fontScale(20, 18, 24),
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 0,
  },
});
