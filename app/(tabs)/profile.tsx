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
  View
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
      loadData();
      startAnimations();
    }
  }, [user]);

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
    if (user?.has_face_registered) {
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
              
              showAlert('Success', 'Face data deleted successfully', undefined, 'success');
              
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
      'warning'
    );
  };

  const profileSections = [
    {
      title: 'Payment & Security',
      items: [
        {
          icon: 'scan',
          title: user?.has_face_registered ? 'Update Face Data' : 'Register Your Face',
          subtitle: user?.has_face_registered ? 'Update your biometric data' : 'Setup biometric authentication',
          action: 'setup',
          onPress: handleFaceRegistration,
          rightElement: user?.has_face_registered ? (
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
        ...(user?.has_face_registered ? [{
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
          {/* Removed the Profile header text */}
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
        
        <Text style={styles.userName}>
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : 'User'
          }
        </Text>
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
        {/* Legal Links Footer (outside logout button) */}
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
    height: 100,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
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
}); 