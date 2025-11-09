import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { FaceRegistrationInstructionModal } from '../src/components/ui/FaceRegistrationInstructionModal';
import { FaceSuccessModal } from '../src/components/ui/FaceSuccessModal';
import { ProcessingAnimation } from '../src/components/ui/ProcessingAnimation';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';

const { width, height } = Dimensions.get('window');

export default function FaceRegistrationScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [faces, setFaces] = useState<any[]>([]);
  const [hasFace, setHasFace] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  // Simulate continuous face detection
  React.useEffect(() => {
    let faceDetectionTimer: ReturnType<typeof setTimeout>;
    let faceDetectionInterval: ReturnType<typeof setInterval>;
    
    if (isRegistering) {
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
      // Reset states when not registering
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
  }, [isRegistering]);

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

  const handleStartRegistration = async () => {
    // This is now called from instruction modal's "Start Face Registration" button
    // No PIN required for registration - go directly to camera
    setShowInstructionModal(false);
    setIsRegistering(true);
  };

  const handleInstructionsComplete = () => {
    setShowInstructionModal(false);
    setIsRegistering(true);
  };

  const handleFaceRegistration = async (imageUri: string) => {
    if (!userId || !userName.trim()) {
      showAlert('Error', 'User information is missing', undefined, 'warning');
      return;
    }

    setShowProcessingAnimation(true);
    setIsLoading(true);
    try {
      // console.log removed for production
      // console.log removed for production
      // console.log removed for production);
      // console.log removed for production
      
      // Call the external Face Registration API (port 8443)
      const faceApiResponse = await apiService.registerFace(userId, userName.trim(), imageUri);
      
      // console.log removed for production
      
      // Check for embedding_id in the nested data structure
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      if (!embeddingId) {
        throw new Error('Face registration failed - no embedding ID returned');
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
      
      let errorMessage = 'Failed to register face';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network Error: Cannot connect to face registration server. Please check your network connection and try again.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data format. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setShowProcessingAnimation(false);
      showAlert('Registration Failed', errorMessage, undefined, 'warning');
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
            Camera permission is required for face registration.
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
      {/* Removed initial explanation screen - instruction modal shows first */}
      {isRegistering ? (
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
              onPress={() => setIsRegistering(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>Face Registration</Text>
            </View>
            <View style={styles.cameraHeaderRight} />
          </LinearGradient>

          {/* Camera Preview with White Padding */}
          <View style={styles.cameraContainer}>
            {/* Blue Box Container */}
            <View style={styles.blueBoxContainer}>
              {/* Top Blue Section */}
              <View style={styles.topBlueBar} />
              
              {/* Middle Row with Oval */}
              <View style={styles.middleRow}>
                {/* Left Blue Bar */}
                <View style={styles.sideBlueBar} />
                
                {/* Oval Container with Camera */}
                <View style={styles.ovalCameraContainer}>
                  {/* Camera View - Only in Oval */}
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraViewOval}
                    facing="front"
                  />
                  
                  {/* Circle Frame Border */}
                  <View style={styles.circleFrameBorder} />
                  
                  {/* Face Alignment Guides */}
                  {/* <View style={styles.guideLineHorizontal} />
                  <View style={styles.guideLineVertical} /> */}
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
                    await handleFaceRegistration(squareImageUri);
                    setIsRegistering(false);
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
                  {isLoading ? 'Capturing...' : 'Register Face'} 
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Face Registration Instruction Modal - Now shows as first screen, no PIN required */}
      <FaceRegistrationInstructionModal
        visible={showInstructionModal}
        onClose={() => {
          setShowInstructionModal(false);
          router.back();
        }}
        onComplete={handleStartRegistration}
        title="Face Registration"
      />

      {/* Face Registration Success Modal */}
      <FaceSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // console.log removed for production
          router.back();
        }}
        userName={userName}
        isUpdate={false}
      />

      {/* Processing Animation */}
      <ProcessingAnimation
        visible={showProcessingAnimation}
        type="face"
        title="Registering Face"
        subtitle="Securing your biometric data..."
      />

      {/* Alert Component */}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  pinModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  pinModalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  pinModalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pinModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  pinModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  pinInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    width: '80%',
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 16,
  },
  pinModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  pinCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  pinCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pinConfirmButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pinConfirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  pinConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
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
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
    marginTop: 12,
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
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  primaryButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Camera View Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  // cameraView: {
  //   flex: 1,
  //   width: '100%',
  //   height: '100%',
  // },
  cameraViewOval: {
    position: 'absolute',
    width: 280,
    height: 280,
    overflow: 'hidden',
    borderRadius: 140,
  },
  buttonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  
  // Legacy styles (kept for compatibility)
  placeholder: {
    width: 40,
  },
  cameraActions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  captureButton: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderRadius: 12,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  
  // Face Detection Overlay Styles (Unused - commented out)
  // faceDetectionOverlay: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
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
  // Commented unused styles
  // instructionsContainer: {
  //   backgroundColor: 'rgba(0, 0, 0, 0.8)',
  //   paddingHorizontal: 24,
  //   paddingVertical: 14,
  //   borderRadius: 20,
  //   marginHorizontal: 20,
  // },
  // guideLineHorizontal: {
  //   position: 'absolute',
  //   width: 200,
  //   height: 1,
  //   backgroundColor: 'rgba(255, 255, 255, 0.3)',
  // },
  // guideLineVertical: {
  //   position: 'absolute',
  //   width: 1,
  //   height: 260,
  //   backgroundColor: 'rgba(255, 255, 255, 0.3)',
  // },
  // instructionText: {
  //   color: '#FFFFFF',
  //   fontSize: 17,
  //   fontWeight: '600',
  //   textAlign: 'center',
  // },
  
}); 