import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useUpdates } from '../../hooks/useUpdates';
import { apiService } from '../../services/api';
import { AutoPay, PaymentMethod } from '../../constants/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const { user, logout, refreshUser } = useAuth();
  const { isCheckingForUpdates, checkForUpdates, currentUpdateInfo } = useUpdates();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('Profile: User state changed:', {
      hasUser: !!user,
      userName: user ? `${user.first_name} ${user.last_name}` : 'None',
      userEmail: user?.email,
      hasFaceRegistered: user?.has_face_registered,
      isActive: user?.is_active
    });
    
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
      console.log('Profile: Loading data...');
      const [autoPayData, paymentMethodsData] = await Promise.all([
        apiService.getAutoPay(),
        apiService.getPaymentMethods()
      ]);
      
      setAutoPay(autoPayData || []);
      setPaymentMethods(paymentMethodsData || []);
      console.log('Profile: Data loaded successfully', {
        autopay: autoPayData?.length || 0,
        paymentMethods: paymentMethodsData?.length || 0
      });
    } catch (error) {
      console.error('Failed to load profile data:', error);
      // Don't clear existing data on error - keep what we have
    } finally {
      setInitialLoad(false);
    }
  };

  const onRefresh = async () => {
    console.log('Profile: Starting refresh...');
    setRefreshing(true);
    try {
      await Promise.all([loadData(), refreshUser()]);
      console.log('Profile: Refresh completed successfully');
    } catch (error) {
      console.error('Profile: Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    Alert.alert(
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
              Alert.alert('Success', `Account ${isAccountActive ? 'deactivated' : 'activated'} successfully`);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to update account status');
            }
          },
        },
      ]
    );
  };

  const handleFaceRegistration = () => {
    router.push('/face-registration');
  };

  const handleCheckForUpdates = async () => {
    await checkForUpdates();
  };

  const handleLogout = () => {
    Alert.alert(
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
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account Settings',
      items: [
        {
          icon: 'person-outline',
          title: 'Edit Profile',
          subtitle: 'Update personal information',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
        {
          icon: 'key-outline',
          title: 'Change Password',
          subtitle: 'Update security credentials',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
      ],
    },
    {
      title: 'Payment & Security',
      items: [
        {
          icon: 'scan',
          title: 'Facial Data Re-enrollment',
          subtitle: 'Update biometric data',
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
        {
          icon: 'card-outline',
          title: 'Manage Saved Cards',
          subtitle: 'Payment methods & billing',
          action: 'navigate',
          onPress: () => router.push('/(tabs)/cards'),
          chevron: true,
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Security Settings',
          subtitle: 'Privacy & authentication',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
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
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get assistance',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientHeader: {
    height: 120,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: -30,
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