import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  buttonText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  buttonText = 'Continue',
  iconName = 'checkmark-circle',
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
                <Ionicons name={iconName} size={64} color="#10B981" />
              </View>
            </Animated.View>

            {/* Content with Fade Animation */}
            <Animated.View 
              style={[
                styles.contentContainer,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.successTitle}>{title}</Text>
              <Text style={styles.successSubtitle}>{subtitle}</Text>
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
                <Text style={styles.doneButtonText}>{buttonText}</Text>
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
            <Ionicons name="sparkles" size={16} color="#06B6D4" />
          </Animated.View>

          <Animated.View 
            style={[
              styles.celebrationElement,
              styles.celebrationElement3,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    scale: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          </Animated.View>

          <Animated.View 
            style={[
              styles.celebrationElement,
              styles.celebrationElement4,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    rotate: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="checkmark-circle" size={14} color="#8B5CF6" />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    position: 'relative',
  },
  modalContent: {
    backgroundColor: '#E6FFE6',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B98140',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 120,
  },
  doneButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    left: 20,
  },
  celebrationElement3: {
    bottom: 80,
    right: 30,
  },
  celebrationElement4: {
    bottom: 40,
    left: 30,
  },
});
