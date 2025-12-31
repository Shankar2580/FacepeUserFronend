/**
 * Reusable Input Component
 * 
 * Variants:
 * - 'default': Standard text input
 * - 'password': With show/hide toggle
 * - 'phone': Phone number with +1 prefix
 * - 'email': Email with keyboard type
 * 
 * Usage:
 * <Input 
 *   label="Email" 
 *   value={email} 
 *   onChangeText={setEmail} 
 *   variant="email"
 *   placeholder="Enter your email"
 * />
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from './AppText';
import { scale, fontScale, wp } from '../../utils/responsive';
import { textColors } from '../../constants/Typography';

// ============================================
// Types
// ============================================
type InputVariant = 'default' | 'password' | 'phone' | 'email';

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Input variant */
  variant?: InputVariant;
  /** Error message */
  error?: string;
  /** Helper/hint text */
  hint?: string;
  /** Left icon name (Ionicons) */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon name (Ionicons) */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom input container style */
  inputContainerStyle?: ViewStyle;
  /** Required field indicator */
  required?: boolean;
}

// ============================================
// Component
// ============================================
export const Input: React.FC<InputProps> = ({
  label,
  variant = 'default',
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  required = false,
  value,
  onChangeText,
  placeholder,
  ...textInputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Get keyboard type based on variant
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (variant) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  // Get auto capitalize based on variant
  const getAutoCapitalize = (): TextInputProps['autoCapitalize'] => {
    switch (variant) {
      case 'email':
      case 'password':
        return 'none';
      default:
        return 'sentences';
    }
  };

  // Handle phone number formatting
  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    // Remove leading 1 if present
    const cleanDigits = digits.startsWith('1') ? digits.slice(1) : digits;
    // Limit to 10 digits
    const limitedDigits = cleanDigits.slice(0, 10);
    
    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted = `(${limitedDigits.slice(0, 3)}`;
      if (limitedDigits.length > 3) {
        formatted += `) ${limitedDigits.slice(3, 6)}`;
        if (limitedDigits.length > 6) {
          formatted += `-${limitedDigits.slice(6, 10)}`;
        }
      }
    }
    
    onChangeText?.(formatted);
  };

  // Handle text change
  const handleChange = (text: string) => {
    if (variant === 'phone') {
      handlePhoneChange(text);
    } else {
      onChangeText?.(text);
    }
  };

  // Get the right icon for password variant
  const getEffectiveRightIcon = () => {
    if (variant === 'password') {
      return showPassword ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  // Handle right icon press
  const handleRightIconPress = () => {
    if (variant === 'password') {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const effectiveRightIcon = getEffectiveRightIcon();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, error && styles.labelError]}>
            {label}
          </Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          inputContainerStyle,
        ]}
      >
        {/* Phone prefix */}
        {variant === 'phone' && (
          <View style={styles.phonePrefix}>
            <Text style={styles.phonePrefixText}>+1</Text>
          </View>
        )}

        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={scale(20)}
            color={error ? textColors.error : textColors.tertiary}
            style={styles.leftIcon}
          />
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            effectiveRightIcon && styles.inputWithRightIcon,
            variant === 'phone' && styles.inputWithPhonePrefix,
          ]}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={getKeyboardType()}
          autoCapitalize={getAutoCapitalize()}
          secureTextEntry={variant === 'password' && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          allowFontScaling={false}
          {...textInputProps}
        />

        {/* Right Icon / Password Toggle */}
        {effectiveRightIcon && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={effectiveRightIcon}
              size={scale(20)}
              color={error ? textColors.error : textColors.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(14)} color={textColors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Hint Text */}
      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
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
    marginBottom: scale(16),
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: textColors.primary,
  },
  labelError: {
    color: textColors.error,
  },
  required: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: textColors.error,
    marginLeft: scale(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(56),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(16),
  },
  inputContainerFocused: {
    borderColor: '#6B46C1',
    backgroundColor: '#FAFAFE',
  },
  inputContainerError: {
    borderColor: textColors.error,
    backgroundColor: '#FEF2F2',
  },
  phonePrefix: {
    paddingRight: scale(8),
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    marginRight: scale(8),
  },
  phonePrefixText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    color: textColors.secondary,
  },
  input: {
    flex: 1,
    fontSize: fontScale(16),
    fontWeight: '400',
    color: textColors.primary,
    paddingVertical: 0,
  },
  inputWithLeftIcon: {
    marginLeft: scale(8),
  },
  inputWithRightIcon: {
    marginRight: scale(8),
  },
  inputWithPhonePrefix: {
    // Additional styling if needed
  },
  leftIcon: {
    marginRight: scale(4),
  },
  rightIconButton: {
    padding: scale(4),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(6),
    gap: scale(4),
  },
  errorText: {
    fontSize: fontScale(12),
    fontWeight: '500',
    color: textColors.error,
    flex: 1,
  },
  hint: {
    fontSize: fontScale(12),
    fontWeight: '400',
    color: textColors.tertiary,
    marginTop: scale(6),
  },
});

export default Input;

