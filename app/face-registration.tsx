import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { AppText as Text } from '../src/components/ui/AppText';
import { FaceRegistrationInstructionModal } from '../src/components/ui/FaceRegistrationInstructionModal';
import { FaceSuccessModal } from '../src/components/ui/FaceSuccessModal';
import { ProcessingAnimation } from '../src/components/ui/ProcessingAnimation';
import { useAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';
import { getFaceError, isNetworkError } from '../src/utils/errorHandler';
import { fontScale, hp, scale, wp } from '../src/utils/responsive';

// Circle size: 65% of screen width for consistent look on all devices
// This leaves ~17.5% padding on each side within the blue box
const CIRCLE_SIZE = wp(65);
// Blue box padding around the circle (percentage-based)
const BLUE_PADDING = wp(8);

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
      // Call the external Face Registration API (port 8443)
      const faceApiResponse = await apiService.registerFace(userId, userName.trim(), imageUri);
      
      // Check for embedding_id in the nested data structure
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      if (!embeddingId) {
        throw new Error('Face registration failed - no embedding ID returned');
      }
      
      // Update the main backend database with face registration status
      await apiService.updateUserFaceStatus(true);
      
      // Refresh the user context to get the updated data from the backend
      await refreshUser();
      
      // Verify the update worked
      const updatedUser = await apiService.getStoredUser();
      
      // Hide processing animation and show success modal
      setShowProcessingAnimation(false);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      // Use centralized error handler for clean, user-friendly messages
      let errorMessage: string;
      
      if (isNetworkError(error)) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        errorMessage = getFaceError(error);
      }
      
      setShowProcessingAnimation(false);
      setIsRegistering(false);
      showAlert('Registration Failed', errorMessage, [
        {
          text: 'Try Again',
          onPress: () => {
            setIsRegistering(true);
          }
        },
      ], 'warning');
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(24) }}>
          <Text style={{ color: '#1F2937', fontSize: fontScale(18), textAlign: 'center', marginBottom: scale(20) }}>
            Camera permission is required for face registration.
          </Text>
          <TouchableOpacity onPress={requestPermission}>
            <LinearGradient colors={['#6B46C1', '#6B46C1']} style={{ paddingVertical: scale(16), paddingHorizontal: scale(40), borderRadius: 30 }}>
              <Text style={{ color: '#FFFFFF', fontSize: fontScale(16), fontWeight: 'bold' }}>Grant Permission</Text>
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
      throw error;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Removed initial explanation screen - instruction modal shows first */}
      {isRegistering ? (
        <View style={[styles.fullScreenContainer, { paddingBottom: insets.bottom + scale(20) }]}>
          {/* Header with gradient background */}
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6', '#06B6D4']}
            style={styles.cameraHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity 
              style={styles.cameraBackButton}
              onPress={() => {
                setIsRegistering(false);
                router.replace('/(tabs)');
              }}
            >
              <Ionicons name="close" size={scale(24, 20, 28)} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>Face Registration</Text>
            </View>
            <View style={styles.cameraHeaderRight} />
          </LinearGradient>

          {/* Camera Preview with White Padding */}
          <View style={styles.cameraContainer}>
            {/* Blue Box Container - Uses flex centering for equal spacing */}
            <View style={styles.blueBoxContainer}>
              {/* Circle Container with Camera - Centered in blue box */}
              <View style={styles.circleWrapper}>
                {/* Camera View - Circular */}
                <CameraView
                  ref={cameraRef}
                  style={[styles.cameraViewCircle, { 
                    width: CIRCLE_SIZE, 
                    height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2,
                  }]}
                  facing="front"
                />
                
                {/* Circle Frame Border */}
                <View style={[styles.circleFrameBorder, { 
                  width: CIRCLE_SIZE, 
                  height: CIRCLE_SIZE, 
                  borderRadius: CIRCLE_SIZE / 2,
                }]} />
              </View>
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
          router.replace('/(tabs)');
        }}
        onComplete={handleStartRegistration}
        title="Face Registration"
      />

      {/* Face Registration Success Modal */}
      <FaceSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)');
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
    width: wp(90),
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pinModalHeader: {
    alignItems: 'center',
    marginBottom: scale(24),
  },
  pinModalTitle: {
    fontSize: fontScale(22),
    fontWeight: '700',
    color: '#1F2937',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  pinModalSubtitle: {
    fontSize: fontScale(16),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  pinInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  pinInput: {
    width: '80%',
    height: scale(60),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 16,
  },
  pinModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: scale(12),
  },
  pinCancelButton: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: scale(16),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  pinCancelButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
  },
  pinConfirmButton: {
    flex: 2,
    borderRadius: scale(16),
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
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  pinConfirmButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(24),
    paddingBottom: scale(32),
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
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
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
    marginRight: scale(16),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontScale(24, 20, 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: fontScale(16),
    color: '#FFFFFF',
    marginTop: scale(4),
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: scale(24),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(32),
  },
  iconCircle: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontScale(28),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  subtitle: {
    fontSize: fontScale(16),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: scale(32),
  },
  descriptionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: scale(32),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(8),
  },
  description: {
    fontSize: fontScale(15),
    color: '#6B7280',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: scale(32),
  },
  inputLabel: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(4),
  },
  inputSubtext: {
    fontSize: fontScale(14),
    color: '#6B7280',
    marginBottom: scale(12),
  },
  readOnlyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: scale(12),
  },
  readOnlyText: {
    fontSize: fontScale(16),
    color: '#374151',
    fontWeight: '500',
  },
  benefitsContainer: {
    marginBottom: scale(40),
  },
  benefitsTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(20),
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(16),
  },
  benefitTextContainer: {
    marginLeft: scale(12),
    flex: 1,
  },
  benefitTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: scale(4),
  },
  benefitText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: scale(24),
    paddingTop: scale(20),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    borderRadius: scale(16),
    marginBottom: scale(16),
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  primaryButtonGradient: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    borderRadius: scale(16),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: scale(12),
  },
  primaryButtonText: {
    fontSize: fontScale(18),
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
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    paddingBottom: scale(16),
    minHeight: scale(80),
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: scale(24),
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
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // Minimum touch target
    minHeight: 44,
  },
  cameraHeaderContent: {
    flex: 1,
  },
  cameraHeaderTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraHeaderRight: {
    width: scale(44),
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueBoxContainer: {
    width: wp(85), // 85% of screen width
    aspectRatio: 0.75, // Height is 1.33x width (taller than wide)
    maxHeight: hp(55), // Cap at 55% of screen height
    borderRadius: scale(24),
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
    justifyContent: 'center', // Center circle vertically
    alignItems: 'center', // Center circle horizontally
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraViewCircle: {
    position: 'absolute',
    overflow: 'hidden',
  },
  buttonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
  },
  takePhotoButton: {
    borderRadius: scale(16),
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 48, // Minimum touch target
  },
  takePhotoButtonGradient: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    borderRadius: scale(16),
  },
  takePhotoButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(18),
    fontWeight: 'bold',
  },
  
  // Legacy styles (kept for compatibility)
  placeholder: {
    width: scale(40),
  },
  cameraActions: {
    position: 'absolute',
    bottom: scale(60),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: scale(20),
    zIndex: 10,
  },
  captureButton: {
    borderRadius: 12,
    marginBottom: scale(16),
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonGradient: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(40),
    alignItems: 'center',
    borderRadius: 12,
  },
  captureButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  retryButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: fontScale(16),
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  
  circleFrameBorder: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
});
