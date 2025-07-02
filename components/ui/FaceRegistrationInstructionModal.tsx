import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface FaceRegistrationInstructionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const FaceRegistrationInstructionModal: React.FC<FaceRegistrationInstructionModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();

  // Helper function to safely require images
  const getImageSource = (imageName: string) => {
    try {
      switch(imageName) {
        case 'facerec1':
          return require('../../assets/images/facerec1.png');
        case 'facerec2':
          return require('../../assets/images/facerec2.png');
        default:
          return null;
      }
    } catch (error) {
      console.log(`Image ${imageName}.png not found in assets/images/`);
      return null;
    }
  };

  const instructions = [
    {
      id: 1,
      title: "Perfect Lighting",
      subtitle: "Get the best lighting for clear recognition",
      description: "Good lighting is essential for accurate face recognition. Follow these guidelines to ensure optimal conditions.",
      icon: "sunny",
      iconColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
      gradientColors: ["#FEF3C7", "#FDE68A"] as [string, string],
      imageSource: getImageSource('facerec1'),
      checklistItems: [
        {
          icon: "bulb-outline",
          title: "Find bright, even lighting",
          description: "Face a window or bright lamp"
        },
        {
          icon: "glasses-outline",
          title: "Remove accessories",
          description: "Take off sunglasses, hats, or masks"
        },
        {
          icon: "eye-outline",
          title: "Avoid shadows",
          description: "Make sure your face is evenly lit"
        },
        {
          icon: "checkmark-circle-outline",
          title: "Check visibility",
          description: "Ensure all facial features are clear"
        }
      ]
    },
    {
      id: 2,
      title: "Perfect Position",
      subtitle: "Position your device correctly",
      description: "Proper positioning ensures the best capture quality and accuracy for face recognition.",
      icon: "camera",
      iconColor: "#8B5CF6",
      backgroundColor: "#FFFFFF",
      gradientColors: ["#EDE9FE", "#DDD6FE"] as [string, string],
      imageSource: getImageSource('facerec2'),
      checklistItems: [
        {
          icon: "resize-outline",
          title: "Eye level positioning",
          description: "Hold device at your eye level"
        },
        {
          icon: "move-outline",
          title: "Optimal distance",
          description: "Stay 12-18 inches from camera"
        },
        {
          icon: "scan-outline",
          title: "Center your face",
          description: "Keep face in the center of frame"
        },
        {
          icon: "hand-left-outline",
          title: "Hold steady",
          description: "Keep device stable during capture"
        }
      ]
    }
  ];

  const currentInstruction = instructions[currentStep];

  const handleNext = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All instructions shown, proceed to face registration
      onComplete();
      setCurrentStep(0); // Reset for next time
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0); // Reset for next time
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Fixed Header */}
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.stepIndicator, isTablet && styles.stepIndicatorTablet]}>
              Step {currentStep + 1} of {instructions.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / instructions.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={[styles.skipText, isTablet && styles.skipTextTablet]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Section */}
          <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
            <LinearGradient
              colors={currentInstruction.gradientColors}
              style={[styles.imageContainer, isTablet && styles.imageContainerTablet]}
            >
              {currentInstruction.imageSource ? (
                <Image
                  source={currentInstruction.imageSource}
                  style={[styles.instructionImage, isTablet && styles.instructionImageTablet]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.iconFallback, isTablet && styles.iconFallbackTablet]}>
                  <Ionicons 
                    name={currentInstruction.icon as any} 
                    size={isTablet ? 80 : 60} 
                    color={currentInstruction.iconColor} 
                  />
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Content Section */}
          <View style={[styles.contentSection, isTablet && styles.contentSectionTablet]}>
            {/* Title */}
            <Text style={[styles.title, isTablet && styles.titleTablet]}>
              {currentInstruction.title}
            </Text>
            <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
              {currentInstruction.subtitle}
            </Text>

            {/* Description */}
            <Text style={[styles.description, isTablet && styles.descriptionTablet]}>
              {currentInstruction.description}
            </Text>

            {/* Checklist */}
            <View style={[styles.checklistContainer, isTablet && styles.checklistContainerTablet]}>
              {currentInstruction.checklistItems.map((item, index) => (
                <View key={index} style={[styles.checklistItem, isTablet && styles.checklistItemTablet]}>
                  <View style={[styles.checklistIcon, { backgroundColor: `${currentInstruction.iconColor}15` }]}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={isTablet ? 24 : 20} 
                      color={currentInstruction.iconColor} 
                    />
                  </View>
                  <View style={styles.checklistText}>
                    <Text style={[styles.checklistTitle, isTablet && styles.checklistTitleTablet]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.checklistDescription, isTablet && styles.checklistDescriptionTablet]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }, isTablet && styles.bottomActionsTablet]}>
          <TouchableOpacity 
            style={[styles.nextButton, isTablet && styles.nextButtonTablet]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#6B46C1', '#9333EA']}
              style={[styles.nextButtonGradient, isTablet && styles.nextButtonGradientTablet]}
            >
              <Text style={[styles.nextButtonText, isTablet && styles.nextButtonTextTablet]}>
                {currentStep === instructions.length - 1 ? 'Start Face Registration' : 'Continue'}
              </Text>
              <Ionicons 
                name={currentStep === instructions.length - 1 ? 'camera' : 'arrow-forward'} 
                size={isTablet ? 24 : 20} 
                color="white" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTablet: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  stepIndicatorTablet: {
    fontSize: 18,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  skipTextTablet: {
    fontSize: 18,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentTablet: {
    paddingHorizontal: width * 0.1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  imageSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  imageSectionTablet: {
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 32,
  },
  imageContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  imageContainerTablet: {
    borderRadius: 24,
    padding: 32,
    minHeight: 280,
  },
  instructionImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
  },
  instructionImageTablet: {
    width: 220,
    height: 220,
    borderRadius: 20,
  },
  iconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  iconFallbackTablet: {
    width: 220,
    height: 220,
  },
  contentSection: {
    paddingHorizontal: 20,
  },
  contentSectionTablet: {
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleTablet: {
    fontSize: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleTablet: {
    fontSize: 20,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  descriptionTablet: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistContainerTablet: {
    marginBottom: 32,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  checklistItemTablet: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  checklistIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checklistText: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  checklistTitleTablet: {
    fontSize: 18,
    marginBottom: 6,
  },
  checklistDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  checklistDescriptionTablet: {
    fontSize: 16,
    lineHeight: 24,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomActionsTablet: {
    paddingHorizontal: width * 0.1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  nextButton: {
    borderRadius: 12,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonTablet: {
    borderRadius: 16,
    shadowRadius: 12,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonGradientTablet: {
    paddingVertical: 20,
    borderRadius: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  nextButtonTextTablet: {
    fontSize: 18,
    marginRight: 12,
  },
}); 