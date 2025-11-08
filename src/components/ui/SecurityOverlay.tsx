import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SecurityOverlayProps {
  visible: boolean;
  reason?: 'screenshot' | 'recording' | 'security';
  message?: string;
}

export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({
  visible,
  reason = 'security',
  message,
}) => {
  const getSecurityMessage = () => {
    if (message) return message;
    
    switch (reason) {
      case 'screenshot':
        return 'Screenshots are disabled for your security';
      case 'recording':
        return 'Screen recording detected. Please stop recording to continue.';
      default:
        return 'Content hidden for security';
    }
  };

  const getIconName = () => {
    switch (reason) {
      case 'screenshot':
        return 'camera-off';
      case 'recording':
        return 'videocam-off';
      default:
        return 'shield-checkmark';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1F2937', '#111827', '#000000']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getIconName() as any} 
                size={80} 
                color="#EF4444" 
              />
            </View>
            
            <Text style={styles.title}>Security Protection</Text>
            <Text style={styles.message}>{getSecurityMessage()}</Text>
            
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>FacePe</Text>
              <Text style={styles.brandSubtext}>Secure Payment Platform</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B46C1',
    marginBottom: 4,
  },
  brandSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
});
