import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/contexts/AuthContext';
import DeviceLockService from '../src/services/DeviceLockService';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appLockEnabled, securityInfo, toggleAppLock, checkAppLockStatus } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [localAppLockEnabled, setLocalAppLockEnabled] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  useEffect(() => {
    setLocalAppLockEnabled(appLockEnabled);
  }, [appLockEnabled]);

  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      await checkAppLockStatus();
      const info = await DeviceLockService.getSecurityInfo();
      setBiometricInfo(info);
    } catch (error) {
      console.error('Error loading security settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAppLock = async (value) => {
    setIsToggling(true);

    try {
      if (value && biometricInfo && !biometricInfo.hasDeviceLock) {
        Alert.alert(
          'Device Lock Required',
          'Please set up a PIN, pattern, or password on your device before enabling app lock.',
          [{ text: 'OK' }]
        );
        setIsToggling(false);
        return;
      }

      const result = await toggleAppLock(value);
      
      if (result.success) {
        setLocalAppLockEnabled(value);
        Alert.alert(
          'Success',
          value 
            ? 'App lock has been enabled. You will need to authenticate when opening the app.' 
            : 'App lock has been disabled.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update app lock setting');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsToggling(false);
    }
  };

  const getBiometricIconName = () => {
    if (!biometricInfo) return 'finger-print';
    
    if (biometricInfo.biometricTypes.includes('Face ID')) {
      return 'scan';
    } else if (biometricInfo.biometricTypes.includes('Fingerprint')) {
      return 'finger-print';
    }
    return 'lock-closed';
  };

  const getBiometricLabel = () => {
    if (!biometricInfo || biometricInfo.biometricTypes.length === 0) {
      return 'Device Lock';
    }
    return biometricInfo.biometricTypes.join(' & ');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Security Settings</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Security Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>Manage app security and authentication</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Security Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name="shield-checkmark"
              size={48}
              color="#10B981"
            />
          </View>
          <Text style={styles.statusTitle}>
            App Lock Always Enabled
          </Text>
          <Text style={styles.statusDescription}>
            Your app is always protected with device authentication for maximum security
          </Text>
        </View>

        {/* App Lock Setting - Info Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUTHENTICATION</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="lock-closed" size={24} color="#6B46C1" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>App Lock</Text>
                  <Text style={styles.settingDescription}>
                    Authentication is required every time you open the app
                  </Text>
                </View>
              </View>
              <View style={styles.alwaysOnBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.alwaysOnText}>Always ON</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Biometric Info Section */}
        {biometricInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVICE SECURITY</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name={getBiometricIconName()} size={24} color="#6B46C1" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Available Authentication</Text>
                  <Text style={styles.infoValue}>{getBiometricLabel()}</Text>
                </View>
                <Ionicons
                  name={biometricInfo.biometricAvailable ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={biometricInfo.biometricAvailable ? '#10B981' : '#EF4444'}
                />
              </View>

              {!biometricInfo.biometricAvailable && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    No biometric authentication is set up on this device. You can still use your device PIN/pattern.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY TIPS</Text>
          
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="information-circle" size={20} color="#6B46C1" />
              <Text style={styles.tipText}>
                App lock uses your device's built-in security features
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="information-circle" size={20} color="#6B46C1" />
              <Text style={styles.tipText}>
                Your biometric data never leaves your device
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="information-circle" size={20} color="#6B46C1" />
              <Text style={styles.tipText}>
                You can always use your device PIN as a fallback
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  alwaysOnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  alwaysOnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});
