/**
 * Enhanced Colors system with comprehensive light/dark mode support
 * Integrated with the new DesignSystem for professional fintech app theming
 * Based on modern design principles with accessibility considerations
 */

import { designSystem } from './DesignSystem';

const tintColorLight = designSystem.colors.primary[500]; // Primary purple
const tintColorDark = designSystem.colors.primary[400]; // Light purple for dark mode

export const Colors = {
  light: {
    text: designSystem.colors.neutral[900],
    background: designSystem.colors.appBackground.light,
    surface: designSystem.colors.neutral[50],
    tint: tintColorLight,
    icon: designSystem.colors.neutral[500],
    tabIconDefault: designSystem.colors.neutral[500],
    tabIconSelected: tintColorLight,
    border: designSystem.colors.neutral[200],
    
    // Enhanced semantic colors
    primary: designSystem.colors.primary[500],
    primaryLight: designSystem.colors.primary[400],
    primaryDark: designSystem.colors.primary[600],
    secondary: designSystem.colors.secondary[500],
    secondaryLight: designSystem.colors.secondary[400],
    success: designSystem.colors.success[500],
    successLight: designSystem.colors.success[100],
    warning: designSystem.colors.warning[500],
    warningLight: designSystem.colors.warning[100],
    error: designSystem.colors.error[500],
    errorLight: designSystem.colors.error[100],
    
    // Text variants
    textPrimary: designSystem.colors.neutral[900],
    textSecondary: designSystem.colors.neutral[600],
    textTertiary: designSystem.colors.neutral[400],
    textInverse: designSystem.colors.white,
    
    // Background variants
    backgroundPrimary: designSystem.colors.white,
    backgroundSecondary: designSystem.colors.neutral[50],
    backgroundTertiary: designSystem.colors.neutral[100],
    
    // Legacy gray scale (maintained for backward compatibility)
    gray: designSystem.colors.neutral,
    
    // Enhanced gradient colors
    gradients: designSystem.gradients,
  },
  
  dark: {
    text: designSystem.colors.neutral[50],
    background: designSystem.colors.appBackground.dark,
    surface: designSystem.colors.neutral[800],
    tint: tintColorDark,
    icon: designSystem.colors.neutral[400],
    tabIconDefault: designSystem.colors.neutral[400],
    tabIconSelected: tintColorDark,
    border: designSystem.colors.neutral[700],
    
    // Enhanced semantic colors for dark mode
    primary: designSystem.colors.primary[400],
    primaryLight: designSystem.colors.primary[300],
    primaryDark: designSystem.colors.primary[500],
    secondary: designSystem.colors.secondary[400],
    secondaryLight: designSystem.colors.secondary[300],
    success: designSystem.colors.success[500],
    successLight: designSystem.colors.success[100],
    warning: designSystem.colors.warning[500],
    warningLight: designSystem.colors.warning[100],
    error: designSystem.colors.error[500],
    errorLight: designSystem.colors.error[100],
    
    // Text variants for dark mode
    textPrimary: designSystem.colors.neutral[50],
    textSecondary: designSystem.colors.neutral[400],
    textTertiary: designSystem.colors.neutral[600],
    textInverse: designSystem.colors.neutral[900],
    
    // Background variants for dark mode
    backgroundPrimary: designSystem.colors.neutral[900],
    backgroundSecondary: designSystem.colors.neutral[800],
    backgroundTertiary: designSystem.colors.neutral[700],
    
    // Legacy gray scale (inverted for dark mode)
    gray: {
      50: designSystem.colors.neutral[900],
      100: designSystem.colors.neutral[800],
      200: designSystem.colors.neutral[700],
      300: designSystem.colors.neutral[600],
      400: designSystem.colors.neutral[500],
      500: designSystem.colors.neutral[400],
      600: designSystem.colors.neutral[300],
      700: designSystem.colors.neutral[200],
      800: designSystem.colors.neutral[100],
      900: designSystem.colors.neutral[50],
    },
    
    // Dark mode gradients
    gradients: {
      primary: [designSystem.colors.primary[400], designSystem.colors.primary[300]],
      secondary: [designSystem.colors.secondary[400], designSystem.colors.secondary[300]],
      success: [designSystem.colors.success[500], designSystem.colors.success[400]],
      warning: [designSystem.colors.warning[500], designSystem.colors.warning[400]],
      error: [designSystem.colors.error[500], designSystem.colors.error[400]],
      profileHeader: [designSystem.colors.primary[400], designSystem.colors.primary[300], designSystem.colors.secondary[400]],
      cardVisa: ['#2D3A8C', '#1A1F71'],
      cardMastercard: ['#FF5F00', '#EB001B'],
      cardAmex: ['#0099CC', '#006FCF'],
      cardDiscover: ['#FF8C00', '#FF6000'],
      cardDefault: [designSystem.colors.primary[400], designSystem.colors.primary[300]],
    },
  },
};

// Export commonly used colors for easy access
export const AppColors = {
  primary: '#6B46C1',
  primaryLight: '#8B5CF6',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};
