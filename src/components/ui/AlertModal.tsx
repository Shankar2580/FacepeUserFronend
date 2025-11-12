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
          backgroundColor: '#E6FFE6',
          iconColor: '#10B981',
          buttonGradient: ['#10B981', '#059669'],
        };
      case 'warning':
      case 'error':
      case 'info':
      default:
        return {
          icon: type === 'error' ? 'close-circle-outline' : type === 'warning' ? 'warning-outline' : 'information-circle-outline',
          backgroundColor: '#E6F2FF',
          iconColor: '#3B82F6',
          buttonGradient: ['#3B82F6', '#2563EB'],
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
          <View style={[styles.modalContent, { backgroundColor: config.backgroundColor }]}>
            <Animated.View
              style={[
                styles.iconWrapper,
                { backgroundColor: config.iconColor + '20' },
                {
                  transform: [
                    { scale: iconContainerScale },
                    { rotate: iconContainerRotate },
                  ],
                },
              ]}
            >
              <Ionicons name={config.icon as any} size={48} color={config.iconColor} />
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
                      buttons.length > 1 && { flex: 1 },
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    {isPrimary && !isCancel ? (
                      <LinearGradient
                        colors={config.buttonGradient}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.primaryButtonText}>
                          {button.text}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.secondaryButton}>
                        <Text style={[styles.buttonText, { color: config.iconColor }]}>
                          {button.text}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </View>
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
    paddingBottom: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 16,
    overflow: 'visible',
    minWidth: 100,
  },
  buttonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'currentColor',
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
