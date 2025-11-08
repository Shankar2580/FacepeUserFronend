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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../src/services/api';
import { useAuth } from '../src/hooks/useAuth';
import { FaceRegistrationInstructionModal } from '../src/components/ui/FaceRegistrationInstructionModal';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceSuccessModal } from '../src/components/ui/FaceSuccessModal';
import { ProcessingAnimation } from '../src/components/ui/ProcessingAnimation';
import { useAlert } from '../src/components/ui/AlertModal';

const { width, height } = Dimensions.get('window');

export default function UpdateFaceScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [faces, setFaces] = useState<any[]>([]);
  const [hasFace, setHasFace] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  // Simulate continuous face detection
  React.useEffect(() => {
    let faceDetectionTimer: ReturnType<typeof setTimeout>;
    let faceDetectionInterval: ReturnType<typeof setInterval>;
    
    if (isUpdating) {
      // Start simulated face detection after 2 seconds
      faceDetectionTimer = setTimeout(() => {
        setIsDetecting(true);
        
        // Simulate continuous face detection every 1.5 seconds
        faceDetectionInterval = setInterval(() => {
          // Randomly simulate face presence/absence (70% chance of face detected)
          const faceDetected = Math.random() > 0.3;
          setHasFace(faceDetected);
        }, 200);
      }, 2000);
    } else {
      // Reset states when not updating
      setIsDetecting(false);
      setHasFace(false);
    }

    return () => {
      if (faceDetectionTimer) {
        clearTimeout(faceDetectionTimer);
      }
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }
    };
  }, [isUpdating]);

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    setFaces(faces);
    setHasFace(faces.length > 0);
    setIsDetecting(faces.length > 0);
  };

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
      // console.error removed for production
    }
  };

  const handleStartUpdate = async () => {
    // Show PIN modal first
    setShowPinModal(true);
  };

  const handlePinVerified = () => {
    // After PIN is verified, show instruction modal
    setShowPinModal(false);
    setShowInstructionModal(true);
  };

  const handleInstructionsComplete = () => {
    setShowInstructionModal(false);
    setIsUpdating(true);
  };

  const handleFaceUpdate = async (imageUri: string) => {
    if (!userId || !userName.trim()) {
      showAlert('Error', 'User information is missing', undefined, 'warning');
      return;
    }

    // Get the verified PIN from AsyncStorage
    const storedPin = await AsyncStorage.getItem('verified_pin');
    if (!storedPin || storedPin.length !== 4) {
      showAlert('Error', 'PIN verification required', undefined, 'warning');
      return;
    }

    setShowProcessingAnimation(true);
    setIsLoading(true);
    try {
      // console.log removed for production
      // console.log removed for production
      // console.log removed for production);
      // console.log removed for production
      
      // Call the external Face Update API (port 8443) with PIN
      const faceApiResponse = await apiService.updateFace(userId, userName.trim(), imageUri, storedPin);
      
      // console.log removed for production
      
      // Check for embedding_id in the nested data structure
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      if (!embeddingId) {
        throw new Error('Face update failed - no embedding ID returned');
      }
      
      // console.log removed for production
      
      // Update the main backend database with face registration status
      // console.log removed for production
      await apiService.updateUserFaceStatus(true);
      
      // The backend has already updated the user's face status in the database
      // Refresh the user context to get the updated data from the backend
      // console.log removed for production
      await refreshUser();
      
      // Verify the update worked
      const updatedUser = await apiService.getStoredUser();
      // console.log removed for production
      
      // Hide processing animation and show success modal
      setShowProcessingAnimation(false);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      // console.error removed for production
      
      let errorMessage = 'Failed to update face';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network Error: Cannot connect to face update server. Please check your network connection and try again.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data format. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setShowProcessingAnimation(false);
      showAlert('Update Failed', errorMessage, undefined, 'warning');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#1F2937', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Camera permission is required for face update.
          </Text>
          <TouchableOpacity onPress={requestPermission}>
            <LinearGradient colors={['#6B46C1', '#6B46C1']} style={{ paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takeSquarePicture = async () => {
    if (!cameraRef.current) return null;

    try {
      // 1. Capture the full-resolution photo
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: Platform.OS === 'ios',
        quality: 0.8,
      });

      const photoWidth = photo.width ?? 0;
      const photoHeight = photo.height ?? 0;

      if (!photoWidth || !photoHeight) {
        throw new Error('Unable to determine captured image dimensions.');
      }

      // 2. Compute a centered square crop and clamp to image bounds
      const targetSize = Math.min(photoWidth, photoHeight);
      const cropWidth = Math.floor(targetSize);
      const cropHeight = Math.floor(targetSize);
      const originX = Math.max(0, Math.floor((photoWidth - cropWidth) / 2));
      const originY = Math.max(0, Math.floor((photoHeight - cropHeight) / 2));
      const availableWidth = Math.max(0, photoWidth - originX);
      const availableHeight = Math.max(0, photoHeight - originY);
      const crop = {
        originX,
        originY,
        width: Math.min(cropWidth, availableWidth),
        height: Math.min(cropHeight, availableHeight),
      };

      if (crop.width <= 0 || crop.height <= 0) {
        throw new Error('Calculated crop dimensions are invalid for the captured image.');
      }

      // 3. Crop to square and resize to optimal size for face recognition
      const square = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { crop },
          { resize: { width: 640, height: 640 } },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return square.uri;
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isUpdating ? (
        <View style={[styles.fullScreenContainer, { paddingBottom: insets.bottom + 20 }]}>
          {/* Header with gradient background */}
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
            style={styles.cameraHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity 
              style={styles.cameraBackButton}
              onPress={() => setIsUpdating(false)}
            >
              <Ionicons name="close" size={24} color="#6B46C1" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>Update Face</Text>
              <Text style={styles.cameraHeaderSubtitle}>Your Face is Stored as Encrypted Biometric Embeddings</Text>
            </View>
            <View style={styles.cameraHeaderRight} />
          </LinearGradient>

          {/* Camera Preview with White Padding */}
          <View style={styles.cameraContainer}>
            {/* Blue Box Container */}
            <View style={styles.blueBoxContainer}>
              {/* Top Blue Section */}
              <View style={styles.topBlueBar} />
              
              {/* Middle Row with Circle */}
              <View style={styles.middleRow}>
                {/* Left Blue Bar */}
                <View style={styles.sideBlueBar} />
                
                {/* Circle Container with Camera */}
                <View style={styles.ovalCameraContainer}>
                  {/* Camera View - Only in Circle */}
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraViewOval}
                    facing="front"
                  />
                  
                  {/* Circle Frame Border */}
                  <View style={styles.circleFrameBorder} />
                </View>
                
                {/* Right Blue Bar */}
                <View style={styles.sideBlueBar} />
              </View>
              
              {/* Bottom Blue Section */}
              <View style={styles.bottomBlueBar} />
            </View>
          </View>

          {/* Take Photo Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.takePhotoButton, { opacity: isLoading ? 0.5 : 1 }]}
              disabled={isLoading}
              onPress={async () => {
                setIsLoading(true);
                try {
                  const squareImageUri = await takeSquarePicture();
                  if (squareImageUri) {
                    // Directly update face with captured image
                    await handleFaceUpdate(squareImageUri);
                    setIsUpdating(false);
                  }
                } catch (error) {
                  // console.error removed for production
                  showAlert('Error', 'Failed to capture image', undefined, 'warning');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <LinearGradient
                colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
                style={styles.takePhotoButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.takePhotoButtonText}>
                  {isLoading ? 'Processing...' : 'Update Face'} 
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.fullScreenContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header with gradient background */}
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#6B46C1" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Update Face</Text>
              <Text style={styles.headerSubtitle}>Update your facial recognition data</Text>
            </View>
            <View style={styles.headerRight} />
          </LinearGradient>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="refresh" size={48} color="#6B46C1" />
                </View>
              </View>

              <Text style={styles.title}>Update Face Recognition</Text>
              <Text style={styles.subtitle}>
                Update your facial recognition data for quick and secure payments.
              </Text>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description:</Text>
                <Text style={styles.description}>
                  Update your face to verify your identity during transactions. Your biometric data is encrypted and securely stored in compliance with industry standards.
                </Text>
              </View>

              {/* Name Input Field */}
              {/* <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <Text style={styles.inputSubtext}>Enter the name associated with your account</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{userName || 'Loading...'}</Text>
                </View>
              </View> */}

              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                  <Text style={styles.featureText}>Secure encrypted storage</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="flash" size={24} color="#F59E0B" />
                  <Text style={styles.featureText}>Fast authentication</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="eye-off" size={24} color="#8B5CF6" />
                  <Text style={styles.featureText}>Privacy protected</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleStartUpdate}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#6B46C1', '#8B5CF6']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Updating...' : 'Update Face'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Face Update Instruction Modal */}
      <FaceRegistrationInstructionModal
        visible={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        onComplete={handleInstructionsComplete}
      />

      {/* Face Update Success Modal */}
      <FaceSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // console.log removed for production
          router.back();
        }}
        userName={userName}
        isUpdate={true}
      />

      {/* Processing Animation */}
      <ProcessingAnimation
        visible={showProcessingAnimation}
        type="face"
        title="Updating Face"
        subtitle="Updating your biometric data..."
      />

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.pinModalContainer}
        >
          <TouchableOpacity
            style={styles.pinModalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowPinModal(false);
              setPin('');
            }}
          />
          <View style={styles.pinModalContent}>
            <View style={styles.pinModalHeader}>
              <Ionicons name="lock-closed" size={32} color="#6B46C1" />
              <Text style={styles.pinModalTitle}>Verify Your PIN</Text>
              <Text style={styles.pinModalSubtitle}>
                Verify your identity to proceed with face update
              </Text>
            </View>

            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(text) => {
                  // Only allow numbers and max 4 digits
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 4) {
                    setPin(numericText);
                  }
                }}
                placeholder="Enter PIN"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={styles.pinModalButtons}>
              <TouchableOpacity
                style={styles.pinCancelButton}
                onPress={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
              >
                <Text style={styles.pinCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pinConfirmButton,
                  { opacity: pin.length === 4 && !isVerifyingPin ? 1 : 0.5 }
                ]}
                disabled={pin.length !== 4 || isVerifyingPin}
                onPress={async () => {
                  if (pin.length === 4) {
                    setIsVerifyingPin(true);
                    try {
                      // Verify the PIN
                      const verifyResponse = await apiService.verifyCurrentPin(pin);
                      
                      if (verifyResponse.success) {
                        // Store the verified PIN in AsyncStorage
                        await AsyncStorage.setItem('verified_pin', pin);
                        
                        // Close PIN modal and show instruction modal
                        handlePinVerified();
                        setPin('');
                      }
                    } catch (error: any) {
                      // Handle PIN verification errors
                      let errorMessage = 'PIN verification failed';
                      
                      if (error.response?.status === 400) {
                        errorMessage = 'PIN not set. Please reset your PIN first.';
                      } else if (error.response?.status === 401) {
                        errorMessage = 'Invalid PIN. Please try again.';
                      } else if (error.response?.data?.detail) {
                        errorMessage = error.response.data.detail;
                      } else if (error.message) {
                        errorMessage = error.message;
                      }
                      
                      showAlert('PIN Verification Failed', errorMessage, undefined, 'warning');
                      setPin('');
                    } finally {
                      setIsVerifyingPin(false);
                    }
                  }
                }}
              >
                <LinearGradient
                  colors={['#6B46C1', '#8B5CF6']}
                  style={styles.pinConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.pinConfirmButtonText}>
                    {isVerifyingPin ? 'Verifying...' : 'Verify'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Alert Component */}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  fullScreenContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.2)',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    marginBottom: 32,
    lineHeight: 24,
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  inputSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  featuresList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Camera styles
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraHeaderContent: {
    flex: 1,
  },
  cameraHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraHeaderSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  cameraHeaderRight: {
    width: 44,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueBoxContainer: {
    width: '100%',
    flex: 1,
    maxHeight: 600,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
  },
  topBlueBar: {
    height: 70,
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBlueBar: {
    width: 40,
    height: 400,
    backgroundColor: '#3B82F6',
  },
  ovalCameraContainer: {
    width: 280,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cameraViewOval: {
    position: 'absolute',
    width: 280,
    height: 280,
    overflow: 'hidden',
    borderRadius: 140,
  },
  circleFrameBorder: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    borderRadius: 140,
  },
  bottomBlueBar: {
    height: 70,
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  takePhotoButton: {
    borderRadius: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  takePhotoButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  takePhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Face Detection Overlay Styles
  faceDetectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  faceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  faceStatusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  faceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  faceFrame: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 8,
  },

  instructionsOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // PIN Modal Styles
  pinModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pinModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pinModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pinInputContainer: {
    marginBottom: 24,
  },
  pinInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#1F2937',
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pinCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pinCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  pinConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pinConfirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pinConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 