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
    return `•••• •••• •••• ${lastFour}`;
  };

  const getCardColor = (brand: string, isDefault: boolean) => {
    if (isDefault) return '#6B46C1'; // Purple for default
    
    switch (brand.toLowerCase()) {
      case 'visa': return '#1A365D';
      case 'mastercard': return '#E53E3E';
      case 'amex': return '#2D3748';
      default: return '#4A5568';
    }
  };

  const getCardGradient = (brand: string, isDefault: boolean) => {
    if (isDefault) return ['#6B46C1', '#9333EA'];
    
    switch (brand.toLowerCase()) {
      case 'visa': return ['#1A365D', '#2D3748'];
      case 'mastercard': return ['#E53E3E', '#C53030'];
      case 'amex': return ['#2D3748', '#1A202C'];
      default: return ['#4A5568', '#2D3748'];
    }
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
            {paymentMethods.map((card, index) => (
              <View key={card.id} style={styles.cardWrapper}>
                <View 
                  style={[
                    styles.creditCard,
                    { backgroundColor: getCardColor(card.card_brand, card.is_default) }
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardBrand}>
                      {card.card_brand.toUpperCase()}
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

                  {/* Card Footer */}
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
                        {String(card.card_exp_month).padStart(2, '0')}/
                        {String(card.card_exp_year).slice(-2)}
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
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginBottom: 24,
  },
  creditCard: {
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  cardControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 64,
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
    marginBottom: 12,
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
    paddingHorizontal: 32,
    paddingVertical: 16,
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