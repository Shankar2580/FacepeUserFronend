import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { typography, spacing } from '@/constants/DesignSystem';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'heading1' | 'heading2' | 'heading3' | 'bodyLarge' | 'bodySmall' | 'caption' | 'overline';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getTextStyle = () => {
    switch (type) {
      case 'default': return styles.default;
      case 'title': return styles.title;
      case 'defaultSemiBold': return styles.defaultSemiBold;
      case 'subtitle': return styles.subtitle;
      case 'link': return styles.link;
      case 'heading1': return styles.heading1;
      case 'heading2': return styles.heading2;
      case 'heading3': return styles.heading3;
      case 'bodyLarge': return styles.bodyLarge;
      case 'bodySmall': return styles.bodySmall;
      case 'caption': return styles.caption;
      case 'overline': return styles.overline;
      default: return styles.default;
    }
  };

  return (
    <Text
      style={[
        { color: color as string },
        getTextStyle(),
        style,
      ]}
      allowFontScaling={true}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Legacy styles for backward compatibility
  default: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  defaultSemiBold: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semiBold,
  },
  title: {
    fontSize: typography.fontSize.huge,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.huge * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  link: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.loose,
    color: '#0a7ea4',
    fontWeight: typography.fontWeight.medium,
  },
  
  // New professional typography variants
  heading1: {
    fontSize: typography.fontSize.massive,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.massive * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  heading2: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  heading3: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
});
