import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PasswordStrengthIndicatorProps {
  password: string;
  showStrength?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showStrength = true,
}) => {
  const [animatedValue] = React.useState(new Animated.Value(0));

  const calculateStrength = (password: string): {
    score: number;
    label: string;
    color: string;
    gradientColors: string[];
  } => {
    if (!password) {
      return {
        score: 0,
        label: '',
        color: '#E5E7EB',
        gradientColors: ['#E5E7EB', '#E5E7EB'],
      };
    }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Count how many criteria are met
    const criteriaCount = Object.values(checks).filter(Boolean).length;
    
    // Calculate score based on criteria
    let score = 0;
    if (checks.length) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.numbers) score += 20;
    if (checks.symbols) score += 20;

    // Determine strength level - Strong only if ALL criteria are met
    if (criteriaCount < 2) {
      return {
        score: 25,
        label: 'Weak',
        color: '#EF4444',
        gradientColors: ['#EF4444', '#F87171'],
      };
    } else if (criteriaCount < 3) {
      return {
        score: 40,
        label: 'Fair',
        color: '#F59E0B',
        gradientColors: ['#F59E0B', '#FCD34D'],
      };
    } else if (criteriaCount < 5) {
      return {
        score: 70,
        label: 'Medium strength',
        color: '#10B981',
        gradientColors: ['#10B981', '#34D399'],
      };
    } else if (criteriaCount === 5 && checks.length && checks.lowercase && checks.uppercase && checks.numbers && checks.symbols) {
      // Strong only when ALL criteria are met: length >= 8, lowercase, uppercase, numbers, and symbols
      return {
        score: 100,
        label: 'Strong',
        color: '#059669',
        gradientColors: ['#059669', '#10B981'],
      };
    } else {
      return {
        score: 70,
        label: 'Medium strength',
        color: '#10B981',
        gradientColors: ['#10B981', '#34D399'],
      };
    }
  };

  const strength = calculateStrength(password);

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: strength.score,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [strength.score]);

  if (!showStrength || !password) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <LinearGradient
              colors={strength.gradientColors as [string, string, ...string[]]}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Text style={[styles.strengthText, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
}); 