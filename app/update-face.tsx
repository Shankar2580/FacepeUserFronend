import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../src/components/ui/AlertModal';
import { AppText as Text } from '../src/components/ui/AppText';
import { FaceRegistrationInstructionModal } from '../src/components/ui/FaceRegistrationInstructionModal';
import { FaceSuccessModal } from '../src/components/ui/FaceSuccessModal';
import { PinVerificationModal } from '../src/components/ui/PinVerificationModal';
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
  const isCameraReady = permission?.granted === true;
  const canRequestCameraPermission = permission?.canAskAgain !== false;

  // Simulate continuous face detection
  React.useEffect(() => {
    let faceDetectionTimer: ReturnType<typeof setTimeout>;
    let faceDetectionInterval: ReturnType<typeof setInterval>;
    
    if (isUpdating) {
      faceDetectionTimer = setTimeout(() => {
        setIsDetecting(true);
        faceDetectionInterval = setInterval(() => {
          const faceDetected = Math.random() > 0.3;
          setHasFace(faceDetected);
        }, 200);
      }, 2000);
    } else {
      setIsDetecting(false);
      setHasFace(false);
    }

    return () => {
      if (faceDetectionTimer) clearTimeout(faceDetectionTimer);
      if (faceDetectionInterval) clearInterval(faceDetectionInterval);
    };
  }, [isUpdating]);

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    setFaces(faces);
    setHasFace(faces.length > 0);
    setIsDetecting(faces.length > 0);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!isUpdating) return;
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [isUpdating, permission, requestPermission]);

  const loadUserData = async () => {
    try {
      const user = await apiService.getStoredUser();
      if (user) {
        setUserId(user.id);
        setUserName(`${user.first_name} ${user.last_name}`);
      }
    } catch (error) {
      // Handle silently
    }
  };

  const handleStartUpdate = async () => {
    setShowInstructionModal(false);
    setTimeout(() => {
      setShowPinModal(true);
    }, 100);
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setTimeout(() => {
      setShowInstructionModal(true);
    }, 100);
  };

  const handlePinSuccess = () => {
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

    const storedPin = await AsyncStorage.getItem('verified_pin');
    
    if (!storedPin || storedPin.length !== 4) {
      showAlert('Error', 'PIN verification required', undefined, 'warning');
      return;
    }

    setShowProcessingAnimation(true);
    setIsLoading(true);
    try {
      const faceApiResponse = await apiService.updateFace(userId, userName.trim(), imageUri, storedPin);
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      
      if (!embeddingId) {
        throw new Error('Face update failed - no embedding ID returned');
      }
      
      await apiService.updateUserFaceStatus(true);
      await refreshUser();
      await apiService.getStoredUser();
      
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
      setIsUpdating(false);
      showAlert('Update Failed', errorMessage, [
        {
          text: 'Try Again',
          onPress: () => {
            setIsUpdating(true);
          }
        },
      ], 'warning');
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const takeSquarePicture = async () => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: Platform.OS === 'ios',
        quality: 0.8,
      });

      const photoWidth = photo.width ?? 0;
      const photoHeight = photo.height ?? 0;

      if (!photoWidth || !photoHeight) {
        throw new Error('Unable to determine captured image dimensions.');
      }

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
      {isUpdating ? (
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
                setIsUpdating(false);
                router.replace('/(tabs)/profile');
              }}
            >
              <Ionicons name="close" size={scale(24, 20, 28)} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>Update Face</Text>
            </View>
            <View style={styles.cameraHeaderRight} />
          </LinearGradient>

          {/* Camera Preview with White Padding */}
          <View style={styles.cameraContainer}>
            {/* Blue Box Container - Uses flex centering for equal spacing */}
            <View style={styles.blueBoxContainer}>
              {/* Circle Container with Camera - Centered in blue box */}
              <View style={styles.circleWrapper}>
                {!permission ? (
                  <View style={[styles.cameraViewCircle, styles.permissionPromptContainer, {
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2,
                  }]}>
                    <Text style={styles.permissionTitle}>Checking camera access…</Text>
                  </View>
                ) : isCameraReady ? (
                  <CameraView
                    ref={cameraRef}
                    style={[styles.cameraViewCircle, { 
                      width: CIRCLE_SIZE, 
                      height: CIRCLE_SIZE,
                      borderRadius: CIRCLE_SIZE / 2,
                    }]}
                    facing="front"
                  />
                ) : (
                  <View style={[styles.cameraViewCircle, styles.permissionPromptContainer, {
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2,
                  }]}>
                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionDescription}>
                      Allow FacePe to use your camera so we can update your face data securely.
                    </Text>
                    <TouchableOpacity
                      style={styles.permissionButton}
                      onPress={() => {
                        if (canRequestCameraPermission) {
                          requestPermission();
                        } else {
                          Linking.openSettings();
                        }
                      }}
                    >
                      <Text style={styles.permissionButtonText}>
                        {canRequestCameraPermission ? 'Grant Permission' : 'Open Settings'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Circle Frame Border */}
                <View style={[styles.circleFrameBorder, { 
                  width: CIRCLE_SIZE, 
                  height: CIRCLE_SIZE, 
                  borderRadius: CIRCLE_SIZE / 2,
                }]} pointerEvents="none" />
              </View>
            </View>
          </View>

          {/* Take Photo Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.takePhotoButton,
                { opacity: isLoading || !isCameraReady ? 0.5 : 1 },
              ]}
              disabled={isLoading || !isCameraReady}
              onPress={async () => {
                if (!isCameraReady) {
                  showAlert(
                    'Camera Permission Required',
                    'Please allow camera access to capture your face.',
                    [
                      canRequestCameraPermission
                        ? {
                            text: 'Grant Permission',
                            onPress: () => requestPermission(),
                          }
                        : {
                            text: 'Open Settings',
                            onPress: () => Linking.openSettings(),
                          },
                      { text: 'Cancel', style: 'cancel' },
                    ],
                    'warning'
                  );
                  return;
                }

                setIsLoading(true);
                try {
                  const squareImageUri = await takeSquarePicture();
                  if (squareImageUri) {
                    await handleFaceUpdate(squareImageUri);
                    setIsUpdating(false);
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
                  {isLoading ? 'Processing...' : 'Update Face'} 
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Face Update Instruction Modal */}
      <FaceRegistrationInstructionModal
        visible={showInstructionModal}
        onClose={() => {
          setShowInstructionModal(false);
          router.replace('/(tabs)/profile');
        }}
        onComplete={handleStartUpdate}
        title="Face Update Guide"
      />

      {/* Face Update Success Modal */}
      <FaceSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/profile');
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
        onClose={handlePinCancel}
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
    minWidth: 44,
    minHeight: 44,
  },
  cameraHeaderContent: {
    flex: 1,
  },
  cameraHeaderTitle: {
    fontSize: fontScale(20, 18, 24),
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
  permissionPromptContainer: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    gap: scale(12),
  },
  permissionTitle: {
    fontSize: fontScale(18, 16, 20),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: fontScale(14, 12, 16),
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: scale(4),
    paddingVertical: scale(10),
    paddingHorizontal: scale(24),
    borderRadius: 24,
    backgroundColor: '#6B46C1',
    minHeight: 44,
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(14, 12, 16),
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  circleFrameBorder: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
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
    minHeight: 48,
  },
  takePhotoButtonGradient: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    borderRadius: scale(16),
  },
  takePhotoButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(18, 16, 20),
    fontWeight: 'bold',
  },
});
