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
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { PaymentMethod } from '../../constants/types';
import { useAuth } from '../../hooks/useAuth';
import { PaymentCard } from '../../components/ui/PaymentCard';

export default function CardsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Load cards function
  const loadCards = useCallback(async () => {
    try {
      const cards = await apiService.getPaymentMethods();
      setPaymentMethods(cards);
    } catch (error: any) {
      console.error('Failed to load cards:', error);
      if (error?.response?.status !== 401) {
        Alert.alert('Oops', 'Unable to load your payment methods right now. Please try again later.');
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
      Alert.alert('Success', 'Default card updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to set default card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
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
              Alert.alert('Success', 'Card deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete card');
            }
          },
        },
      ]
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
          <Text style={styles.subtitle}>Manage your payment methods</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-card')}
        >
          <Ionicons name="add" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 } // Extra padding for tab bar
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="card-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Cards Added</Text>
            <Text style={styles.emptySubtitle}>
              Add your first payment method to get started with secure payments
            </Text>
            <TouchableOpacity 
              style={styles.addCardButton}
              onPress={() => router.push('/add-card')}
            >
              <Text style={styles.addCardButtonText}>Add Your First Card</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Card Button */}
        {paymentMethods.length > 0 && (
          <TouchableOpacity 
            style={styles.addAnotherCard}
            onPress={() => router.push('/add-card')}
          >
            <View style={styles.addCardContent}>
              <Ionicons name="add-circle-outline" size={32} color="#6B46C1" />
              <Text style={styles.addAnotherText}>Add Another Card</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Secure & Encrypted</Text>
              <Text style={styles.infoSubtitle}>
                Your payment information is protected with bank-level security
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={24} color="#F59E0B" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Fast Payments</Text>
              <Text style={styles.infoSubtitle}>
                Quick and seamless transactions with face recognition
              </Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
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
    paddingHorizontal: 24,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addCardButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addAnotherCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addAnotherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
  infoSection: {
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
}); 