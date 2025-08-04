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

  // Quick tips for face registration
  const quickTips = [
    "Make sure your face is well-lit and clearly visible",
    "Remove any accessories that might obstruct your face", 
    "Keep your device steady and at eye level",
    "Look directly at the camera when capturing",
    "Face a window or bright lamp for best lighting",
    "Stay 12-18 inches from camera",
    "Keep face in center of frame",
    "Avoid shadows on your face"
  ];

  const handleStartRegistration = () => {
    onComplete();
  };

  const handleSkip = () => {
    onClose();
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
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>
              Face Registration Guide
            </Text>
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
          {/* Main Title with Image */}
          <View style={styles.titleSection}>
            <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
              <LinearGradient
                colors={["#F3F4F6", "#E5E7EB"]}
                style={[styles.imageContainer, isTablet && styles.imageContainerTablet]}
              >
                {getImageSource('facerec2') ? (
                  <Image
                    source={getImageSource('facerec2')}
                    style={[styles.instructionImage, isTablet && styles.instructionImageTablet]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.iconFallback, isTablet && styles.iconFallbackTablet]}>
                    <Ionicons 
                      name="person-circle-outline" 
                      size={isTablet ? 80 : 60} 
                      color="#6B46C1" 
                    />
                  </View>
                )}
              </LinearGradient>
            </View>
            <Text style={[styles.mainTitle, isTablet && styles.mainTitleTablet]}>
              Get Ready for Face Registration
            </Text>
            <Text style={[styles.mainSubtitle, isTablet && styles.mainSubtitleTablet]}>
              Follow these simple guidelines for best results
            </Text>
          </View>

          {/* Quick Tips Section */}
          <View style={[styles.tipsSection, isTablet && styles.tipsSectionTablet]}>
            <Text style={[styles.tipsTitle, isTablet && styles.tipsTitleTablet]}>
              💡 Quick Tips
            </Text>
            <View style={styles.tipsContainer}>
              {quickTips.map((tip, index) => (
                <View key={index} style={[styles.tipItem, isTablet && styles.tipItemTablet]}>
                  <View style={styles.bulletPoint}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.tipText, isTablet && styles.tipTextTablet]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }, isTablet && styles.bottomActionsTablet]}>
          <TouchableOpacity 
            style={[styles.nextButton, isTablet && styles.nextButtonTablet]}
            onPress={handleStartRegistration}
          >
            <LinearGradient
              colors={['#6B46C1', '#9333EA']}
              style={[styles.nextButtonGradient, isTablet && styles.nextButtonGradientTablet]}
            >
              <Text style={[styles.nextButtonText, isTablet && styles.nextButtonTextTablet]}>
                Start Face Registration
              </Text>
              <Ionicons 
                name="camera" 
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerTitleTablet: {
    fontSize: 24,
  },
  skipButton: {
    padding: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainTitleTablet: {
    fontSize: 32,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  mainSubtitleTablet: {
    fontSize: 20,
  },
  bulletPoint: {
    marginRight: 12,
    marginTop: 2,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageSectionTablet: {
    marginBottom: 40,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainerTablet: {
    width: 240,
    height: 240,
  },
  instructionImage: {
    width: '100%',
    height: '100%',
  },
  instructionImageTablet: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallbackTablet: {
    // No additional styles needed
  },
  tipsSection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsSectionTablet: {
    padding: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsTitleTablet: {
    fontSize: 18,
  },
  tipsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tipsTextTablet: {
    fontSize: 16,
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipItemTablet: {
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },
  tipTextTablet: {
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
    paddingHorizontal: 40,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonTablet: {
    borderRadius: 20,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonGradientTablet: {
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButtonTextTablet: {
    fontSize: 18,
  },
}); 