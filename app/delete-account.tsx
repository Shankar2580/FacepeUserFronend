import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';

export default function DeleteAccountScreen() {
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
        'warning'
      );
      return;
    }

    // If text is correct, show final confirmation
    showAlert(
      'Final Confirmation',
      'Are you absolutely sure? This action will schedule your account for deletion in 14 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              const response = await apiService.requestAccountDeletion();

              showAlert(
                'Account Deletion Scheduled',
                `Your account will be permanently deleted on ${response.scheduled_deletion_at ? new Date(response.scheduled_deletion_at).toLocaleDateString() : '14 days from now'}. You can cancel this within 14 days.`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ],
                'success'
              );
            } catch (error: any) {
              showAlert(
                'Error',
                error.response?.data?.detail || 'Failed to schedule account deletion',
                undefined,
                'warning'
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

  const handleCancelDeletion = () => {
    showAlert(
      'Cancel Deletion',
      'Do you want to cancel the scheduled account deletion?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              await apiService.cancelAccountDeletion();

              showAlert(
                'Deletion Cancelled',
                'Your account deletion has been cancelled. Your account will remain active.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ],
                'success'
              );
            } catch (error: any) {
              showAlert(
                'Error',
                error.response?.data?.detail || 'Failed to cancel account deletion',
                undefined,
                'warning'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      'warning' // Changed from 'info' to 'warning' for purple theme
    );
  };

  const isPendingDeletion = user?.pending_deletion === true;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
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
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={48} color="#EF4444" />
          </View>
        </View>

        {isPendingDeletion ? (
          <>
            {/* Pending Deletion Card */}
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <Ionicons name="time-outline" size={24} color="#F59E0B" />
                <Text style={styles.pendingTitle}>Deletion Scheduled</Text>
              </View>
              <Text style={styles.pendingText}>
                Your account is scheduled for deletion on{' '}
                <Text style={styles.pendingDate}>
                  {user?.scheduled_deletion_at 
                    ? new Date(user.scheduled_deletion_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown date'
                  }
                </Text>
              </Text>
              <Text style={styles.pendingSubtext}>
                You can cancel this deletion at any time before the scheduled date.
              </Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleCancelDeletion}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#059669']}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Cancel Deletion</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Warning Card */}
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Before You Continue</Text>
              <Text style={styles.warningText}>
                Deleting your account will permanently remove:
              </Text>
              
              <View style={styles.warningList}>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.warningItemText}>All your personal information</Text>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.warningItemText}>Payment methods and transaction history</Text>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.warningItemText}>Face recognition data</Text>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.warningItemText}>Auto-pay settings</Text>
                </View>
                <View style={styles.warningItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.warningItemText}>All app preferences and settings</Text>
                </View>
              </View>
            </View>

            {/* Grace Period Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>14-Day Grace Period</Text>
                <Text style={styles.infoText}>
                  Your account will be scheduled for deletion in 14 days. You can cancel this at any time during this period.
                </Text>
              </View>
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
                  confirmationText.toLowerCase().trim() === 'delete my account' && styles.confirmationInputValid
                ]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="delete my account"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {confirmationText.toLowerCase().trim() === 'delete my account' && (
                <View style={styles.validationSuccess}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.validationSuccessText}>Confirmation text is correct</Text>
                </View>
              )}
            </View>

            {/* Cancel Link */}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelLinkText}>Never mind, keep my account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Fixed Footer Delete Button - Only show when not pending deletion */}
      {!isPendingDeletion && (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 10) }
          ]}
        >
          <View style={styles.footerButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                (isLoading || !isConfirmValid) && styles.deleteButtonDisabled
              ]}
              onPress={handleDeleteAccount}
              disabled={isLoading || !isConfirmValid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(isLoading || !isConfirmValid) ? ['#9CA3AF', '#9CA3AF'] : ['#EF4444', '#DC2626']}
                style={styles.deleteButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.2)',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  footerButtonWrapper: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FECACA',
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  pendingText: {
    fontSize: 15,
    color: '#78350F',
    marginBottom: 12,
    lineHeight: 22,
  },
  pendingDate: {
    fontWeight: 'bold',
    color: '#B45309',
  },
  pendingSubtext: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  warningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  warningList: {
    gap: 12,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  deleteButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonDisabled: {
    shadowOpacity: 0.1,
  },
  deleteButtonGradient: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 24,
  },
  actionButtonDisabled: {
    shadowOpacity: 0.1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  
  // Confirmation Input Styles
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  confirmationInputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  validationSuccessText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});
