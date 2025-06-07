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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { PaymentMethod } from '../../constants/types';
import { useAuth } from '../../hooks/useAuth';

export default function CardsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const cards = await apiService.getPaymentMethods();
      setPaymentMethods(cards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatCardNumber = (lastFour: string) => {
    if (!lastFour || typeof lastFour !== 'string') return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${lastFour}`;
  };

  const getCardBrandIcon = (brand: string) => {
    if (!brand || typeof brand !== 'string') return '💳'; // Handle undefined/null/non-string brand
    switch (brand.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'AMEX';
      case 'discover': return 'DISCOVER';
      default: return 'CARD';
    }
  };

  const getCardColor = (brand: string, isDefault: boolean) => {
    if (isDefault) return ['#667eea', '#764ba2']; // Premium purple gradient for default
    if (!brand || typeof brand !== 'string') return ['#4A5568', '#2D3748']; // Handle undefined/null/non-string brand
    
    switch (brand.toLowerCase()) {
      case 'visa': return ['#1e3c72', '#2a5298']; // Premium blue gradient
      case 'mastercard': return ['#ff6b6b', '#ee5a24']; // Premium red gradient
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cards</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-card')}
        >
          <Ionicons name="add" size={24} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.length > 0 ? (
          <View style={styles.cardsContainer}>
            {paymentMethods.map((card, index) => {
              const gradientColors = getCardColor(card.card_brand, card.is_default);
              return (
                <View key={card.id} style={styles.cardWrapper}>
                  <View 
                    style={[
                      styles.creditCard,
                      { backgroundColor: gradientColors[0] }
                    ]}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardBrand}>
                        {getCardBrandIcon(card.card_brand)}
                      </Text>
                      <View style={styles.cardActions}>
                        {card.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>DEFAULT</Text>
                          </View>
                        )}
                        <View style={styles.cardChip} />
                      </View>
                    </View>

                    {/* Card Number */}
                    <Text style={styles.cardNumber}>
                      {formatCardNumber(card.card_last_four)}
                    </Text>

                    {/* Card Footer - Only Expiry */}
                    <View style={styles.cardFooter}>
                      <View style={styles.cardExpiry}>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardValue}>
                          {formatExpiry(card.card_exp_month, card.card_exp_year)}
                        </Text>
                      </View>
                      <View style={styles.cardNetwork}>
                        <Text style={styles.networkText}>
                          {getCardBrandIcon(card.card_brand)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Controls */}
                  <View style={styles.cardControls}>
                    {!card.is_default && (
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => handleSetDefault(card.id)}
                      >
                        <Ionicons name="star-outline" size={20} color="#6B46C1" />
                        <Text style={styles.controlButtonText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.controlButton, styles.deleteButton]}
                      onPress={() => handleDeleteCard(card.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      <Text style={[styles.controlButtonText, styles.deleteButtonText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
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
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
  },
  cardsContainer: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginBottom: 24,
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
    position: 'relative',
    overflow: 'hidden',
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
    width: 32,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardExpiry: {
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardControls: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
  },
  deleteButtonText: {
    color: '#EF4444',
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
}); 