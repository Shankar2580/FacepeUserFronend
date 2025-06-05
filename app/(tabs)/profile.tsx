import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { AutoPay, PaymentMethod } from '../../constants/types';

export default function ProfileScreen() {
  const [autoPay, setAutoPay] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState(true);
  
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setIsAccountActive(user.is_active);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [autoPayData, paymentMethodsData] = await Promise.all([
        apiService.getAutoPay(),
        apiService.getPaymentMethods()
      ]);
      
      setAutoPay(autoPayData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
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
              await apiService.toggleAccountStatus();
              setIsAccountActive(!isAccountActive);
              await refreshUser();
              Alert.alert('Success', `Account ${isAccountActive ? 'deactivated' : 'activated'} successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update account status');
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoPay = async (autoPayItem: AutoPay) => {
    try {
      await apiService.updateAutoPay(autoPayItem.id, {
        is_enabled: !autoPayItem.is_enabled
      });
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update AutoPay');
    }
  };

  const handleDeleteAutoPay = async (autoPayItem: AutoPay) => {
    Alert.alert(
      'Remove AutoPay',
      `Remove automatic payments for ${autoPayItem.merchant_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAutoPay(autoPayItem.id);
              await loadData();
              Alert.alert('Success', 'AutoPay removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove AutoPay');
            }
          },
        },
      ]
    );
  };

  const handleFaceRegistration = () => {
    router.push('/face-registration');
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

  const getCardDisplayName = (paymentMethodId: string) => {
    const card = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (!card) return 'Unknown Card';
    return `${card.card_brand.toUpperCase()} •••• ${card.card_last_four}`;
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return 'No limit';
    return `$${amount.toFixed(2)} max`;
  };

  const profileSections = [
    {
      title: 'Security',
      items: [
        {
          icon: 'scan',
          title: 'Face Recognition',
          subtitle: user?.has_face_registered ? 'Registered' : 'Not registered',
          action: 'setup',
          onPress: user?.has_face_registered ? undefined : handleFaceRegistration,
          rightElement: user?.has_face_registered ? (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.statusText}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.setupButton} onPress={handleFaceRegistration}>
              <Text style={styles.setupButtonText}>Setup</Text>
            </TouchableOpacity>
          ),
        },
        {
          icon: 'shield-checkmark',
          title: 'Account Security',
          subtitle: 'Change password & security settings',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
      ],
    },
    {
      title: 'Payment Settings',
      items: [
        {
          icon: 'card',
          title: 'Payment Methods',
          subtitle: `${paymentMethods.length} card${paymentMethods.length !== 1 ? 's' : ''} added`,
          action: 'navigate',
          onPress: () => router.push('/(tabs)/cards'),
          chevron: true,
        },
        {
          icon: 'power',
          title: 'Payment Status',
          subtitle: isAccountActive ? 'Active - All payments enabled' : 'Inactive - Payments disabled',
          onPress: undefined,
          rightElement: (
            <Switch
              value={isAccountActive}
              onValueChange={handleToggleAccountStatus}
              trackColor={{ false: '#E5E7EB', true: '#6B46C1' }}
              thumbColor={isAccountActive ? '#FFFFFF' : '#FFFFFF'}
            />
          ),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person',
          title: 'Personal Information',
          subtitle: 'Update your profile details',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
        {
          icon: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
        {
          icon: 'help-circle',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          action: 'navigate',
          chevron: true,
          onPress: undefined,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userPhone}>{user?.phone_number}</Text>
          {!user?.is_active && (
            <View style={styles.inactiveWarning}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.inactiveWarningText}>Account Inactive</Text>
            </View>
          )}
        </View>

        {/* AutoPay Management */}
        {autoPay.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AutoPay Management</Text>
              <Text style={styles.sectionSubtitle}>
                {autoPay.filter(ap => ap.is_enabled).length} active
              </Text>
            </View>
            
            <View style={styles.autoPayList}>
              {autoPay.map((autoPayItem) => (
                <View key={autoPayItem.id} style={styles.autoPayItem}>
                  <View style={styles.autoPayInfo}>
                    <View style={styles.autoPayIcon}>
                      <Ionicons name="flash" size={20} color="#6B46C1" />
                    </View>
                    <View style={styles.autoPayDetails}>
                      <Text style={styles.autoPayMerchant}>
                        {autoPayItem.merchant_name}
                      </Text>
                      <Text style={styles.autoPayCard}>
                        {getCardDisplayName(autoPayItem.payment_method_id)}
                      </Text>
                      <Text style={styles.autoPayLimit}>
                        {formatAmount(autoPayItem.max_amount)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.autoPayActions}>
                    <Switch
                      value={autoPayItem.is_enabled}
                      onValueChange={() => handleToggleAutoPay(autoPayItem)}
                      trackColor={{ false: '#E5E7EB', true: '#6B46C1' }}
                      thumbColor="#FFFFFF"
                      style={styles.autoPaySwitch}
                    />
                    <TouchableOpacity
                      style={styles.deleteAutoPayButton}
                      onPress={() => handleDeleteAutoPay(autoPayItem)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.profileItem,
                    itemIndex === section.items.length - 1 && styles.lastItem
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress && !item.chevron}
                >
                  <View style={styles.profileItemLeft}>
                    <View style={styles.profileItemIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#6B46C1" />
                    </View>
                    <View style={styles.profileItemInfo}>
                      <Text style={styles.profileItemTitle}>{item.title}</Text>
                      <Text style={styles.profileItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.profileItemRight}>
                    {item.rightElement || (
                      item.chevron && (
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      )
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>PayByFaceAI v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 PayByFaceAI. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  inactiveWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  inactiveWarningText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  autoPayList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  autoPayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  autoPayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  autoPayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  autoPayDetails: {
    flex: 1,
  },
  autoPayMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  autoPayCard: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  autoPayLimit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  autoPayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoPaySwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  deleteAutoPayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  setupButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
}); 