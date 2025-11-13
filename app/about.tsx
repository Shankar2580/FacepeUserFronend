import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About FacePe</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About FacePe</Text>
          <Text style={styles.sectionText}>
            We're revolutionizing payments by making facial recognition a seamless, secure, and incredibly convenient way to complete your everyday transactions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            To create a world where payments are instant, secure, and completely contactless. We believe that technology should simplify our lives, not complicate them.
          </Text>
          <Text style={styles.sectionText}>
            FacePe was born from the idea that your face is the most secure and convenient form of identification you carry everywhere. By combining cutting-edge facial recognition with robust security protocols, we're making the future of payments available today.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Drives Us</Text>
          <View style={styles.bulletList}>
            {[
              'Security First',
              'Lightning Fast',
              'User Friendly',
              'Universal',
            ].map((item) => (
              <View key={item} style={styles.bulletItem}>
                <Ionicons name="ellipse" size={6} color="#6B46C1" />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>Trust & Security</Text>
            <Text style={styles.sectionText}>
              Your security is our top priority. We use bank-level encryption and never store your biometric data on our servers.
            </Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>User Experience</Text>
            <Text style={styles.sectionText}>
              We design every interaction to be intuitive and delightful, making technology invisible and payments effortless.
            </Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>Social Impact</Text>
            <Text style={styles.sectionText}>
              We're committed to financial inclusion and helping small businesses adopt modern payment technologies.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 12,
  },
  headerSpacer: {
    width: 40,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 15,
    color: '#374151',
  },
  valueCard: {
    backgroundColor: '#F9F5FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0D7FF',
    marginTop: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 8,
  },
});

