import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Linking,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius } from '@/src/constants/DesignSystem';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const insets = useSafeAreaInsets();
  
  const handleTermsPress = () => {
    Linking.openURL('https://facepe.ai/Terms');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onDecline}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDecline} accessibilityRole="button" accessibilityLabel="Dismiss privacy policy modal" />
        <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Please review our privacy policy</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionText}>
              Welcome to Facepe. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains what data we collect, how we use it, how we protect it, and your choices regarding your information when you use our mobile payment app and Face Pay feature.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect the following types of information to provide and improve our services:
            </Text>
            
            <Text style={styles.subsectionTitle}>2.1 Basic Personal Information</Text>
            <Text style={styles.sectionText}>
              Name, email address, phone number, and password. This information is required to create and manage your account, communicate important updates, and provide customer support.
            </Text>
            
            <Text style={styles.subsectionTitle}>2.2 Face Recognition Data</Text>
            <Text style={styles.sectionText}>
              We collect a facial selfie to enable the FacePe feature for secure biometric authentication during payment transactions. This biometric data is captured using your device's camera and is used exclusively for payment authorization.
            </Text>
            
            <Text style={styles.subsectionTitle}>2.3 Payment Information</Text>
            <Text style={styles.sectionText}>
              Credit card and other payment details are collected and securely processed to facilitate transactions through our app, with payment processing handled by Stripe, a trusted third-party payment gateway.
            </Text>
            
            <Text style={styles.subsectionTitle}>2.4 Device and Usage Data</Text>
            <Text style={styles.sectionText}>
              Information such as IP address, device identifiers, app version, and usage patterns collected to improve app functionality and user experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              Your information is used for the following purposes:{'\n'}
              • To create, manage, and secure your user account{'\n'}
              • To authenticate payments through the FacePe feature securely{'\n'}
              • To process and authorize payment transactions using Stripe{'\n'}
              • To communicate important service updates and respond to your inquiries{'\n'}
              • To improve and personalize our services{'\n'}
              • To comply with legal and regulatory obligations
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Sharing and Third Parties</Text>
            <Text style={styles.sectionText}>
              We may share your data with trusted third parties, including:
            </Text>
            
            <Text style={styles.subsectionTitle}>4.1 Stripe</Text>
            <Text style={styles.sectionText}>
              We use Stripe as our payment processor. Stripe may collect personal data such as payment details, transaction information, device identifiers, and cookies to operate, secure, and improve their payment services. Stripe employs strong security measures including encryption to protect your data. You can review Stripe's privacy practices in detail on their privacy policy page.
            </Text>
            
            <Text style={styles.subsectionTitle}>4.2 Other Third Parties</Text>
            <Text style={styles.sectionText}>
              • Payment processors and financial institutions for transaction processing{'\n'}
              • Technology providers who support the FacePe biometric authentication system{'\n'}
              • Regulatory and law enforcement agencies as required by law{'\n\n'}
              <Text style={styles.importantNote}>Important Note:</Text> We ensure that biometric data used for FacePe is encrypted and shared only with entities directly involved in processing and securing payments. We do not sell your personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Data Storage and Security</Text>
            <Text style={styles.sectionText}>
              We implement robust security measures, including encryption and access controls, to protect your personal and biometric data from unauthorized access, disclosure, or misuse. We retain your data only as long as necessary to fulfill the purposes outlined and to comply with legal obligations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:{'\n'}
              • Access, correct, or delete your personal information{'\n'}
              • Withdraw your consent for biometric data processing or opt out of the FacePe feature{'\n'}
              • Exercise your rights under the California Consumer Privacy Act (CCPA), including the right to opt out of the sale of your personal information (though we do not sell your data){'\n'}
              • File a complaint with a data protection authority if you believe your rights have been violated
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
            <Text style={styles.sectionText}>
              Our app is not intended for children under 16 years old. We do not knowingly collect personal information from children under 16.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to This Privacy Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our app and updating the effective date. We encourage you to review this policy periodically.
            </Text>
          </View>

        </ScrollView>

        <View style={[
          styles.footer,
          {
            paddingBottom: Platform.OS === 'ios'
              ? Math.max(insets.bottom, 10)
              : Math.max(insets.bottom, 16),
          },
        ]}>
          <TouchableOpacity style={[styles.singleButton, isTablet && styles.singleButtonTablet]} onPress={onAccept}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={[styles.singleButtonGradient, isTablet && styles.singleButtonGradientTablet]}
            >
              <Text style={[styles.singleButtonText, isTablet && styles.singleButtonTextTablet]}>I Understand</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    backgroundColor: '#F8F7FF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  importantNote: {
    fontWeight: 'bold',
    color: '#DC2626',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  singleButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  singleButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  singleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  singleButtonTablet: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  singleButtonGradientTablet: {
    paddingVertical: 22,
    paddingHorizontal: 48,
    minHeight: 56,
  },
  singleButtonTextTablet: {
    fontSize: 20,
    fontWeight: '700',
  },
  linkText: {
    color: '#6B46C1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
