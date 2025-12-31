import React from 'react';
import { Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps } from 'react-native';

interface AppTextProps extends TextProps {
  children: React.ReactNode;
}

/**
 * Custom Text component that PREVENTS system font scaling
 * This ensures your app looks the same on ALL devices
 * regardless of user's font size/bold settings in system preferences
 * Using maxFontSizeMultiplier={1} (recommended method)
 * 
 * Usage: Replace <Text> with <AppText> in components
 */
export function AppText({ style, children, ...props }: AppTextProps) {
  return (
    <RNText
      {...props}
      style={style}
      maxFontSizeMultiplier={1}
    >
      {children}
    </RNText>
  );
}

/**
 * For accessibility-conscious screens - allows SOME scaling but caps it
 * Max 1.15 = only 15% larger than designed (prevents layout breaks)
 */
export function AppTextAccessible({ style, children, ...props }: AppTextProps) {
  return (
    <RNText
      {...props}
      style={style}
      maxFontSizeMultiplier={1.15}
    >
      {children}
    </RNText>
  );
}

/**
 * Custom TextInput that prevents system font scaling
 * Use this for all text inputs to ensure consistent sizing
 * Using maxFontSizeMultiplier={1} (recommended method)
 */
export function AppTextInput(props: TextInputProps) {
  return (
    <RNTextInput
      {...props}
      maxFontSizeMultiplier={1}
    />
  );
}

/**
 * HOC to wrap any Text component with font scaling disabled
 * Useful for third-party components
 * Using maxFontSizeMultiplier={1} (recommended method)
 */
export function withNoFontScaling<P extends TextProps>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function NoFontScalingText(props: P) {
    return <WrappedComponent {...props} maxFontSizeMultiplier={1} />;
  };
}

// Default export for convenience
export default AppText;

// Re-export Text and TextInput types for type safety
export type { TextInputProps, TextProps };

