/**
 * Comprehensive Design System for PayByFaeAi
 * Provides consistent spacing, typography, colors, shadows, and other design tokens
 * Based on professional fintech app standards
 */

import { Platform } from 'react-native';

// Spacing Scale - Based on 8px grid system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

// Typography Scale - Professional hierarchy
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    massive: 36,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Enhanced Color System
export const colors = {
  // Primary brand colors
  primary: {
    50: '#F3F0FF',
    100: '#E9E2FF',
    200: '#D4C7FF',
    300: '#B8A3FF',
    400: '#9B7AFF',
    500: '#6B46C1', // Main primary
    600: '#5B38A6',
    700: '#4A2C8A',
    800: '#3B2170',
    900: '#2D1A56',
  },
  
  // Secondary colors
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4', // Main secondary
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  
  // Neutral grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // App background colors
  appBackground: {
    light: '#F8F7FF', // Very light purple with subtle blue undertones
    dark: '#1A1625',  // Dark purple for dark mode
  },
} as const;

// Gradient definitions
export const gradients = {
  primary: ['#6B46C1', '#8B5CF6'],
  secondary: ['#06B6D4', '#0EA5E9'],
  success: ['#10B981', '#34D399'],
  warning: ['#F59E0B', '#FCD34D'],
  error: ['#EF4444', '#F87171'],
  profileHeader: ['#6B46C1', '#8B5CF6', '#06B6D4'],
  cardVisa: ['#1A1F71', '#2D3A8C'],
  cardMastercard: ['#EB001B', '#FF5F00'],
  cardAmex: ['#006FCF', '#0099CC'],
  cardDiscover: ['#FF6000', '#FF8C00'],
  cardDefault: ['#6B46C1', '#8B5CF6'],
} as const;

// Shadow system
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  
  // Special shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
} as const;

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
} as const;

// Animation timings
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Component-specific styles
export const components = {
  // Button styles
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xxl,
  },
  
  // Input styles
  input: {
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
  },
  
  // Card styles
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
  },
  
  // Modal styles
  modal: {
    borderRadius: borderRadius.xxxl,
    padding: spacing.xxxl,
  },
} as const;

// Responsive breakpoints
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Platform-specific adjustments
export const platform = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  
  // Platform-specific spacing adjustments
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
  tabBarHeight: Platform.OS === 'ios' ? 83 : 56,
} as const;

// Accessibility helpers
export const accessibility = {
  minimumTouchSize: 44,
  contrastRatio: {
    normal: 4.5,
    large: 3.0,
  },
} as const;

// Theme variants
export const themes = {
  light: {
    background: colors.white,
    surface: colors.neutral[50],
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    border: colors.neutral[200],
    primary: colors.primary[500],
    secondary: colors.secondary[500],
  },
  
  dark: {
    background: colors.neutral[900],
    surface: colors.neutral[800],
    text: colors.neutral[50],
    textSecondary: colors.neutral[400],
    border: colors.neutral[700],
    primary: colors.primary[400],
    secondary: colors.secondary[400],
  },
} as const;

// Export everything as a single design system object
export const designSystem = {
  spacing,
  typography,
  colors,
  gradients,
  shadows,
  borderRadius,
  animations,
  components,
  breakpoints,
  platform,
  accessibility,
  themes,
} as const;

export default designSystem; 
