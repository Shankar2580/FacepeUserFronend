/**
 * Reusable PIN Input Component
 * 
 * Two variants:
 * - 'boxes': 4 separate boxes (□ □ □ □)
 * - 'single': Single text input field
 * 
 * Usage:
 * <PINInput 
 *   pin={newPin} 
 *   setPin={setNewPin} 
 *   label="Create New PIN"
 *   variant="boxes"
 *   secure
 * />
 */

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { AppText as Text } from './AppText';
import { scale, fontScale, wp } from '../../utils/responsive';
import { textColors, textStyles } from '../../constants/Typography';

// ============================================
// Types
// ============================================
interface PINInputProps {
  /** Current PIN value */
  pin: string;
  /** Function to update PIN value */
  setPin: (pin: string) => void;
  /** Optional label above the input */
  label?: string;
  /** Number of digits (default: 4) */
  length?: number;
  /** Layout variant */
  variant?: 'boxes' | 'single';
  /** Show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Mask input with dots (default: true for boxes, depends on secureTextEntry for single) */
  secure?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Callback when PIN is complete */
  onComplete?: (pin: string) => void;
  /** Placeholder for single variant */
  placeholder?: string;
}

// ============================================
// Component
// ============================================
export const PINInput: React.FC<PINInputProps> = ({
  pin,
  setPin,
  label,
  length = 4,
  variant = 'boxes',
  error = false,
  errorMessage,
  secure = true,
  containerStyle,
  disabled = false,
  autoFocus = false,
  onComplete,
  placeholder = 'Enter PIN',
}) => {
  const inputs = useRef<TextInput[]>([]);

  // Calculate responsive input size
  const inputSize = Math.min((wp(60) - scale(24)) / length, scale(56));

  // Handle text change for boxes variant - supports both single digit and paste
  const handleBoxTextChange = (text: string, index: number) => {
    // Filter to only digits
    const digitsOnly = text.replace(/\D/g, '');

    // Handle paste (multiple digits)
    if (digitsOnly.length > 1) {
      // Take up to 'length' digits starting from the pasted position
      const pastedDigits = digitsOnly.slice(0, length);
      setPin(pastedDigits);
      
      // Focus the last input after paste
      const lastIndex = Math.min(pastedDigits.length, length) - 1;
      setTimeout(() => {
        inputs.current[lastIndex]?.focus();
      }, 100);
      
      if (onComplete && pastedDigits.length >= length) {
        setTimeout(() => {
          onComplete(pastedDigits.slice(0, length));
        }, 150);
      }
      return;
    }

    // Handle single digit entry
    const pinArray = pin.padEnd(length, ' ').split('');
    pinArray[index] = digitsOnly || ' ';
    const newPin = pinArray.join('').replace(/ /g, '');
    setPin(newPin);

    // Move to next input
    if (digitsOnly && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Check completion
    if (onComplete && newPin.length === length) {
      onComplete(newPin);
    }
  };

  // Handle backspace for boxes variant
  const handleBoxKeyPress = (
    { nativeEvent: { key } }: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // Handle text change for single variant
  const handleSingleTextChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, length);
    setPin(digitsOnly);

    if (onComplete && digitsOnly.length === length) {
      onComplete(digitsOnly);
    }
  };

  // Render boxes variant
  const renderBoxes = () => (
    <View style={styles.boxesContainer}>
      {Array(length).fill(0).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            if (el) inputs.current[index] = el;
          }}
          style={[
            styles.box,
            {
              width: inputSize,
              height: inputSize,
              fontSize: fontScale(24),
            },
            error && styles.boxError,
            disabled && styles.boxDisabled,
          ]}
          keyboardType="numeric"
          maxLength={4} // Allow paste but limit display
          onChangeText={(text) => handleBoxTextChange(text, index)}
          onKeyPress={(e) => handleBoxKeyPress(e, index)}
          value={secure && pin[index] ? '●' : (pin[index] || '')}
          autoFocus={autoFocus && index === 0}
          editable={!disabled}
          allowFontScaling={false}
          secureTextEntry={false} // We handle masking manually to show dots
          selectTextOnFocus
        />
      ))}
    </View>
  );

  // Render single input variant
  const renderSingle = () => (
    <TextInput
      style={[
        styles.singleInput,
        error && styles.singleInputError,
        disabled && styles.singleInputDisabled,
      ]}
      keyboardType="numeric"
      maxLength={length}
      onChangeText={handleSingleTextChange}
      value={pin}
      placeholder={disabled ? 'Account locked' : placeholder}
      placeholderTextColor="#9CA3AF"
      autoFocus={autoFocus}
      editable={!disabled}
      allowFontScaling={false}
      secureTextEntry={secure}
    />
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      {variant === 'boxes' ? renderBoxes() : renderSingle()}
      
      {errorMessage && (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      )}
    </View>
  );
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: textColors.primary,
    marginBottom: scale(12),
    alignSelf: 'flex-start',
  },
  labelError: {
    color: textColors.error,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(12),
  },
  box: {
    backgroundColor: '#F3F4F6',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontWeight: '700',
    color: textColors.primary,
  },
  boxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  boxDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    color: '#9CA3AF',
  },
  singleInput: {
    width: '100%',
    height: scale(60),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: fontScale(24),
    fontWeight: '700',
    color: textColors.primary,
    letterSpacing: 16,
  },
  singleInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  singleInputDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    color: '#9CA3AF',
  },
  errorMessage: {
    fontSize: fontScale(12),
    fontWeight: '500',
    color: textColors.error,
    marginTop: scale(8),
    alignSelf: 'flex-start',
  },
});

export default PINInput;

