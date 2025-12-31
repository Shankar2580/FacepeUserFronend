import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../src/services/api';
import { PaymentMethod } from '../../src/constants/types';
import { useAuth } from '../../src/hooks/useAuth';
import { PaymentCard } from '../../src/components/ui/PaymentCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useAlert } from '../../src/components/ui/AlertModal';
import { wp, scale, fontScale } from '../../src/utils/responsive';
import { Colors } from '../../src/constants/Colors';

export default function CardsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const colorScheme = 'light'; // Using light theme by default
  const theme = Colors[colorScheme];

  // Load cards function
  const loadCards = useCallback(async () => {
    try {
      const cards = await apiService.getPaymentMethods();
      setPaymentMethods(cards);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showAlert('Oops', 'Unable to load your payment methods right now. Please try again later.', undefined, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh when screen is focused (fixes the refresh issue)
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  // Initial load
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await apiService.setDefaultPaymentMethod(cardId);
      await loadCards(); // Refresh the list
      showAlert('Success', 'Default card updated successfully', undefined, 'success');
    } catch (error: any) {
      showAlert('Error', 'Unable to set default card. Please try again.', undefined, 'error');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    showAlert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deletePaymentMethod(cardId);
              await loadCards();
              showAlert('Success', 'Card deleted successfully', undefined, 'success');
            } catch (error: any) {
              showAlert('Error', 'Unable to delete card. Please try again.', undefined, 'error');
            }
          },
        },
      ],
      'warning'
    );
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View>
          <Text style={styles.title}>Your Cards</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-card')}
        >
          <Ionicons name="add" size={scale(24, 20, 28)} color="#6B46C1" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + scale(100) } // Extra padding for tab bar
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.length > 0 ? (
          <View style={styles.cardsContainer}>
            {paymentMethods.map((card, index) => (
              <PaymentCard
                key={card.id}
                card={card}
                showDefaultBadge={true}
                showControls={true}
                onSetDefault={handleSetDefault}
                onDelete={handleDeleteCard}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="card-outline"
            title="No Cards Added"
            subtitle="Add your first payment method to get started with secure payments"
            actionText="Add Your First Card"
            onAction={() => router.push('/add-card')}
            variant="cards"
            animated={true}
          />
        )}

        {/* Add Card Button */}
        {paymentMethods.length > 0 && (
          <TouchableOpacity 
            style={styles.addAnotherCard}
            onPress={() => router.push('/add-card')}
          >
            <View style={styles.addCardContent}>
              <Ionicons name="add-circle-outline" size={scale(32, 28, 40)} color="#6B46C1" />
              <Text style={styles.addAnotherText}>Add Another Card</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={scale(24, 20, 28)} color="#059669" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Secure & Encrypted</Text>
              <Text style={styles.infoSubtitle}>
                Your payment information is protected with bank-level security
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={scale(24, 20, 28)} color="#F59E0B" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Fast Payments</Text>
              <Text style={styles.infoSubtitle}>
                Quick and seamless transactions with face recognition
              </Text>
            </View>
          </View>
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
  title: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardsContainer: {
    paddingHorizontal: scale(24),
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
    marginTop: scale(24),
    marginBottom: scale(8),
  },
  emptySubtitle: {
    fontSize: fontScale(16, 14, 18),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: scale(32),
  },
  addCardButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: 12,
    minHeight: 48, // Minimum touch target
  },
  addCardButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
  },
  addAnotherCard: {
    marginHorizontal: scale(24),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(24),
    marginBottom: scale(24),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
  },
  addAnotherText: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#6B46C1',
  },
  infoSection: {
    marginHorizontal: scale(24),
    marginBottom: scale(32),
    gap: scale(16),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    borderRadius: 12,
    gap: scale(16),
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontScale(16, 14, 18),
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSubtitle: {
    fontSize: fontScale(14, 12, 16),
    color: '#6B7280',
    marginTop: scale(4),
  },
});
