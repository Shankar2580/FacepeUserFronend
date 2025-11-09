import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ProcessingAnimationProps {
  visible: boolean;
  type: 'face' | 'card' | 'payment' | 'generic';
  title?: string;
  subtitle?: string;
}

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({
  visible,
  type,
  title,
  subtitle,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scale in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Continuous spin animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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

      // Dots animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
      dotsAnim.setValue(0);
    }
  }, [visible]);

  const getAnimationConfig = () => {
    switch (type) {
      case 'face':
        return {
          icon: 'scan',
          gradientColors: ['#6B46C1', '#8B5CF6', '#06B6D4'],
          defaultTitle: 'Processing Face',
          defaultSubtitle: 'Analyzing biometric data...',
        };
      case 'card':
        return {
          icon: 'card',
          gradientColors: ['#10B981', '#059669', '#047857'],
          defaultTitle: 'Adding Card',
          defaultSubtitle: 'Securing payment method...',
        };
      case 'payment':
        return {
          icon: 'cash',
          gradientColors: ['#F59E0B', '#D97706', '#B45309'],
          defaultTitle: 'Processing Payment',
          defaultSubtitle: 'Completing transaction...',
        };
      default:
        return {
          icon: 'hourglass',
          gradientColors: ['#6366F1', '#8B5CF6', '#A855F7'],
          defaultTitle: 'Processing',
          defaultSubtitle: 'Please wait...',
        };
    }
  };

  const config = getAnimationConfig();
  const displayTitle = title || config.defaultTitle;
  const displaySubtitle = subtitle || config.defaultSubtitle;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={config.gradientColors as [string, string, string]}
          style={styles.content}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Main Icon with Spin Animation */}
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [
                  { rotate: spin },
                  { scale: pulseAnim },
                ],
              }
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name={config.icon as any} size={48} color="white" />
            </View>
          </Animated.View>

          {/* Orbiting Dots */}
          <View style={styles.orbitContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.orbitDot,
                  {
                    transform: [
                      {
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [`${index * 120}deg`, `${index * 120 + 360}deg`],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      opacity: dotsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}
                />
              </Animated.View>
            ))}
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{displayTitle}</Text>
            <Text style={styles.subtitle}>{displaySubtitle}</Text>
            
            {/* Animated Dots */}
            <View style={styles.dotsContainer}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.textDot,
                    {
                      opacity: dotsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: index === 0 ? [0.3, 1] : index === 1 ? [0.6, 1] : [1, 0.3],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.8,
    maxWidth: 320,
  },
  content: {
    borderRadius: 24,
    padding: 40,
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
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  orbitContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  textDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
}); 
