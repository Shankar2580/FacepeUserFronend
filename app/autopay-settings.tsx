import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { AutoPay, PaymentMethod, CreateAutoPayRequest } from '../constants/types';

export default function AutoPaySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [autoPays, setAutoPays] = useState<AutoPay[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAutoPayId, setEditingAutoPayId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [autoPayData, paymentMethodData] = await Promise.all([
        apiService.getAutoPay(),
        apiService.getPaymentMethods(),
      ]);
      setAutoPays(autoPayData);
      setPaymentMethods(paymentMethodData);
    } catch (error) {
      console.error('Error loading AutoPay data:', error);
      Alert.alert('Error', 'Failed to load AutoPay settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoPay = async (autoPayId: string, isEnabled: boolean) => {
    try {
      await apiService.updateAutoPay(autoPayId, { is_enabled: isEnabled });
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error toggling AutoPay:', error);
      Alert.alert('Error', 'Failed to update AutoPay setting');
    }
  };

  const deleteAutoPay = async (autoPayId: string, merchantName: string) => {
    Alert.alert(
      'Delete AutoPay',
      `Are you sure you want to delete AutoPay for ${merchantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAutoPay(autoPayId);
              await loadData(); // Refresh data
              Alert.alert('Success', 'AutoPay setting deleted successfully');
            } catch (error) {
              console.error('Error deleting AutoPay:', error);
              Alert.alert('Error', 'Failed to delete AutoPay setting');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (autoPay: AutoPay) => {
    setEditingAutoPayId(autoPay.id);
    setEditAmount(autoPay.max_amount ? (autoPay.max_amount / 100).toString() : '');
    setShowEditModal(true);
  };

  const saveEditedAmount = async () => {
    if (!editingAutoPayId) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await apiService.updateAutoPay(editingAutoPayId, { 
        max_amount: Math.round(amount * 100) // Convert to cents
      });
      await loadData(); // Refresh data
      setShowEditModal(false);
      setEditingAutoPayId(null);
      setEditAmount('');
      Alert.alert('Success', 'AutoPay limit updated successfully');
    } catch (error) {
      console.error('Error updating AutoPay amount:', error);
      Alert.alert('Error', 'Failed to update AutoPay limit');
    }
  };

  const getPaymentMethodDisplay = (paymentMethodId: string) => {
    const pm = paymentMethods.find(p => p.id === paymentMethodId);
    return pm ? `${pm.card_brand.toUpperCase()} •••• ${pm.card_last_four}` : 'Unknown Card';
  };

  const getMerchantIcon = (merchantName: string) => {
    if (!merchantName) return '🏪';
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks')) return '☕';
    if (name.includes('amazon')) return '📦';
    if (name.includes('uber')) return '🚗';
    if (name.includes('netflix')) return '🎬';
    if (name.includes('spotify')) return '🎵';
    if (name.includes('apple')) return '🍎';
    if (name.includes('google')) return '🔍';
    if (name.includes('coffee')) return '☕';
    return '🏪';
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#6B46C1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AutoPay Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading AutoPay settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AutoPay Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="flash" size={24} color="#10B981" />
            <Text style={styles.infoTitle}>AutoPay</Text>
          </View>
          <Text style={styles.infoDescription}>
            Automatically approve payments from trusted merchants up to your set limits. You can enable, disable, or modify limits anytime.
          </Text>
        </View>

        {/* AutoPay List */}
        {autoPays.length > 0 ? (
          <View style={styles.autoPayList}>
            {autoPays.map((autoPay) => (
              <View key={autoPay.id} style={styles.autoPayItem}>
                <View style={styles.autoPayLeft}>
                  <View style={styles.merchantIcon}>
                    <Text style={styles.merchantEmoji}>
                      {getMerchantIcon(autoPay.merchant_name)}
                    </Text>
                  </View>
                  <View style={styles.autoPayInfo}>
                    <Text style={styles.merchantName}>{autoPay.merchant_name}</Text>
                    <Text style={styles.paymentMethod}>
                      {getPaymentMethodDisplay(autoPay.payment_method_id)}
                    </Text>
                    <Text style={styles.maxAmount}>
                      Max: {autoPay.max_amount ? `$${(autoPay.max_amount / 100).toFixed(2)}` : 'No limit'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.autoPayActions}>
                  <Switch
                    value={autoPay.is_enabled}
                    onValueChange={(value) => toggleAutoPay(autoPay.id, value)}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor={autoPay.is_enabled ? '#FFFFFF' : '#9CA3AF'}
                  />
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(autoPay)}
                  >
                    <Ionicons name="pencil" size={16} color="#6B46C1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteAutoPay(autoPay.id, autoPay.merchant_name)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flash-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No AutoPay Settings</Text>
            <Text style={styles.emptyDescription}>
              AutoPay will automatically approve payments from merchants you trust. Enable it from your transaction history.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Amount Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit AutoPay Limit</Text>
            <Text style={styles.modalLabel}>Maximum Amount (USD)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.modalHint}>
              Payments above this amount will require manual approval
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEditedAmount}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  autoPayList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoPayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  autoPayLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  merchantEmoji: {
    fontSize: 20,
  },
  autoPayInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  maxAmount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  autoPayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 