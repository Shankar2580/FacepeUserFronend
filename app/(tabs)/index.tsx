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
import { apiService } from '../../src/services/api';
import { notificationService } from '../../src/services/notificationService';
// SafeAreaView no longer needed - using View with paddingTop: insets.top
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function HomeScreen() {
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [completedTransactionsCount, setCompletedTransactionsCount] = useState<number>(0);
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { showAlert, AlertComponent } = useAlert();

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
        setPaymentRequests(requests.filter(request => request.status === 'pending'));
      } catch (requestError) {
        // console.log removed for production
        setPaymentRequests([]);
      }
    } catch (error: any) {
      // console.error removed for production
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
    } catch (error) {
      // console.error removed for production
      showAlert('Error', 'Failed to approve payment request', undefined, 'error');
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
      loadData(); // Refresh other data if necessary
    } catch (error) {
      // console.error removed for production
      showAlert('Error', 'Failed to decline payment request', undefined, 'error');
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
            onPress={() => router.push('/(tabs)/profile')}
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
              paddingBottom: tabBarHeight + insets.bottom + 20,
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Payment Requests - Top Priority */}
          {paymentRequests.length > 0 && (
            <View style={styles.paymentRequestsTop}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleTop}>⚡ Payment Requests</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.transactionList}>
                {paymentRequests.slice(0, 2).map((request) => (
                  <View key={request.id} style={styles.urgentTransactionItem}>
                    <View style={styles.transactionTopRow}>
                      <View style={styles.transactionLeft}>
                        <View style={styles.urgentTransactionIcon}>
                          <Text style={styles.transactionEmoji}>
                            {getMerchantIcon(getDisplayName(request))}
                          </Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.urgentTransactionMerchant}>
                            {getDisplayName(request)}
                          </Text>
                          <Text style={styles.urgentTransactionDate}>
                            {formatDate(request.created_at)} • {getTimeRemaining(request.expires_at)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.urgentRequestAmount}>
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

        {/* Today's Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCardsContainer}>
            <TouchableOpacity style={[styles.summaryCard, styles.earningsCard]}>
              <Ionicons name="trending-down" size={24} color="#FFFFFF" style={styles.summaryIcon} />
              <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Spent Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.summaryCard, styles.transactionsCard]}>
              <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" style={styles.summaryIcon} />
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
              onPress={() => router.push('/(tabs)/cards')}
            />
          ) : (
            <TouchableOpacity 
              style={styles.addCardPrompt}
              onPress={() => router.push('/add-card')}
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
                        <Text style={styles.transactionDate}>
                          {formatDate(request.created_at)} • {getTimeRemaining(request.expires_at)}
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
  greeting: {
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
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 8,
  },
  transactionItem: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
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
  requestAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 0,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  requestButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  declineButtonText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  requestButtonPrimary: {
    flex: 1,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  summarySection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 100,
  },
  earningsCard: {
    backgroundColor: '#10B981',
  },
  transactionsCard: {
    backgroundColor: '#6B46C1',
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500',
  },
  paymentRequestsTop: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FEF3F2',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    padding: 16,
  },
  sectionTitleTop: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  urgentTransactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  urgentTransactionMerchant: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  urgentTransactionDate: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 2,
    fontWeight: '600',
  },
  urgentRequestAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 0,
  },
});
