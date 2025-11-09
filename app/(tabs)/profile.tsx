import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../src/components/ui/AlertModal';
import { PrivacyPolicyModal } from '../../src/components/ui/PrivacyPolicyModal';
import { TermsModal } from '../../src/components/ui/TermsModal';
import { AutoPay, PaymentMethod } from '../../src/constants/types';
import { useAuth } from '../../src/hooks/useAuth';
import { useUpdates } from '../../src/hooks/useUpdates';
import { apiService } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  const { user, logout, refreshUser } = useAuth();
  const { isCheckingForUpdates, checkForUpdates, currentUpdateInfo, AlertComponent: UpdateAlertComponent } = useUpdates();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  useEffect(() => {
    // console.log removed for production
    
    if (user) {
      // Force refresh user data to get latest face registration status
      refreshUser();
      loadData();
      startAnimations();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsAccountActive(user.is_active ?? true);
    }
  }, [user]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      // console.log removed for production
      const [autoPayData, paymentMethodsData] = await Promise.all([
        apiService.getAutoPay(),
        apiService.getPaymentMethods()
      ]);
      
      setAutoPay(autoPayData || []);
      setPaymentMethods(paymentMethodsData || []);
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
      // Don't clear existing data on error - keep what we have
    } finally {
      setInitialLoad(false);
    }
  };

  const onRefresh = async () => {
    // console.log removed for production
    setRefreshing(true);
    try {
      await Promise.all([loadData(), refreshUser()]);
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    showAlert(
      isAccountActive ? 'Deactivate Account' : 'Activate Account',
      isAccountActive 
        ? 'This will temporarily disable all payment features. You can reactivate anytime.'
        : 'This will enable all payment features for your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAccountActive ? 'Deactivate' : 'Activate',
          style: isAccountActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // TODO: Implement account status toggle API
              setIsAccountActive(!isAccountActive);
              showAlert('Success', `Account ${isAccountActive ? 'deactivated' : 'activated'} successfully`, undefined, 'success');
            } catch (error: any) {
              showAlert('Error', 'Failed to update account status', undefined, 'error');
            }
          },
        },
      ],
      isAccountActive ? 'warning' : 'info'
    );
  };

  const handleFaceRegistration = () => {
    // Check both has_face_registered and face_active (backend returns both)
    const isFaceRegistered = user?.has_face_registered || user?.face_active;
    if (isFaceRegistered) {
      router.push('/update-face' as any);
    } else {
      router.push('/face-registration');
    }
  };

  const handleDeleteFace = () => {
    showAlert(
      'Delete Face Data',
      'Are you sure you want to delete your facial recognition data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              // console.log removed for production
              
              // Call the delete face API
              await apiService.deleteFace();
              
              // Update the user's face status in the backend
              await apiService.updateUserFaceStatus(false);
              
              // Refresh user data
              await refreshUser();
              
              showAlert('Success', 'Face data deleted successfully', [{ text: 'Done' }], 'success');
              
              // Refresh the profile data
              await loadData();
            } catch (error: any) {
              // console.error removed for production
              showAlert('Error', error.message || 'Failed to delete face data', undefined, 'error');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleCheckForUpdates = async () => {
    await checkForUpdates();
  };

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
      'info'
    );
  };

  // Check both has_face_registered and face_active (backend returns both)
  const isFaceRegistered = user?.has_face_registered || user?.face_active;

  const profileSections = [
    {
      title: 'Payment & Security',
      items: [
        {
          icon: 'scan',
          title: isFaceRegistered ? 'Update Face Data' : 'Register Your Face',
          subtitle: isFaceRegistered ? 'Update your biometric data' : 'Setup biometric authentication',
          action: 'setup',
          onPress: handleFaceRegistration,
          rightElement: isFaceRegistered ? (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.setupButton} onPress={handleFaceRegistration}>
              <Text style={styles.setupButtonText}>Setup</Text>
            </TouchableOpacity>
          ),
        },
        ...(isFaceRegistered ? [{
          icon: 'trash-outline',
          title: 'Delete Face Data',
          subtitle: 'Remove biometric data',
          action: 'delete',
          onPress: handleDeleteFace,
          rightElement: (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFace}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          ),
        }] : []),
        {
          icon: 'key-outline',
          title: 'Change Password',
          subtitle: 'Update security credentials',
          action: 'navigate',
          chevron: true,
          onPress: () => {
            // console.log removed for production
            router.push('/change-password');
          },
        },
        {
          icon: 'keypad-outline',
          title: 'Reset PIN',
          subtitle: 'Change your 4-digit security PIN',
          action: 'navigate',
          onPress: () => router.push('/pin-reset' as any),
          chevron: true,
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'cloud-download-outline',
          title: 'Check for Updates',
          subtitle: currentUpdateInfo?.channel ? `Channel: ${currentUpdateInfo.channel}` : 'Tap to check for updates',
          action: 'update',
          onPress: handleCheckForUpdates,
          rightElement: isCheckingForUpdates ? (
            <ActivityIndicator size="small" color="#6B46C1" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          ),
        },
        {
          icon: 'information-circle-outline',
          title: 'App Version',
          subtitle: `v1.0.1 ${currentUpdateInfo?.updateId ? `(${currentUpdateInfo.updateId.slice(0, 8)})` : ''}`,
          onPress: undefined,
        },
      ],
    },
  ];

  // Show loading state during initial load
  if (initialLoad && !user) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Don't render if no user data
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>No user data available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          {/* Empty header for profile */}
        </View>
      </LinearGradient>

      {/* User Profile Card */}
      <Animated.View 
        style={[
          styles.profileCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'S'}
            </Text>
          </LinearGradient>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        </View>
        
        {/* User Name with Edit Button */}
        <View style={styles.userNameContainer}>
          <Text style={styles.userName}>
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : 'User'
            }
          </Text>
          <TouchableOpacity
            style={styles.editNameButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/edit-profile' as any);
            }}
          >
            <Ionicons name="pencil" size={16} color="#6B46C1" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userEmail}>
          {user.email || user.phone_number || 'No contact info'}
        </Text>
        <Text style={styles.userPhone}>
          {user.phone_number || ''}
        </Text>
        
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>FACEPE</Text>
          <Text style={styles.brandSubtext}>Secure Facial Payment</Text>
        </View>
      </Animated.View>

      {/* Deletion Warning Banner */}
      {user?.pending_deletion && (
        <Animated.View 
          style={[
            styles.deletionWarningBanner,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Account Deletion Scheduled</Text>
            <Text style={styles.warningText}>
              Your account will be deleted on{' '}
              {user.scheduled_deletion_at 
                ? new Date(user.scheduled_deletion_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Unknown date'
              }
            </Text>
            <TouchableOpacity
              style={styles.cancelDeletionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/delete-account' as any);
              }}
            >
              <Text style={styles.cancelDeletionText}>Cancel Deletion</Text>
              <Ionicons name="arrow-forward" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 96 : 8) }}
        contentInset={Platform.OS === 'ios' ? { bottom: insets.bottom + 32 } : { bottom: 0 }}
        scrollIndicatorInsets={Platform.OS === 'ios' ? { bottom: insets.bottom + 32 } : { bottom: 0 }}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined as any}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Sections */}
        {profileSections.map((section, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, itemIndex) => (
                                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.sectionItem,
                      itemIndex === section.items.length - 1 && styles.lastSectionItem
                    ]}
                    onPress={() => {
                      if (item.onPress) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        item.onPress();
                      }
                    }}
                    disabled={!item.onPress}
                    activeOpacity={0.7}
                  >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons name={item.icon as any} size={22} color="#6B46C1" />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    {item.rightElement || (
                     ( item as any).chevron && (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      )
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Account Settings - Nested Menu */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.sectionItems}>
            <TouchableOpacity 
              style={styles.accountSettingsButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/account-management' as any);
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#6B7280" />
              <Text style={styles.accountSettingsText}>Account Management</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Logout Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionItems}>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* Legal Links Footer (inside scrollview) */}
        <View style={styles.legalLinksFooter}>
          <View style={styles.legalLinksContainer}>
            <TouchableOpacity onPress={() => setShowTerms(true)}>
              <Text style={styles.legalLinkText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}> • </Text>
            <TouchableOpacity onPress={() => setShowPrivacy(true)}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Small bottom spacer for comfortable tapping; larger on iOS */}
        <View style={{ height: Platform.OS === 'ios' ? 24 : 8 }} />
      </ScrollView>
      
      {/* Alert Component */}
      <AlertComponent />
      <UpdateAlertComponent />
      <PrivacyPolicyModal
        visible={showPrivacy}
        onAccept={() => setShowPrivacy(false)}
        onDecline={() => setShowPrivacy(false)}
      />
      <TermsModal
        visible={showTerms}
        onAccept={() => setShowTerms(false)}
        onDecline={() => setShowTerms(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: -75,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  editProfileButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
    letterSpacing: 1,
  },
  brandSubtext: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSectionItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  setupButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
  legalLinksFooter: {
    marginTop: 25,
    
  },
  legalFixedFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  legalLinkText: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  deletionWarningBanner: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  warningIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 12,
    lineHeight: 18,
  },
  cancelDeletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  cancelDeletionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  
  // New styles for improved UI
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  editNameButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
  },
  accountSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  accountSettingsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
}); 