// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Modern Button Component
 * Ultra-comprehensive, accessible, and beautiful button with micro-interactions
 * Features: Haptic feedback, animations, accessibility, responsive design
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import type {
  AccessibilityRole,
  AccessibilityState,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { Theme } from '../../design-system/ModernDesignSystem';
import { ModernDesignSystem } from '../../design-system/ModernDesignSystem';
import { hapticFeedbackService } from '../../services/HapticFeedbackService';
import analyticsService from '../../services/AnalyticsService';

// Advanced Button Configuration
export interface ModernButtonProps {
  // Content
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  badge?: string | number;

  // Behavior
  onPress: () => void | Promise<void>;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;

  // Styling
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  rounded?: boolean;
  elevated?: boolean;
  gradient?: boolean;

  // Advanced Features
  hapticFeedback?: boolean;
  pressAnimation?: 'scale' | 'opacity' | 'bounce' | 'none';
  rippleEffect?: boolean;
  glowEffect?: boolean;
  shimmerEffect?: boolean;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;

  // Responsive
  responsiveSize?: {
    sm?: ModernButtonProps['size'];
    md?: ModernButtonProps['size'];
    lg?: ModernButtonProps['size'];
    xl?: ModernButtonProps['size'];
  };

  // Custom Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconStyle?: ViewStyle;

  // Theme
  theme?: Theme;
}

// Button Variants Configuration
const getVariantStyles = (
  variant: NonNullable<ModernButtonProps['variant']>,
  theme: Theme,
  disabled: boolean,
) => {
  const variants = {
    primary: {
      backgroundColor: disabled
        ? theme.colors.borderLight
        : theme.colors.primary,
      borderColor: disabled ? theme.colors.borderLight : theme.colors.primary,
      textColor: disabled
        ? theme.colors.textTertiary
        : theme.colors.textInverse,
      shadowColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: disabled ? theme.colors.borderLight : theme.colors.primary,
      textColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
      shadowColor: theme.colors.primary,
    },
    tertiary: {
      backgroundColor: disabled
        ? theme.colors.borderLight
        : theme.colors.backgroundSecondary,
      borderColor: disabled ? theme.colors.borderLight : theme.colors.border,
      textColor: disabled ? theme.colors.textTertiary : theme.colors.text,
      shadowColor: theme.colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
      shadowColor: 'transparent',
    },
    danger: {
      backgroundColor: disabled ? theme.colors.borderLight : theme.colors.error,
      borderColor: disabled ? theme.colors.borderLight : theme.colors.error,
      textColor: disabled
        ? theme.colors.textTertiary
        : theme.colors.textInverse,
      shadowColor: theme.colors.error,
    },
    success: {
      backgroundColor: disabled
        ? theme.colors.borderLight
        : theme.colors.success,
      borderColor: disabled ? theme.colors.borderLight : theme.colors.success,
      textColor: disabled
        ? theme.colors.textTertiary
        : theme.colors.textInverse,
      shadowColor: theme.colors.success,
    },
    warning: {
      backgroundColor: disabled
        ? theme.colors.borderLight
        : theme.colors.warning,
      borderColor: disabled ? theme.colors.borderLight : theme.colors.warning,
      textColor: disabled
        ? theme.colors.textTertiary
        : theme.colors.textInverse,
      shadowColor: theme.colors.warning,
    },
  };

  return variants[variant];
};

// Size Configuration
const getSizeStyles = (
  size: NonNullable<ModernButtonProps['size']>,
  theme: Theme,
) => {
  const sizes = {
    xs: {
      paddingVertical: theme.spacing[1],
      paddingHorizontal: theme.spacing[2],
      fontSize: theme.typography.fontSize.xs,
      iconSize: 12,
      minHeight: 28,
      borderRadius: theme.borderRadius.sm,
    },
    sm: {
      paddingVertical: theme.spacing[2],
      paddingHorizontal: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      iconSize: 16,
      minHeight: 36,
      borderRadius: theme.borderRadius.base,
    },
    md: {
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.base,
      iconSize: 20,
      minHeight: 44,
      borderRadius: theme.borderRadius.base,
    },
    lg: {
      paddingVertical: theme.spacing[4],
      paddingHorizontal: theme.spacing[6],
      fontSize: theme.typography.fontSize.lg,
      iconSize: 24,
      minHeight: 52,
      borderRadius: theme.borderRadius.md,
    },
    xl: {
      paddingVertical: theme.spacing[5],
      paddingHorizontal: theme.spacing[8],
      fontSize: theme.typography.fontSize.xl,
      iconSize: 28,
      minHeight: 60,
      borderRadius: theme.borderRadius.lg,
    },
  };

  return sizes[size];
};

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  badge,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  rounded = false,
  elevated = false,
  gradient = false,
  hapticFeedback = true,
  pressAnimation = 'scale',
  rippleEffect = true,
  glowEffect = false,
  shimmerEffect = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
  responsiveSize,
  style,
  textStyle,
  iconStyle,
  theme = ModernDesignSystem.LightTheme,
}) => {
  // State management
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);

  // Animation references
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Responsive size calculation
  const responsiveActualSize =
    ModernDesignSystem.ResponsiveUtils.getResponsiveValue(
      responsiveSize || {},
      size,
    );

  // Style calculations
  const variantStyles = getVariantStyles(variant, theme, disabled || isLoading);
  const sizeStyles = getSizeStyles(responsiveActualSize, theme);

  // Update loading state when prop changes
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  // Initialize animations
  useEffect(() => {
    if (glowEffect) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: theme.motion.duration.slow,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: theme.motion.duration.slow,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }

    if (shimmerEffect) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: theme.motion.duration.slower,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [glowEffect, shimmerEffect, glowAnim, shimmerAnim, theme.motion.duration]);

  // Handle press with comprehensive feedback
  const handlePress = useCallback(async () => {
    if (disabled || isLoading) return;

    // Haptic feedback
    if (hapticFeedback) {
      hapticFeedbackService.impact('light');
    }

    // Press animation
    if (pressAnimation !== 'none') {
      const animations = [];

      if (pressAnimation === 'scale') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
        );
      } else if (pressAnimation === 'opacity') {
        animations.push(
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
        );
      } else if (pressAnimation === 'bounce') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
        );
      }

      if (rippleEffect) {
        animations.push(
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: theme.motion.duration.normal,
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(animations).start(() => {
        // Reset animations
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: theme.motion.duration.fast,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }

    // Track button interaction
    analyticsService.trackUserAction('button_press', 'current', {
      variant,
      size: responsiveActualSize,
      disabled,
      loading: isLoading,
    });

    try {
      // Handle async operations
      if (onPress.constructor.name === 'AsyncFunction') {
        setIsLoading(true);
        await onPress();
        setIsLoading(false);
      } else {
        onPress();
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Button press error:', error);
    }
  }, [
    disabled,
    isLoading,
    hapticFeedback,
    pressAnimation,
    rippleEffect,
    scaleAnim,
    opacityAnim,
    rippleAnim,
    theme.motion.duration,
    onPress,
    variant,
    responsiveActualSize,
  ]);

  const handleLongPress = useCallback(() => {
    if (disabled || isLoading || !onLongPress) return;

    if (hapticFeedback) {
      hapticFeedbackService.impact('medium');
    }

    onLongPress();
  }, [disabled, isLoading, onLongPress, hapticFeedback]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityRole,
    accessibilityLabel:
      accessibilityLabel ||
      title ||
      (typeof children === 'string' ? children : 'Button'),
    accessibilityHint,
    accessibilityState: {
      disabled: disabled || isLoading,
      busy: isLoading,
      ...accessibilityState,
    },
    testID,
  };

  // Dynamic styles
  const buttonStyle: ViewStyle = {
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variant === 'ghost' ? 0 : 1,
    borderRadius: rounded ? theme.borderRadius.full : sizeStyles.borderRadius,
    paddingVertical: sizeStyles.paddingVertical,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    minHeight: sizeStyles.minHeight,
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    flexDirection:
      iconPosition === 'top' || iconPosition === 'bottom' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...(elevated && theme.shadows.md),
    ...(isFocused && {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    }),
    ...(glowEffect && {
      shadowColor: variantStyles.shadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowAnim,
      shadowRadius: 10,
      elevation: 8,
    }),
  };

  const textStyles: TextStyle = {
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
    ...(subtitle && { marginBottom: theme.spacing[1] }),
  };

  const subtitleStyles: TextStyle = {
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize * 0.8,
    fontFamily: theme.typography.fontFamily.secondary,
    fontWeight: theme.typography.fontWeight.regular,
    opacity: 0.8,
    textAlign: 'center',
  };

  // Content rendering
  const renderIcon = () => {
    if (!icon) return null;

    return (
      <View
        style={[
          {
            marginRight: iconPosition === 'right' ? 0 : theme.spacing[2],
            marginLeft: iconPosition === 'right' ? theme.spacing[2] : 0,
            marginBottom:
              iconPosition === 'bottom'
                ? 0
                : iconPosition === 'top'
                ? theme.spacing[1]
                : 0,
            marginTop: iconPosition === 'bottom' ? theme.spacing[1] : 0,
          },
          iconStyle,
        ]}
      >
        {icon}
      </View>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;

    return (
      <View
        style={{
          position: 'absolute',
          top: -theme.spacing[1],
          right: -theme.spacing[1],
          backgroundColor: theme.colors.error,
          borderRadius: theme.borderRadius.full,
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing[1],
        }}
      >
        <Text
          style={{
            color: theme.colors.textInverse,
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.bold,
          }}
        >
          {badge}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator
            size='small'
            color={variantStyles.textColor}
            style={{ marginRight: theme.spacing[2] }}
          />
          <Text style={[textStyles, textStyle]}>{loadingText}</Text>
        </View>
      );
    }

    const isVertical = iconPosition === 'top' || iconPosition === 'bottom';
    const isIconFirst = iconPosition === 'left' || iconPosition === 'top';

    return (
      <View
        style={{
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isIconFirst && renderIcon()}

        <View style={{ alignItems: 'center' }}>
          {title && (
            <Text style={[textStyles, textStyle]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[subtitleStyles]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {!title && !subtitle && children && (
            <Text style={[textStyles, textStyle]} numberOfLines={1}>
              {children}
            </Text>
          )}
        </View>

        {!isIconFirst && renderIcon()}
      </View>
    );
  };

  const renderShimmer = () => {
    if (!shimmerEffect) return null;

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 200],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  const renderRipple = () => {
    if (!rippleEffect || !isPressed) return null;

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: rounded
              ? theme.borderRadius.full
              : sizeStyles.borderRadius,
            transform: [
              {
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2],
                }),
              },
            ],
            opacity: rippleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      />
    );
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        {...accessibilityProps}
        style={[buttonStyle, style]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        hitSlop={{
          top: theme.spacing[2],
          bottom: theme.spacing[2],
          left: theme.spacing[2],
          right: theme.spacing[2],
        }}
      >
        {renderRipple()}
        {renderContent()}
        {renderBadge()}
        {renderShimmer()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ModernButton;
