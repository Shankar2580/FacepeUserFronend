import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '../../constants/types';
import { designSystem, spacing, shadows, borderRadius, gradients } from '../../constants/DesignSystem';

// Import card brand images
const cardBrandImages = {
  visa: require('../../../assets/images/Visa.png'),
  mastercard: require('../../../assets/images/mastercard.png'),
  discover: require('../../../assets/images/discover.png'),
  amex: require('../../../assets/images/AMX.png'),
};

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth > 768;

interface PaymentCardProps {
  // Card data
  card?: PaymentMethod | null;
  cardDetails?: {
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    complete?: boolean;
  };
  
  // Display options
  showDefaultBadge?: boolean;
  showControls?: boolean;
  isPreview?: boolean;
  variant?: 'default' | 'compact' | 'preview';
  
  // Interaction handlers
  onPress?: () => void;
  onSetDefault?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  
  // Style overrides
  style?: any;
}

export function PaymentCard({
  card,
  cardDetails,
  showDefaultBadge = false,
  showControls = false,
  isPreview = false,
  variant = 'default',
  onPress,
  onSetDefault,
  onDelete,
  style,
}: PaymentCardProps) {
  // Helper functions
  const formatCardNumber = (lastFour?: string): string => {
    if (!lastFour || typeof lastFour !== 'string') return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${lastFour}`;
  };

  const getCardBrandIcon = (brand?: string): string => {
    if (!brand || typeof brand !== 'string') return 'CARD';
    switch (brand.toLowerCase()) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'mastercard';
      case 'amex': return 'AMERICAN EXPRESS';
      case 'discover': return 'Discover';
      case 'unionpay': return 'UNIONPAY';
      case 'jcb': return 'JCB';
      case 'diners': return 'DINERS CLUB';
      case 'maestro': return 'MAESTRO';
      default: return brand.toUpperCase();
    }
  };

  const getCardBrandImage = (brand?: string) => {
    if (!brand || typeof brand !== 'string') return null;
    switch (brand.toLowerCase()) {
      case 'visa': return cardBrandImages.visa;
      case 'mastercard': return cardBrandImages.mastercard;
      case 'amex': return cardBrandImages.amex;
      case 'discover': return cardBrandImages.discover;
      default: return null;
    }
  };

  const getCardColor = (brand?: string): [string, string] => {
    if (!brand || typeof brand !== 'string') return [...gradients.cardDefault] as [string, string];
    
    switch (brand.toLowerCase()) {
      case 'visa': return [...gradients.cardVisa] as [string, string];
      case 'mastercard': return [...gradients.cardMastercard] as [string, string];
      case 'amex': return [...gradients.cardAmex] as [string, string];
      case 'discover': return [...gradients.cardDiscover] as [string, string];
      case 'unionpay': return ['#d32f2f', '#f44336'];
      case 'jcb': return ['#1976d2', '#2196f3'];
      case 'diners': return ['#424242', '#616161'];
      case 'maestro': return ['#7b1fa2', '#9c27b0'];
      default: return [...gradients.cardDefault] as [string, string];
    }
  };

  const formatExpiry = (month?: number, year?: number): string => {
    if (!month || !year || isNaN(month) || isNaN(year)) return '••/••';
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year).slice(-2);
    return `${monthStr}/${yearStr}`;
  };

  // Determine which data to use (card prop or cardDetails prop)
  const brand = card?.card_brand || cardDetails?.brand;
  const lastFour = card?.card_last_four || cardDetails?.last4;
  const expMonth = card?.card_exp_month || cardDetails?.expiryMonth;
  const expYear = card?.card_exp_year || cardDetails?.expiryYear;
  const isDefault = card?.is_default || false;
  const cardId = card?.id;

  // Get card colors
  const gradientColors = getCardColor(brand);

  // Determine card size based on variant
  const getCardStyle = () => {
    const baseStyle = [
      styles.creditCard,
      style,
    ];

    switch (variant) {
      case 'compact':
        return [...baseStyle, styles.compactCard];
      case 'preview':
        return [...baseStyle, styles.previewCard];
      default:
        return baseStyle;
    }
  };

  const CardContent = () => (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={getCardStyle()}
    >
      {/* Premium Card Background Pattern */}
      <View style={styles.cardPattern} />
      
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardBrand}>
          {getCardBrandIcon(brand)}
        </Text>
        <View style={styles.cardActions}>
          {(showDefaultBadge && isDefault) && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          )}
          {isPreview && cardDetails?.complete && (
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          )}
        </View>
      </View>
      
      {/* Premium Golden Chip */}
      <View style={styles.chipContainer}>
        <LinearGradient
          colors={['#fdeec9', '#d9a44a', '#a47839']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.cardChip}
        >
          <View style={styles.chipInner}>
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
            <View style={styles.chipGridPart} />
          </View>
        </LinearGradient>
      </View>
      
      {/* Card Number */}
      <Text style={[
        styles.cardNumber,
        variant === 'compact' && styles.compactCardNumber,
        variant === 'preview' && styles.previewCardNumber,
      ]}>
        {formatCardNumber(lastFour)}
      </Text>
      
      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardExpiry}>
          <Text style={styles.cardLabel}>VALID THRU</Text>
          <Text style={styles.cardValue}>
            {formatExpiry(expMonth, expYear)}
          </Text>
        </View>
        <View style={styles.cardNetwork}>
          {getCardBrandImage(brand) ? (
            <Image 
              source={getCardBrandImage(brand)} 
              style={styles.cardBrandImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.networkText}>
              {getCardBrandIcon(brand)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Card Shine Effect */}
      <View style={styles.cardShine} />
    </LinearGradient>
  );

  return (
    <View style={styles.cardWrapper}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <CardContent />
        </TouchableOpacity>
      ) : (
        <CardContent />
      )}
      
      {/* Card Controls */}
      {showControls && card && cardId && (
        <View style={styles.cardControls}>
          {!isDefault && onSetDefault && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onSetDefault(cardId)}
            >
              <Ionicons name="star-outline" size={20} color="#6B46C1" />
              <Text style={styles.controlButtonText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress={() => onDelete(cardId)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.controlButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.xxl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 345.6,
  },
  creditCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    minHeight: isTablet ? 200 : 180,
    aspectRatio: 1.586, // Standard credit card ratio
    ...shadows.card,
    overflow: 'hidden',
    position: 'relative',
  },
  compactCard: {
    minHeight: 160,
    padding: spacing.xl,
  },
  previewCard: {
    maxWidth: 320,
    aspectRatio: 1.586,
    minHeight: 'auto',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 2,
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    maxWidth: '70%',
    flexShrink: 1,
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
    backdropFilter: 'blur(10px)',
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 2,
  },
  chipContainer: {
    position: 'absolute',
    top: isTablet ? 70 : 60,
    left: 24,
    zIndex: 3,
  },
  cardChip: {
    width: isTablet ? 50 : 45,
    height: isTablet ? 38 : 35,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chipInner: {
    flex: 1,
    borderRadius: 6,
    margin: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    overflow: 'hidden',
  },
  chipGridPart: {
    width: '25%',
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: isTablet ? 20 : 16,
    fontWeight: '500',
    letterSpacing: isTablet ? 2.5 : 1.5,
    marginBottom: 24,
    marginTop: isTablet ? 45 : 40,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
    flexWrap: 'nowrap',
  },
  compactCardNumber: {
    fontSize: isTablet ? 18 : 16,
    marginBottom: 20,
    letterSpacing: isTablet ? 2 : 1.5,
  },
  previewCardNumber: {
    fontSize: isTablet ? 18 : 16,
    marginBottom: 20,
    letterSpacing: isTablet ? 2 : 1.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  cardExpiry: {
    flex: 1,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardNetwork: {
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandImage: {
    width: 45,
    height: 28,
    maxWidth: 45,
    maxHeight: 28,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  cardShine: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
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
});

export default PaymentCard;
