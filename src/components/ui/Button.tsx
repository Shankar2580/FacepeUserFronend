/**
 * Reusable Button Component
 * 
 * Variants:
 * - 'primary': Gradient purple (main actions)
 * - 'secondary': Outlined (cancel, back)
 * - 'ghost': Text only (links)
 * - 'danger': Red gradient (delete actions)
 * 
 * Usage:
 * <Button title="Submit" onPress={handleSubmit} />
 * <Button title="Cancel" variant="secondary" onPress={handleCancel} />
 * <Button title="Delete" variant="danger" icon="trash-outline" />
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { fontScale, scale } from '../../utils/responsive';
import { AppText as Text } from './AppText';

// ============================================
// Types
// ============================================
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  /** Button text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Ionicons icon name */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
}

// ============================================
// Gradient colors by variant
// ============================================
const gradientColors: Record<ButtonVariant, readonly [string, string, ...string[]]> = {
  primary: ['#6B46C1', '#8B5CF6'],
  secondary: ['#FFFFFF', '#FFFFFF'],
  ghost: ['transparent', 'transparent'],
  danger: ['#DC2626', '#EF4444'],
};

// ============================================
// Size configurations
// ============================================
const sizeConfig: Record<ButtonSize, { height: number; paddingH: number; fontSize: number; iconSize: number }> = {
  small: {
    height: scale(40),
    paddingH: scale(16),
    fontSize: fontScale(14),
    iconSize: scale(16),
  },
  medium: {
    height: scale(52),
    paddingH: scale(24),
    fontSize: fontScale(16),
    iconSize: scale(20),
  },
  large: {
    height: scale(60),
    paddingH: scale(32),
    fontSize: fontScale(18),
    iconSize: scale(24),
  },
};

// ============================================
// Component
// ============================================
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const config = sizeConfig[size];
  const colors = gradientColors[variant];
  const isOutlined = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  // Get text color based on variant
  const getTextColor = () => {
    if (isDisabled) return '#9CA3AF';
    if (isOutlined) return '#374151';
    if (isGhost) return '#6B46C1';
    return '#FFFFFF';
  };

  // Get icon color
  const getIconColor = () => {
    if (isDisabled) return '#9CA3AF';
    if (isOutlined) return '#374151';
    if (isGhost) return '#6B46C1';
    return '#FFFFFF';
  };

  // Render button content
  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={config.iconSize}
              color={getIconColor()}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              { fontSize: config.fontSize, color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={config.iconSize}
              color={getIconColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  // Render gradient button (primary, danger)
  const renderGradientButton = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.touchable,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={isDisabled ? ['#E5E7EB', '#E5E7EB'] : colors}
        style={[
          styles.gradient,
          {
            height: config.height,
            paddingHorizontal: config.paddingH,
            minHeight: 44, // Minimum touch target
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {renderContent()}
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render outlined button (secondary)
  const renderOutlinedButton = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.touchable,
        styles.outlined,
        {
          height: config.height,
          paddingHorizontal: config.paddingH,
          minHeight: 44,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.outlinedDisabled,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );

  // Render ghost button
  const renderGhostButton = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[
        styles.ghost,
        {
          height: config.height,
          paddingHorizontal: config.paddingH,
          minHeight: 44,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.ghostDisabled,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );

  // Render based on variant
  if (isGhost) return renderGhostButton();
  if (isOutlined) return renderOutlinedButton();
  return renderGradientButton();
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  touchable: {
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  outlinedDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  ghost: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostDisabled: {
    opacity: 0.5,
  },
  disabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: scale(8),
  },
  iconRight: {
    marginLeft: scale(8),
  },
});

export default Button;

