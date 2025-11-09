import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';

export default function DeleteAccountConfirmScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmValid = confirmationText.toLowerCase().trim() === 'delete my account';

  const handleDeleteAccount = () => {
    // Check if user typed the correct confirmation text first
    if (confirmationText.toLowerCase().trim() !== 'delete my account') {
      showAlert(
        'Confirmation Required',
        'Please type "delete my account" exactly as shown in the text field above to confirm deletion.',
        undefined,
        'error'
      );
      return;
    }

    // If text is correct, show final confirmation
    showAlert(
      '⚠️ Final Confirmation',
      'This action cannot be undone. Your account will be scheduled for permanent deletion in 14 days. All your data, payment methods, and settings will be lost forever.',
      [
        { text: 'Keep My Account', style: 'cancel' },
        {
          text: 'Yes, Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              const response = await apiService.requestAccountDeletion();

              showAlert(
                'Account Deletion Scheduled',
                `Your account will be permanently deleted on ${response.scheduled_deletion_at ? new Date(response.scheduled_deletion_at).toLocaleDateString() : '14 days from now'}. You will now be logged out.`,
                [
                  {
                    text: 'Got it!',
                    onPress: async () => {
                      await logout();
                    },
                  },
                ],
                'success'
              );
            } catch (error: any) {
              showAlert(
                'Error',
                error.response?.data?.detail || 'Failed to schedule account deletion',
                undefined,
                'error'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      'warning'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#9333EA']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Deletion</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="warning" size={48} color="#EF4444" />
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Final Step</Text>
              <Text style={styles.subtitle}>
                This action cannot be undone. Please confirm by typing the text below.
              </Text>
            </View>

            {/* Confirmation Text Input */}
            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationTitle}>Confirmation Required</Text>
              <Text style={styles.confirmationSubtext}>
                Type "delete my account" to confirm deletion:
              </Text>
              <TextInput
                style={[
                  styles.confirmationInput,
                  confirmationText.toLowerCase().trim() === 'delete my account' && styles.confirmationInputValid,
                ]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="delete my account"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {confirmationText.toLowerCase().trim() === 'delete my account' && (
                <View style={styles.validationSuccess}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.validationSuccessText}>Confirmation text is correct</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer Delete Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) }, // Ensure safe area padding
        ]}
      >
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (isLoading || !isConfirmValid) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
          disabled={isLoading || !isConfirmValid}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isLoading || !isConfirmValid ? ['#9CA3AF', '#9CA3AF'] : ['#6B46C1', '#8B5CF6']
            }
            style={styles.deleteButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 130, // Increased padding to ensure content is not hidden by the footer
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    justifyContent: 'flex-start',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    minHeight: 500,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FECACA',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationSubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F8F9FF',
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmationInputValid: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3F0FF',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  validationSuccessText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0, // Ensure flexbox distributes width equally
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 0, // Ensure flexbox distributes width equally
  },
  deleteButtonDisabled: {
    shadowOpacity: 0.1,
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
