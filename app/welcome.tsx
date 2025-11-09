import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const feature1Opacity = useRef(new Animated.Value(0)).current;
  const feature2Opacity = useRef(new Animated.Value(0)).current;
  const feature3Opacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text animation
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Features animation (staggered)
      Animated.stagger(200, [
        Animated.timing(feature1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(feature2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(feature3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Buttons animation
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1F2937', '#374151', '#4B5563']}
        style={styles.gradient}
      >
        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Logo with Animation */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          
          {/* App Name and Tagline with Animation */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.appName}>FacePe</Text>
            <Text style={styles.tagline}>Secure Payments with Face Recognition</Text>
          </Animated.View>

          {/* Features Text with Staggered Animation */}
          <View style={styles.featuresContainer}>
            <Animated.View style={{ opacity: feature1Opacity }}>
              <View style={styles.featureRow}>
                <Ionicons name="scan" size={20} color="#9333EA" />
                <Text style={styles.featureText}>Advanced Face Recognition</Text>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: feature2Opacity }}>
              <View style={styles.featureRow}>
                <Ionicons name="shield-checkmark" size={20} color="#9333EA" />
                <Text style={styles.featureText}>Bank-Level Security</Text>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: feature3Opacity }}>
              <View style={styles.featureRow}>
                <Ionicons name="flash" size={20} color="#9333EA" />
                <Text style={styles.featureText}>Instant Transactions</Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Buttons Section with Animation */}
        <Animated.View 
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6B46C1', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInButtonGradient}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
            <Ionicons name="person-add" size={20} color="#9333EA" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  logo: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#E5E7EB',
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonsSection: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  signInButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  signInButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9333EA',
    gap: 8,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
  },
});
