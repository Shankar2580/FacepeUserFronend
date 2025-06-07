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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
              thumbColor={isAccountActive ? '#FFFFFF' : '#F3F4F6'}
            />
          ),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone_number}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Sections */}
        {profileSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.sectionItem,
                    itemIndex === section.items.length - 1 && styles.lastSectionItem
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#6B46C1" />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    {item.rightElement || (
                      item.chevron && (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      )
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* AutoPay Section */}
        {autoPay.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AutoPay Settings</Text>
            <View style={styles.sectionItems}>
              {autoPay.map((autoPayItem, index) => (
                <View key={autoPayItem.id} style={[
                  styles.sectionItem,
                  index === autoPay.length - 1 && styles.lastSectionItem
                ]}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="flash" size={20} color="#10B981" />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{autoPayItem.merchant_name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {getCardDisplayName(autoPayItem.payment_method_id)} • {formatAmount(autoPayItem.max_amount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Switch
                      value={autoPayItem.is_enabled}
                      onValueChange={() => handleToggleAutoPay(autoPayItem)}
                      trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                      thumbColor={autoPayItem.is_enabled ? '#FFFFFF' : '#F3F4F6'}
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

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.sectionItems}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 95 : 70,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: '500',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
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
    fontWeight: '600',
  },
  autoPaySwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  deleteAutoPayButton: {
    padding: 4,
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
}); 