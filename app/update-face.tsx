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
import { PinVerificationModal } from '../src/components/ui/PinVerificationModal';

const { width, height } = Dimensions.get('window');

export default function UpdateFaceScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [faces, setFaces] = useState<any[]>([]);
  const [hasFace, setHasFace] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
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
    // This is now called from instruction modal's "Start Face Registration" button
    // Show PIN modal first
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    // After PIN is verified, close modals and go to camera
    setShowPinModal(false);
    setShowInstructionModal(false);
    setIsUpdating(true);
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

    // Verify PIN was confirmed (for user security)
    // Backend uses JWT token for authentication, not PIN
    const storedPin = await AsyncStorage.getItem('verified_pin');
    
    if (!storedPin || storedPin.length !== 4) {
      showAlert('Error', 'PIN verification required', undefined, 'warning');
      return;
    }

    setShowProcessingAnimation(true);
    setIsLoading(true);
    try {
      // Call the external Face Update API
      // Backend requires both JWT token AND PIN for security
      const faceApiResponse = await apiService.updateFace(userId, userName.trim(), imageUri, storedPin);
      
      // Check for embedding_id in the nested data structure
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      
      if (!embeddingId) {
        throw new Error('Face update failed - no embedding ID returned');
      }
      
      // Update the main backend database with face registration status
      await apiService.updateUserFaceStatus(true);
      
      // The backend has already updated the user's face status in the database
      // Refresh the user context to get the updated data from the backend
      await refreshUser();
      
      // Verify the update worked
      await apiService.getStoredUser();
      
      // Hide processing animation and show success modal
      setShowProcessingAnimation(false);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      let errorMessage = 'Failed to update face';
      
      // Extract error message properly
      const getErrorMessage = (err: any): string => {
        // If error.message is an object, try to stringify it
        if (err.message && typeof err.message === 'object') {
          return JSON.stringify(err.message);
        }
        // If error.message is a string, return it
        if (err.message && typeof err.message === 'string') {
          return err.message;
        }
        // Fallback
        return 'Unknown error';
      };
      
      const rawErrorMessage = getErrorMessage(error);
      
      if (error.code === 'NETWORK_ERROR' || (rawErrorMessage && rawErrorMessage.includes('Network Error'))) {
        errorMessage = 'Network Error: Cannot connect to face update server. Please check your network connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = `Authentication Failed: ${error.response?.data?.detail || error.response?.data?.message || 'Please try again'}`;
      } else if (error.response?.status === 422) {
        errorMessage = `Invalid data: ${error.response?.data?.detail || error.response?.data?.message || 'Please try again.'}`;
      } else if (error.response?.status === 423) {
        errorMessage = 'Your account is temporarily locked. Please try again later.';
      } else if (error.response?.status) {
        // Has response status but not handled above
        errorMessage = `Server error (${error.response.status}): ${error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || rawErrorMessage}`;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else {
        errorMessage = rawErrorMessage || 'An unexpected error occurred. Please try again.';
      }
      
      setShowProcessingAnimation(false);
      showAlert('Update Failed', errorMessage, undefined, 'warning');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

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
      ) : null}

      {/* Face Update Instruction Modal - Now shows as first screen with PIN requirement */}
      <FaceRegistrationInstructionModal
        visible={showInstructionModal}
        onClose={() => {
          setShowInstructionModal(false);
          router.back();
        }}
        onComplete={handleStartUpdate}
        title="Update Face"
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
      <PinVerificationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Verify Your PIN"
        subtitle="Verify your identity to proceed with face update"
      />

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
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
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
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
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
}); 
