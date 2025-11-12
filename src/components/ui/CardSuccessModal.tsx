import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import card brand images
const cardBrandImages = {
  visa: require('../../../assets/images/Visa.png'),
  mastercard: require('../../../assets/images/mastercard.png'),
  discover: require('../../../assets/images/discover.png'),
  amex: require('../../../assets/images/AMX.png'),
};

const { width, height } = Dimensions.get('window');

interface CardSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  cardDetails?: {
    brand?: string;
    last4?: string;
  };
  /**
   * Indicates whether the newly-added card is the user's default payment method.
   * When true the modal will show a "Default" badge – otherwise the badge is hidden.
   */
  isDefault?: boolean;
}

export const CardSuccessModal: React.FC<CardSuccessModalProps> = ({
  visible,
  onClose,
  cardDetails,
  isDefault = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations when modal becomes visible
      Animated.sequence([
        // Scale in the success icon
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Fade in the content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Bounce effect for celebration
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations when modal is hidden
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  const getCardBrandIcon = (brand?: string): string => {
    if (!brand) return 'card';
    switch (brand.toLowerCase()) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      case 'discover': return 'card';
      default: return 'card';
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

  const getCardBrandColor = (brand?: string): string => {
    if (!brand) return '#6B46C1';
    switch (brand.toLowerCase()) {
      case 'visa': return '#1A1F71';
      case 'mastercard': return '#EB001B';
      case 'amex': return '#006FCF';
      case 'discover': return '#FF6000';
      default: return '#6B46C1';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" translucent />
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Success Icon with Animation */}
            <Animated.View 
              style={[
                styles.successIconContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { 
                      translateY: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={48} color="#10B981" />
              </View>
            </Animated.View>

            {/* Content with Fade Animation */}
            <Animated.View 
              style={[
                styles.contentContainer,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.successTitle}>Card Added Successfully!</Text>
              <Text style={styles.successSubtitle}>
                Your payment method has been securely saved
              </Text>

              {/* Card Details */}
              {cardDetails && (
                <View style={styles.cardDetailsContainer}>
                  <View style={styles.cardIcon}>
                    {getCardBrandImage(cardDetails.brand) ? (
                      <Image 
                        source={getCardBrandImage(cardDetails.brand)} 
                        style={styles.cardBrandImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons 
                        name={getCardBrandIcon(cardDetails.brand) as any} 
                        size={24} 
                        color={getCardBrandColor(cardDetails.brand)} 
                      />
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardBrand}>
                      {cardDetails.brand?.toUpperCase() || 'CARD'}
                    </Text>
                    <Text style={styles.cardNumber}>
                      •••• •••• •••• {cardDetails.last4 || '••••'}
                    </Text>
                  </View>
                  {isDefault && (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="star" size={16} color="#FFFFFF" />
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.featureText}>Secured with bank-grade encryption</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="flash" size={20} color="#F59E0B" />
                  <Text style={styles.featureText}>Ready for instant payments</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="lock-closed" size={20} color="#6B46C1" />
                  <Text style={styles.featureText}>Compatible with face recognition</Text>
                </View>
              </View>
            </Animated.View>

            {/* Action Button */}
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={onClose}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.doneButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Celebration Elements */}
          <Animated.View 
            style={[
              styles.celebrationElement,
              styles.celebrationElement1,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    rotate: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="star" size={20} color="#F59E0B" />
          </Animated.View>

          <Animated.View 
            style={[
              styles.celebrationElement,
              styles.celebrationElement2,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    rotate: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '-360deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="star" size={16} color="#10B981" />
          </Animated.View>

           
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#E6FFE6',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#10B98140',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  cardDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  cardIcon: {
    width: 50,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBrandImage: {
    width: 45,
    height: 28,
    maxWidth: 45,
    maxHeight: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 16,
    color: '#4B5563',
    fontFamily: 'Courier',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
  doneButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 120,
  },
  doneButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  celebrationElement: {
    position: 'absolute',
  },
  celebrationElement1: {
    top: 20,
    right: 20,
  },
  celebrationElement2: {
    top: 60,
    left: 10,
  },
  celebrationElement3: {
    bottom: 40,
    right: 30,
  },
}); 
