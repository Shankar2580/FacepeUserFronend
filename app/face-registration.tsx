import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function FaceRegistrationScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Load user data from secure store
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await apiService.getStoredUser();
      if (user) {
        setUserId(user.id);
        setUserName(`${user.first_name} ${user.last_name}`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleStartRegistration = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }
    
    // Launch camera directly
    handleCameraCapture();
  };

  const handleCameraCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await handleFaceRegistration(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleFaceRegistration = async (imageUri: string) => {
    if (!userId || !userName.trim()) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting face registration via external Face API...');
      console.log('User ID:', userId);
      console.log('User Name:', userName.trim());
      console.log('Image URI:', imageUri);
      
      // Call the external Face Registration API (port 8001)
      const faceApiResponse = await apiService.registerFace(userId, userName.trim(), imageUri);
      
      console.log('Face API registration response:', faceApiResponse);
      
      if (!faceApiResponse.embedding_id) {
        throw new Error('Face registration failed - no embedding ID returned');
      }
      
      console.log('Face registration successful! Embedding ID:', faceApiResponse.embedding_id);
      
      // Update the main backend database with face registration status
      console.log('Updating main backend with face registration status...');
      await apiService.updateUserFaceStatus(true);
      
      // The backend has already updated the user's face status in the database
      // Refresh the user context to get the updated data from the backend
      console.log('Refreshing user context to get updated face status from backend...');
      await refreshUser();
      
      // Verify the update worked
      const updatedUser = await apiService.getStoredUser();
      console.log('Updated user data after backend registration:', {
        name: `${updatedUser?.first_name} ${updatedUser?.last_name}`,
        face_registered: updatedUser?.has_face_registered,
        user_id: updatedUser?.id
      });
      
      Alert.alert(
        'Success!',
        `Face registered successfully!\n\nEmbedding ID: ${faceApiResponse.embedding_id}\n\nStatus: ${updatedUser?.has_face_registered ? 'Registered' : 'Not Registered'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Face registration complete, navigating back');
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Face registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let errorMessage = 'Failed to register face';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network Error: Cannot connect to face registration server. Please check:\n\n1. Face registration API is running on port 8001\n2. Your device is connected to the same network\n3. IP address is correct (192.168.148.2)';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data format. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Face Recognition Setup</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="scan" size={48} color="#6B46C1" />
              </View>
            </View>

            <Text style={styles.title}>Face Recognition Setup</Text>
            <Text style={styles.subtitle}>
              Enable facial recognition for quick and secure payments.
            </Text>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description:</Text>
              <Text style={styles.description}>
                Register your face to verify your identity during transactions. Your biometric data is encrypted and securely stored in compliance with industry standards.
              </Text>
            </View>

            {/* Name Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Text style={styles.inputSubtext}>Enter the name associated with your account</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{userName || 'Loading...'}</Text>
              </View>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Why Use Face Recognition?</Text>
              
              <View style={styles.benefit}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Secure & Encrypted</Text>
                  <Text style={styles.benefitText}>Stored using bank-grade protection</Text>
                </View>
              </View>

              <View style={styles.benefit}>
                <Ionicons name="flash" size={24} color="#10B981" />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Faster Payments</Text>
                  <Text style={styles.benefitText}>You can enable Autopay</Text>
                </View>
              </View>

              <View style={styles.benefit}>
                <Ionicons name="lock-closed" size={24} color="#10B981" />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Trusted Technology</Text>
                  <Text style={styles.benefitText}>Built for secure transactions</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleStartRegistration}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#6B46C1', '#9333EA']}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Registering...' : 'Register Face'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.back()}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  descriptionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  inputSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  readOnlyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  benefitsContainer: {
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
}); 