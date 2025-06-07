import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={64} color="#6B46C1" />
        </View>
        
        <Text style={styles.title}>Payment Methods</Text>
        <Text style={styles.subtitle}>
          Manage your payment methods in the Cards tab for a better experience
        </Text>
        
        <TouchableOpacity 
          style={styles.navigateButton}
          onPress={() => router.push('/(tabs)/cards')}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text style={styles.navigateButtonText}>Go to Cards</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Secure & Encrypted</Text>
              <Text style={styles.infoSubtitle}>
                Your payment information is protected with bank-level security
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={24} color="#F59E0B" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Fast Payments</Text>
              <Text style={styles.infoSubtitle}>
                Quick and seamless transactions with face recognition
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    width: '100%',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
}); 