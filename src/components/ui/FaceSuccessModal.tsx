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

const { width, height } = Dimensions.get('window');

interface FaceSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  isUpdate?: boolean; // true for face update, false for face registration
}

export const FaceSuccessModal: React.FC<FaceSuccessModalProps> = ({
  visible,
  onClose,
  userName,
  isUpdate = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      // Continuous pulse animation for the face icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations when modal is hidden
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const title = isUpdate ? 'Face Updated Successfully!' : 'Face Registration Complete!';
  const subtitle = isUpdate 
    ? 'Your facial recognition has been updated and is ready to use'
    : 'Your face is now registered for secure biometric authentication';

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
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
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
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="scan" size={48} color="white" />
                </Animated.View>
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

              {/* User Name Display */}
              {userName && (
                <View style={styles.userContainer}>
                  <View style={styles.userIcon}>
                    <Ionicons name="person" size={20} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.userName}>{userName}</Text>
                </View>
              )}

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Encrypted biometric storage</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="flash" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Instant payment authentication</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Bank-grade security enabled</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Ready for AutoPay setup</Text>
                </View>
              </View>
            </Animated.View>

            {/* Action Button */}
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </LinearGradient>

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
            <Ionicons name="scan" size={14} color="#8B5CF6" />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  userIcon: {
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  featuresContainer: {
    gap: 12,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
  },
  doneButtonText: {
    color: 'white',
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