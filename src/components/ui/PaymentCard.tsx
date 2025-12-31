import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { gradients } from '../../constants/DesignSystem';
import { PaymentMethod } from '../../constants/types';
import { fontScale, scale, wp } from '../../utils/responsive';

// Import card brand images
const cardBrandImages = {
  visa: require('../../../assets/images/Visa.png'),
  mastercard: require('../../../assets/images/mastercard.png'),
  discover: require('../../../assets/images/discover.png'),
  amex: require('../../../assets/images/AMX.png'),
};

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
              <Ionicons name="checkmark-circle" size={scale(20, 18, 24)} color="#10B981" />
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
              <Ionicons name="star-outline" size={scale(20, 18, 24)} color="#6B46C1" />
              <Text style={styles.controlButtonText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress={() => onDelete(cardId)}
            >
              <Ionicons name="trash-outline" size={scale(20, 18, 24)} color="#EF4444" />
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
    marginBottom: scale(24),
    alignSelf: 'center',
    width: wp(92), // 92% of screen width - responsive!
    maxWidth: 400, // Max width for tablets
  },
  creditCard: {
    borderRadius: scale(20),
    padding: scale(24),
    aspectRatio: 1.586, // Standard credit card ratio - maintains proportions
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(12) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  compactCard: {
    padding: scale(20),
  },
  previewCard: {
    maxWidth: wp(85),
    aspectRatio: 1.586,
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
    marginBottom: scale(20),
    zIndex: 2,
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: fontScale(14, 12, 18),
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
    gap: scale(12),
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: fontScale(10, 8, 12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: scale(2),
  },
  chipContainer: {
    position: 'absolute',
    top: scale(60, 50, 75),
    left: scale(24),
    zIndex: 3,
  },
  cardChip: {
    width: scale(45, 40, 55),
    height: scale(35, 30, 42),
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
    fontSize: fontScale(16, 14, 20),
    fontWeight: '500',
    letterSpacing: scale(1.5, 1, 2.5),
    marginBottom: scale(24),
    marginTop: scale(40, 35, 50),
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
    flexWrap: 'nowrap',
  },
  compactCardNumber: {
    fontSize: fontScale(16, 14, 18),
    marginBottom: scale(20),
    letterSpacing: scale(1.5, 1, 2),
  },
  previewCardNumber: {
    fontSize: fontScale(16, 14, 18),
    marginBottom: scale(20),
    letterSpacing: scale(1.5, 1, 2),
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
    fontSize: fontScale(9, 8, 11),
    fontWeight: '600',
    marginBottom: scale(4),
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardNetwork: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: 8,
    minHeight: scale(32, 28, 40),
    minWidth: scale(50, 45, 60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandImage: {
    width: scale(45, 40, 55),
    height: scale(28, 24, 34),
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: fontScale(12, 10, 14),
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
    marginTop: scale(12),
    gap: scale(12),
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: scale(12, 10, 14),
    paddingHorizontal: scale(16),
    borderRadius: 12,
    gap: scale(8),
    minHeight: 44, // Minimum touch target
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
    fontSize: fontScale(14, 12, 16),
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
