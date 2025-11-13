import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface TermsModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onDecline}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDecline} accessibilityRole="button" accessibilityLabel="Dismiss terms and conditions modal" />
        <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Please read these terms carefully before using the Facepe facial recognition payment service</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.lastUpdated}>Last Updated: January 1, 2025</Text>
            <Text style={styles.sectionText}>
              These Terms and Conditions govern your use of the Facepe mobile application and facial recognition payment service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Notice</Text>
            <Text style={styles.sectionText}>
              By using Facepe, you agree to these terms. Please read them carefully.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Security</Text>
            <Text style={styles.sectionText}>
              We're committed to protecting your data and providing secure payment services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing, downloading, installing, or using the Facepe mobile application ("App") or our facial recognition payment service ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use our App or Service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.sectionText}>
              Facepe is a facial recognition payment platform that allows users to make payments at participating merchants by scanning their face. The Service includes:{'\n'}
              • Mobile application for account management and payment card linking{'\n'}
              • Facial recognition technology for user authentication{'\n'}
              • Payment processing services through Stripe's secure payment infrastructure{'\n'}
              • Transaction history and account management features{'\n'}
              • Integration with US-based merchants and payment networks
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Eligibility and Account Requirements</Text>
            
            <Text style={styles.subsectionTitle}>3.1 Age Requirements</Text>
            <Text style={styles.sectionText}>
              You must be at least 18 years old to use the Facepe Service. By using our Service, you represent and warrant that you are at least 18 years of age.
            </Text>
            
            <Text style={styles.subsectionTitle}>3.2 Account Registration</Text>
            <Text style={styles.sectionText}>
              To use our Service, you must:{'\n'}
              • Provide accurate, current, and complete information during registration{'\n'}
              • Maintain and update your account information{'\n'}
              • Keep your account credentials secure and confidential{'\n'}
              • Notify us immediately of any unauthorized use of your account{'\n'}
              • Be responsible for all activities that occur under your account
            </Text>
            
            <Text style={styles.subsectionTitle}>3.3 Biometric Enrollment</Text>
            <Text style={styles.sectionText}>
              To use facial recognition payments, you must complete biometric enrollment by providing facial images. You consent to the processing of your biometric information as described in our Privacy Policy. You may withdraw this consent at any time by deleting your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Use of the Service</Text>
            
            <Text style={styles.subsectionTitle}>4.1 Permitted Use</Text>
            <Text style={styles.sectionText}>
              You may use the Facepe Service only for legitimate payment transactions at participating merchants. You agree to:{'\n'}
              • Use the Service in accordance with these Terms and applicable laws{'\n'}
              • Provide accurate information for all transactions{'\n'}
              • Only make payments for goods and services you are authorized to purchase{'\n'}
              • Comply with merchant terms and policies
            </Text>
            
            <Text style={styles.subsectionTitle}>4.2 Prohibited Activities</Text>
            <Text style={styles.sectionText}>
              You agree NOT to:{'\n'}
              • Use the Service for any illegal or unauthorized purpose{'\n'}
              • Attempt to circumvent or manipulate the facial recognition system{'\n'}
              • Share your account credentials or allow others to use your account{'\n'}
              • Use the Service to make fraudulent or unauthorized transactions{'\n'}
              • Interfere with or disrupt the Service or its servers{'\n'}
              • Reverse engineer, decompile, or attempt to extract source code{'\n'}
              • Violate any applicable laws, regulations, or third-party rights
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Payment Terms</Text>
            
            <Text style={styles.subsectionTitle}>5.1 Payment Methods</Text>
            <Text style={styles.sectionText}>
              You must link a valid credit card, debit card, or bank account to use the Service. You authorize us to charge your selected payment method for all transactions you make through the Service.
            </Text>
            
            <Text style={styles.subsectionTitle}>5.2 Transaction Processing</Text>
            <Text style={styles.sectionText}>
              When you make a payment using Facepe:{'\n'}
              • You authorize the transaction amount to be charged to your payment method{'\n'}
              • The transaction will be processed through Stripe's secure payment infrastructure{'\n'}
              • You will receive a transaction confirmation{'\n'}
              • Refunds and disputes will be handled according to your payment method's policies
            </Text>
            
            <Text style={styles.subsectionTitle}>5.3 Fees</Text>
            <Text style={styles.sectionText}>
              Facepe does not currently charge users transaction fees. However, your payment method provider (bank or card issuer) may charge fees. We reserve the right to implement fees in the future with 30 days' notice.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Privacy and Data Protection</Text>
            <Text style={styles.sectionText}>
              Your privacy is important to us. Our collection, use, and protection of your personal information, including biometric data, is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </Text>
            
            <Text style={styles.subsectionTitle}>Biometric Data Security</Text>
            <Text style={styles.sectionText}>
              Your biometric templates are stored locally on your device only. We never store or have access to your actual biometric data on our servers.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Security</Text>
            
            <Text style={styles.subsectionTitle}>7.1 System Security</Text>
            <Text style={styles.sectionText}>
              We implement industry-standard security measures to protect the Service and your information. However, no system is completely secure, and we cannot guarantee absolute security.
            </Text>
            
            <Text style={styles.subsectionTitle}>7.2 User Responsibilities</Text>
            <Text style={styles.sectionText}>
              You are responsible for:{'\n'}
              • Keeping your device secure and using appropriate device security features{'\n'}
              • Protecting your account credentials and biometric information{'\n'}
              • Reporting any suspected unauthorized use immediately{'\n'}
              • Using the Service only on trusted, secure networks
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
            <Text style={styles.importantNote}>Important Limitation</Text>
            <Text style={styles.sectionText}>
              Our liability is limited as set forth in this section. Please read carefully.{'\n\n'}
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FACEPE AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:{'\n'}
              • Any indirect, incidental, special, consequential, or punitive damages{'\n'}
              • Loss of profits, data, use, goodwill, or other intangible losses{'\n'}
              • Damages resulting from unauthorized access to or alteration of your transmissions or data{'\n'}
              • Damages resulting from merchant disputes or refusal to accept payment{'\n'}
              • Technical malfunctions or service interruptions{'\n\n'}
              Our total liability to you for all claims arising from or relating to the Service shall not exceed the amount of fees you paid to us in the 12 months preceding the claim.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Indemnification</Text>
            <Text style={styles.sectionText}>
              You agree to indemnify, defend, and hold harmless Facepe and its affiliates from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from or relating to:{'\n'}
              • Your use of the Service{'\n'}
              • Your violation of these Terms{'\n'}
              • Your violation of any law or regulation{'\n'}
              • Your violation of any third party's rights
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Service Availability</Text>
            <Text style={styles.sectionText}>
              We strive to provide reliable service but cannot guarantee that the Service will be available at all times. We may suspend or discontinue the Service temporarily for maintenance, updates, or other reasons. We will provide reasonable notice when possible.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Termination</Text>
            
            <Text style={styles.subsectionTitle}>11.1 Termination by You</Text>
            <Text style={styles.sectionText}>
              You may terminate your account at any time by deleting the App or contacting our support team. Upon termination, your biometric templates stored on your device will be automatically deleted.
            </Text>
            
            <Text style={styles.subsectionTitle}>11.2 Termination by Us</Text>
            <Text style={styles.sectionText}>
              We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason at our sole discretion. We will provide reasonable notice when possible.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may update these Terms from time to time. We will notify you of material changes through the App or by email. Your continued use of the Service after the effective date constitutes acceptance of the new Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Governing Law and Dispute Resolution</Text>
            
            <Text style={styles.subsectionTitle}>13.1 Governing Law</Text>
            <Text style={styles.sectionText}>
              These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.
            </Text>
            
            <Text style={styles.subsectionTitle}>13.2 Dispute Resolution</Text>
            <Text style={styles.sectionText}>
              Any disputes arising from these Terms or the Service will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to participate in class action lawsuits.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Miscellaneous</Text>
            
            <Text style={styles.subsectionTitle}>14.1 Entire Agreement</Text>
            <Text style={styles.sectionText}>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Facepe regarding the Service.
            </Text>
            
            <Text style={styles.subsectionTitle}>14.2 Severability</Text>
            <Text style={styles.sectionText}>
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue to be valid and enforceable.
            </Text>
            
            <Text style={styles.subsectionTitle}>14.3 Assignment</Text>
            <Text style={styles.sectionText}>
              You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.
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
  lastUpdated: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
    marginBottom: 12,
  },
  importantNote: {
    fontWeight: 'bold',
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 8,
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
});
