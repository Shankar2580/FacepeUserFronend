import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

export default function AddCardScreen() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const getCardBrand = (number: string) => {
    const digits = number.replace(/\D/g, '');
    if (digits.startsWith('4')) return 'visa';
    if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
    if (digits.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const getCardIcon = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  const validateCard = () => {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length < 13 || digits.length > 19) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || expiryDate.length !== 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV');
      return false;
    }
    
    if (!cardholderName.trim()) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name');
      return false;
    }
    
    return true;
  };

  const handleAddCard = async () => {
    if (!validateCard()) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, you would use Stripe SDK here
      // For now, we'll simulate the process
      
      // Simulate Stripe payment method creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll create a mock Stripe payment method ID
      const mockStripePaymentMethodId = `pm_${Math.random().toString(36).substr(2, 24)}`;
      
      // Add payment method to backend
      await apiService.addPaymentMethod(mockStripePaymentMethodId);
      
      Alert.alert(
        'Card Added Successfully!',
        'Your payment method has been added to your account.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      
    } catch (error: any) {
      console.error('Failed to add card:', error);
      Alert.alert(
        'Failed to Add Card',
        error.response?.data?.message || 'Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cardBrand = getCardBrand(cardNumber);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <View style={[styles.creditCard, { backgroundColor: cardBrand === 'visa' ? '#1A1F71' : cardBrand === 'mastercard' ? '#EB001B' : '#006FCF' }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{getCardIcon(cardBrand)}</Text>
              <Text style={styles.cardBrandText}>{cardBrand.toUpperCase()}</Text>
            </View>
            
            <Text style={styles.cardNumber}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>
            
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>CARDHOLDER</Text>
                <Text style={styles.cardText}>
                  {cardholderName || 'YOUR NAME'}
                </Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>EXPIRES</Text>
                <Text style={styles.cardText}>
                  {expiryDate || 'MM/YY'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              value={cardholderName}
              onChangeText={setCardholderName}
              placeholder="John Doe"
              autoCapitalize="words"
            />
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            <Text style={styles.securityText}>
              Your card information is encrypted and secure
            </Text>
          </View>
        </View>

        {/* Add Card Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={handleAddCard}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Card</Text>
              </>
            )}
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  cardPreview: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  creditCard: {
    borderRadius: 20,
    padding: 24,
    aspectRatio: 1.6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
  },
  cardBrandText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  addButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 