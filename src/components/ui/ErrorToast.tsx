/**
 * ErrorToast.tsx — User-facing error + retry notification
 *
 * Shows a dismissable banner at the bottom of the screen when
 * an API call fails. Surfaces a retry action if recoverable.
 *
 * Usage:
 *   <ErrorToast
 *     message="Could not load carbon data"
 *     recoverable
 *     onRetry={refetch}
 *     onDismiss={() => setError(null)}
 *   />
 */
import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, radii, typography } from '../../constants/theme';

export interface ErrorToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  recoverable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number; // 0 = don't auto-dismiss
}

/**
 * Animated bottom toast for displaying API and Network errors, or successes/info.
 * Includes a mandatory "Retry" button if the error is declared recoverable.
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  type = 'error',
  recoverable = false,
  onRetry,
  onDismiss,
  autoDismissMs = 6000,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Slide in
    opacity.value = withTiming(1, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });

    if (autoDismissMs <= 0) {
      return () => {};
    }

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 250 }, finished => {
        if (finished && onDismiss) {
          runOnJS(onDismiss)();
        }
      });
      translateY.value = withTiming(20, { duration: 250 });
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [opacity, translateY, autoDismissMs, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getIcon = () => {
    if (recoverable && type === 'error') return '⚠️';
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
      default:
        return '❌';
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>

      {recoverable && onRetry && type === 'error' ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : onDismiss ? (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 9999, // Ensure it sits on top
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.base,
  },
  retryButton: {
    backgroundColor: colors.green800,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  retryText: {
    color: colors.textOnDark,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  dismissButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
});

export default ErrorToast;
