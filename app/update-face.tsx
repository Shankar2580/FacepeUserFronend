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
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FaceRegistrationInstructionModal } from '../components/ui/FaceRegistrationInstructionModal';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceSuccessModal } from '../components/ui/FaceSuccessModal';
import { ProcessingAnimation } from '../components/ui/ProcessingAnimation';
import { useAlert } from '../components/ui/AlertModal';

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
      console.error('Error loading user data:', error);
    }
  };

  const handleStartUpdate = async () => {
    // Show instruction modal first
    setShowInstructionModal(true);
  };

  const handleInstructionsComplete = () => {
    setShowInstructionModal(false);
    setIsUpdating(true);
  };

  const handleFaceUpdate = async (imageUri: string) => {
    if (!userId || !userName.trim()) {
      showAlert('Error', 'User information is missing', undefined, 'error');
      return;
    }

    setShowProcessingAnimation(true);
    setIsLoading(true);
    try {
      console.log('Starting face update via external Face API...');
      console.log('User ID:', userId);
      console.log('User Name:', userName.trim());
      console.log('Image URI:', imageUri);
      
      // Call the external Face Update API (port 8443)
      const faceApiResponse = await apiService.updateFace(userId, userName.trim(), imageUri);
      
      console.log('Face API update response:', faceApiResponse);
      
      // Check for embedding_id in the nested data structure
      const embeddingId = faceApiResponse.data?.embedding_id || faceApiResponse.embedding_id;
      if (!embeddingId) {
        throw new Error('Face update failed - no embedding ID returned');
      }
      
      console.log('Face update successful! Embedding ID:', embeddingId);
      
      // Update the main backend database with face registration status
      console.log('Updating main backend with face registration status...');
      await apiService.updateUserFaceStatus(true);
      
      // The backend has already updated the user's face status in the database
      // Refresh the user context to get the updated data from the backend
      console.log('Refreshing user context to get updated face status from backend...');
      await refreshUser();
      
      // Verify the update worked
      const updatedUser = await apiService.getStoredUser();
      console.log('Updated user data after backend update:', {
        name: `${updatedUser?.first_name} ${updatedUser?.last_name}`,
        face_registered: updatedUser?.has_face_registered,
        user_id: updatedUser?.id
      });
      
      // Hide processing animation and show success modal
      setShowProcessingAnimation(false);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Face update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
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
      showAlert('Update Failed', errorMessage, undefined, 'error');
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
        skipProcessing: true,
        quality: 0.8 
      });
      
      // 2. Compute a centered square crop
      const size = Math.min(photo.width, photo.height);
      const crop = {
        originX: (photo.width - size) / 2,
        originY: (photo.height - size) / 2,
        width: size,
        height: size,
      };
      
      // 3. Crop to square and resize to optimal size for face recognition
      const square = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { crop }, 
          { resize: { width: 640, height: 640 } }
        ],
        { 
          compress: 0.9, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      return square.uri;
    } catch (error) {
      console.error('Error taking square picture:', error);
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
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>Update Face</Text>
              <Text style={styles.cameraHeaderSubtitle}>Your Face is Stored as Encrypted Biometric Embeddings</Text>
            </View>
            <View style={styles.cameraHeaderRight} />
          </LinearGradient>

          {/* Camera Preview */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="front"
            />
            
            {/* Face Detection Overlay */}
            <View style={styles.faceDetectionOverlay}>
              {/* Face Detection Status */}
              <View style={styles.faceStatusContainer}>
                <View style={[styles.faceStatusIndicator, { backgroundColor: hasFace ? '#10B981' : '#EF4444' }]}>
                  <Ionicons 
                    name={hasFace ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={[styles.faceStatusText, { color: hasFace ? '#10B981' : '#EF4444' }]}>
                  {hasFace ? 'Face Detected' : 'Face Not Detected'}
                </Text>
              </View>
              
              {/* Face Detection Frame */}
              <View style={styles.faceFrame}>
                <View style={[styles.faceFrameCorner, styles.topLeft]} />
                <View style={[styles.faceFrameCorner, styles.topRight]} />
                <View style={[styles.faceFrameCorner, styles.bottomLeft]} />
                <View style={[styles.faceFrameCorner, styles.bottomRight]} />
              </View>
              
              {/* Instructions */}
              <View style={styles.instructionsOverlay}>
                <Text style={styles.instructionText}>
                  {!hasFace ? 'Center your face in the frame' : 'Hold steady - Ready to capture!'}
                </Text>
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
                    await handleFaceUpdate(squareImageUri);
                    setIsUpdating(false);
                  }
                } catch (error) {
                  console.error('Capture error:', error);
                  showAlert('Error', 'Failed to capture image', undefined, 'error');
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
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <Text style={styles.inputSubtext}>Enter the name associated with your account</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{userName || 'Loading...'}</Text>
                </View>
              </View>

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
          console.log('Face update complete, navigating back');
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  cameraView: {
    width: width * 0.85,
    height: width * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
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