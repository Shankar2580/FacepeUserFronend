import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { PaymentMethod, stripeService } from '../../services/stripeService';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';

interface PaymentMethodsScreenProps {
  authToken: string;
}

export const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({
  authToken,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPaymentMethods = async () => {
    try {
      stripeService.setAuthToken(authToken);
      const methods = await stripeService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      // Ignore unauthorized errors to avoid alarming logged-out users
      if (error?.response?.status !== 401) {
        Alert.alert('Oops', 'Unable to load your payment methods right now. Please try again later.');
      }
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              stripeService.setAuthToken(authToken);
              await stripeService.deletePaymentMethod(paymentMethodId);
              // Refresh the list
              fetchPaymentMethods();
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardBrand}>{item.brand.toUpperCase()}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardNumber}>•••• •••• •••• {item.last4}</Text>
        <Text style={styles.cardExpiry}>
          Expires {item.exp_month.toString().padStart(2, '0')}/{item.exp_year}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePaymentMethod(item.id)}
      >
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Card</Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Payment Methods</Text>
          <Text style={styles.emptySubtitle}>
            Add a payment method to get started
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyAddButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddPaymentMethodModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPaymentMethodAdded={() => {
          fetchPaymentMethods();
        }}
        authToken={authToken}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Courier',
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 