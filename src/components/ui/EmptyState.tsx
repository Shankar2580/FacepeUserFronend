import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { designSystem, spacing, shadows, borderRadius, typography } from '../../constants/DesignSystem';
import { Colors } from '../../constants/Colors';
// Removed useColorScheme - using light theme by default

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'default' | 'cards' | 'transactions' | 'notifications';
  animated?: boolean;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  variant = 'default',
  animated = true,
}: EmptyStateProps) {
  const colorScheme = 'light'; // Using light theme by default
  const theme = Colors[colorScheme];
  
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
    }
  }, [animated]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'cards':
        return {
          iconColor: theme.primary,
          gradientColors: [theme.primary + '20', theme.secondary + '20'],
        };
      case 'transactions':
        return {
          iconColor: theme.secondary,
          gradientColors: [theme.secondary + '20', theme.primary + '20'],
        };
      case 'notifications':
        return {
          iconColor: theme.warning,
          gradientColors: [theme.warning + '20', theme.success + '20'],
        };
      default:
        return {
          iconColor: theme.primary,
          gradientColors: [theme.backgroundSecondary, theme.backgroundTertiary],
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Icon Container with Gradient Background */}
        <View style={styles.iconContainer}>
                     <LinearGradient
             colors={variantStyles.gradientColors as [string, string]}
             style={styles.iconGradient}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
           >
            <Ionicons 
              name={icon} 
              size={48} 
              color={variantStyles.iconColor}
              accessibilityLabel={`${title} icon`}
            />
          </LinearGradient>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        </View>

        {/* Action Button */}
        {actionText && onAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={onAction}
            accessibilityLabel={actionText}
            accessibilityHint={`Tap to ${actionText.toLowerCase()}`}
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.massive,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: spacing.xxxl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    maxWidth: 280,
  },
  actionButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    minWidth: 160,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default EmptyState; 