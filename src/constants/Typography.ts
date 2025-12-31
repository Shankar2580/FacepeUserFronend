/**
 * Centralized Typography System for FacePe App
 * 
 * Usage:
 * import { textStyles, fontSizes, fontWeights } from '@/constants/Typography';
 * 
 * <Text style={textStyles.h1}>Welcome</Text>
 * <Text style={textStyles.body}>Description</Text>
 */

import { StyleSheet, TextStyle } from 'react-native';
import { fontScale } from '../utils/responsive';

// ============================================
// Font Sizes (Responsive)
// ============================================
export const fontSizes = {
  xs: fontScale(12),      // Caption, hints
  sm: fontScale(14),      // Small text, labels
  md: fontScale(16),      // Body text, inputs
  lg: fontScale(18),      // Large body
  xl: fontScale(20),      // Subsection titles
  xxl: fontScale(24),     // Section headers
  xxxl: fontScale(28),    // Card titles
  huge: fontScale(32),    // Screen titles
  massive: fontScale(36), // Hero text
} as const;

// ============================================
// Font Weights
// ============================================
export const fontWeights = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const;

// ============================================
// Line Heights
// ============================================
export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// ============================================
// Text Colors
// ============================================
export const textColors = {
  primary: '#1F2937',      // Main text (dark gray)
  secondary: '#6B7280',    // Secondary text (medium gray)
  tertiary: '#9CA3AF',     // Placeholder, hints (light gray)
  white: '#FFFFFF',        // White text (on dark backgrounds)
  error: '#EF4444',        // Error messages
  success: '#10B981',      // Success messages
  warning: '#F59E0B',      // Warning messages
  link: '#6B46C1',         // Links, interactive text
} as const;

// ============================================
// Pre-defined Text Styles
// ============================================
export const textStyles = StyleSheet.create({
  // Headings
  h1: {
    fontSize: fontSizes.huge,
    fontWeight: fontWeights.bold,
    color: textColors.primary,
    lineHeight: fontSizes.huge * lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    color: textColors.primary,
    lineHeight: fontSizes.xxxl * lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.semiBold,
    color: textColors.primary,
    lineHeight: fontSizes.xxl * lineHeights.normal,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semiBold,
    color: textColors.primary,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },

  // Body Text
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: textColors.primary,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    color: textColors.primary,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: textColors.secondary,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },

  // Labels & Captions
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: textColors.primary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: textColors.tertiary,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // Buttons
  button: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: textColors.white,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    color: textColors.white,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },

  // Inputs
  input: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: textColors.primary,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    color: textColors.primary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  inputHint: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: textColors.tertiary,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  inputError: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: textColors.error,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // Special
  otp: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: textColors.primary,
    textAlign: 'center' as const,
  },
  pin: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: textColors.primary,
    textAlign: 'center' as const,
  },
  link: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semiBold,
    color: textColors.link,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  linkSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: textColors.link,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // Screen-specific
  screenTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: textColors.white,
    lineHeight: fontSizes.xxl * lineHeights.tight,
  },
  screenSubtitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: textColors.white,
    opacity: 0.9,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semiBold,
    color: textColors.primary,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semiBold,
    color: textColors.primary,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  cardSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: textColors.secondary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // Centered text
  centered: {
    textAlign: 'center' as const,
  },
});

// ============================================
// Helper function to combine styles
// ============================================
export const combineTextStyles = (...styles: TextStyle[]): TextStyle => {
  return Object.assign({}, ...styles);
};

export default {
  fontSizes,
  fontWeights,
  lineHeights,
  textColors,
  textStyles,
  combineTextStyles,
};

