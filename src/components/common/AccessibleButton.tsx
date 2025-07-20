/**
 * Fully accessible button component compliant with WCAG 2.1 AA standards
 * Supports screen readers, keyboard navigation, and high contrast modes
 */
import React, { useCallback, useRef, useState } from 'react';

import type { AccessibilityRole, AccessibilityState, TextStyle, ViewStyle } from 'react-native';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { hapticFeedbackService } from '../../services/HapticFeedbackService';
import { useTheme } from '../../theme/ThemeProvider';
import { accessibilityService, AccessibilityUtils } from '../../utils/accessibility';

export interface AccessibleButtonProps {
  // Content
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';

  // Behavior
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;

  // Legacy props for backward compatibility
  label?: string;
  hint?: string;

  // Styling
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Advanced features
  hapticFeedback?: boolean;
  announcePress?: boolean;
  minimumTouchTarget?: boolean;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
  label, // Legacy prop
  hint, // Legacy prop
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  announcePress = false,
  minimumTouchTarget = true,
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const accessibilityConfig = accessibilityService.getAccessibilityConfig();

  // Use legacy props if new props not provided
  const finalAccessibilityLabel =
    accessibilityLabel || label || title || (typeof children === 'string' ? children : 'Button');
  const finalAccessibilityHint = accessibilityHint || hint;

  // Handle press with accessibility features
  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Provide haptic feedback
    if (hapticFeedback) {
      hapticFeedbackService.impact('light');
    }

    // Announce button press for screen readers
    if (announcePress && finalAccessibilityLabel) {
      accessibilityService.announceForAccessibility(`${finalAccessibilityLabel} pressed`);
    }

    // Scale animation for visual feedback
    if (!accessibilityConfig.reducedMotion) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onPress();
  }, [
    disabled,
    loading,
    hapticFeedback,
    announcePress,
    finalAccessibilityLabel,
    accessibilityConfig.reducedMotion,
    scaleAnim,
    onPress,
  ]);

  const handleLongPress = useCallback(() => {
    if (disabled || loading || !onLongPress) return;

    if (hapticFeedback) {
      hapticFeedbackService.impact('medium');
    }

    onLongPress();
  }, [disabled, loading, onLongPress, hapticFeedback]);

  // Get variant-specific styles
  const getVariantStyles = useCallback(() => {
    const colors = accessibilityService.getContrastColors(theme.isDark);

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.border : colors.primary,
          borderColor: colors.primary,
          textColor: disabled ? colors.textSecondary : colors.background,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.surface : colors.secondary,
          borderColor: colors.secondary,
          textColor: disabled ? colors.textSecondary : colors.background,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          textColor: disabled ? colors.textSecondary : colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.surface : colors.error,
          borderColor: colors.error,
          textColor: disabled ? colors.textSecondary : colors.background,
        };
      case 'success':
        return {
          backgroundColor: disabled ? colors.surface : colors.success,
          borderColor: colors.success,
          textColor: disabled ? colors.textSecondary : colors.background,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.background,
        };
    }
  }, [variant, disabled, theme.isDark]);

  // Get size-specific styles
  const getSizeStyles = useCallback(() => {
    const fontScale = accessibilityService.getFontScale();

    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14 * fontScale,
          minHeight: minimumTouchTarget ? 44 : 32,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18 * fontScale,
          minHeight: minimumTouchTarget ? 56 : 48,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16 * fontScale,
          minHeight: minimumTouchTarget ? 48 : 40,
        };
    }
  }, [size, minimumTouchTarget]);

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Accessibility props
  const accessibilityProps = {
    ...AccessibilityUtils.createTouchableProps(
      finalAccessibilityLabel,
      finalAccessibilityHint,
      accessibilityRole,
    ),
    accessibilityState: {
      disabled,
      busy: loading,
      ...accessibilityState,
    },
    testID,
  };

  // Focus handling for keyboard navigation
  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handlePressIn = useCallback(() => {
    setPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  // Render icon based on position
  const renderIcon = () => {
    if (!icon) return null;
    return <View style={styles.iconContainer}>{icon}</View>;
  };

  // Render content based on layout
  const renderContent = () => {
    const isVertical = iconPosition === 'top' || iconPosition === 'bottom';
    const isIconFirst = iconPosition === 'left' || iconPosition === 'top';

    if (isVertical) {
      return (
        <View style={styles.verticalContent}>
          {isIconFirst && renderIcon()}
          <View style={styles.textContainer}>
            {title && (
              <Text
                style={[
                  styles.titleText,
                  {
                    color: variantStyles.textColor,
                    fontSize: sizeStyles.fontSize,
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitleText,
                  {
                    color: variantStyles.textColor,
                    fontSize: sizeStyles.fontSize * 0.85,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
            {!title && !subtitle && (children || label)}
          </View>
          {!isIconFirst && renderIcon()}
        </View>
      );
    }

    return (
      <View style={styles.horizontalContent}>
        {isIconFirst && renderIcon()}
        <View style={styles.textContainer}>
          {title && (
            <Text
              style={[
                styles.titleText,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitleText,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize * 0.85,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
          {!title && !subtitle && (
            <Text
              style={[
                styles.titleText,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {children || label}
            </Text>
          )}
        </View>
        {!isIconFirst && renderIcon()}
      </View>
    );
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth]}>
      <TouchableOpacity
        {...accessibilityProps}
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
          focused && styles.focused,
          pressed && styles.pressed,
          disabled && styles.disabled,
          loading && styles.loading,
          fullWidth && styles.fullWidth,
          style,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        hitSlop={minimumTouchTarget ? { top: 10, bottom: 10, left: 10, right: 10 } : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text
              style={[
                styles.loadingText,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
              ]}
            >
              Loading...
            </Text>
          </View>
        ) : (
          renderContent()
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  focused: {
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  loading: {
    opacity: 0.8,
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 4,
    marginVertical: 2,
  },
  titleText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleText: {
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontWeight: '500',
  },
});

export default React.memo(AccessibleButton);
