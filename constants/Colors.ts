/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#6B46C1'; // Primary purple
const tintColorDark = '#9333EA'; // Light purple for dark mode

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional app colors
    primary: '#6B46C1',
    primaryLight: '#8B5CF6',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Gradient colors
    gradients: {
      primary: ['#6B46C1', '#8B5CF6'],
      secondary: ['#06B6D4', '#0EA5E9'],
      success: ['#10B981', '#34D399'],
      warning: ['#F59E0B', '#FCD34D'],
      error: ['#EF4444', '#F87171'],
      profileHeader: ['#6B46C1', '#8B5CF6', '#06B6D4'],
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional app colors for dark mode
    primary: '#9333EA',
    primaryLight: '#A855F7',
    secondary: '#0EA5E9',
    success: '#34D399',
    warning: '#FCD34D',
    error: '#F87171',
    gray: {
      50: '#18181B',
      100: '#27272A',
      200: '#3F3F46',
      300: '#52525B',
      400: '#71717A',
      500: '#A1A1AA',
      600: '#D4D4D8',
      700: '#E4E4E7',
      800: '#F4F4F5',
      900: '#FAFAFA',
    },
    // Gradient colors for dark mode
    gradients: {
      primary: ['#9333EA', '#A855F7'],
      secondary: ['#0EA5E9', '#06B6D4'],
      success: ['#34D399', '#10B981'],
      warning: ['#FCD34D', '#F59E0B'],
      error: ['#F87171', '#EF4444'],
      profileHeader: ['#9333EA', '#A855F7', '#0EA5E9'],
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
