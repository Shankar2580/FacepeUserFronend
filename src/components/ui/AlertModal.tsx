import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' as const }],
  type = 'info',
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.stagger(100, [
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon animation
      Animated.spring(iconAnim, {
        toValue: 1,
        tension: 20,
        friction: 3,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      iconAnim.setValue(0);
    }
  }, [visible]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle-outline',
          gradientColors: ['#10B981', '#059669'],
        };
      case 'warning':
        return {
          icon: 'warning-outline',
          gradientColors: ['#6B46C1', '#8B5CF6'],
        };
      case 'error':
        return {
          icon: 'close-circle-outline',
          gradientColors: ['#6B46C1', '#8B5CF6'],
        };
      default:
        return {
          icon: 'information-circle-outline',
          gradientColors: ['#6B46C1', '#9333EA'],
        };
    }
  };

  const config = getTypeConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const iconContainerScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const iconContainerRotate = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" translucent />
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={config.gradientColors}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [
                    { scale: iconContainerScale },
                    { rotate: iconContainerRotate },
                  ],
                },
              ]}
            >
              <Ionicons name={config.icon as any} size={48} color="white" />
            </Animated.View>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </Animated.View>

            <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
              {buttons.map((button, index) => {
                const isPrimary = button.style === 'default' || button.style === 'destructive';
                const isCancel = button.style === 'cancel';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isPrimary ? styles.primaryButton : styles.secondaryButton,
                      button.style === 'destructive' && styles.destructiveButton,
                      buttons.length > 1 && { flex: 1 },
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    alignItems: 'stretch', // Stretch items to have the same height
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 16, // Add back vertical padding
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center', // Center content
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  destructiveButton: {
    backgroundColor: '#CC0000',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#333',
  },
  secondaryButtonText: {
    color: 'white',
  },
});

// Hook for easy usage
export const useAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      buttons?: AlertButton[],
      type?: 'info' | 'success' | 'warning' | 'error'
    ) => {
      setAlertState({ visible: true, title, message, buttons, type });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState((prevState) => ({ ...prevState, visible: false }));
  }, []);

  const AlertComponent = useCallback(() => {
    return (
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        onDismiss={hideAlert}
      />
    );
  }, [alertState, hideAlert]);

  return { showAlert, hideAlert, AlertComponent };
}; 
