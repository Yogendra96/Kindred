import HapticFeedbackService from '../services/HapticFeedbackService';
import { useTheme } from '../theme/ThemeProvider';
import React, { useRef, /* useCallback, */ useEffect } from 'react';
import { Animated, TouchableOpacity, View, Text } from 'react-native';
import type { TouchableOpacityProps, ViewStyle } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

// Enhanced TouchableOpacity with micro-interactions
interface AnimatedTouchableProps extends TouchableOpacityProps {
  scaleValue?: number;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  animationType?: 'scale' | 'bounce' | 'pulse' | 'lift' | 'ripple';
  rippleColor?: string;
  children: React.ReactNode;
}

export const AnimatedTouchable: React.FC<AnimatedTouchableProps> = ({
  scaleValue = 0.95,
  hapticType = 'light',
  animationType = 'scale',
  rippleColor,
  onPress,
  onPressIn,
  onPressOut,
  style,
  children,
  disabled,
  ...props
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = (event: Record<string, unknown>) => {
    if (disabled) return;

    // Trigger haptic feedback
    if (hapticType !== 'none') {
      switch (hapticType) {
        case 'light':
          HapticFeedbackService.triggerImpact('light');
          break;
        case 'medium':
          HapticFeedbackService.triggerImpact('medium');
          break;
        case 'heavy':
          HapticFeedbackService.triggerImpact('heavy');
          break;
        case 'selection':
          HapticFeedbackService.triggerSelection();
          break;
      }
    }

    // Animate based on type
    switch (animationType) {
      case 'scale':
        Animated.spring(scaleAnim, {
          toValue: scaleValue,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }).start();
        break;
      case 'bounce':
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: scaleValue,
            useNativeDriver: true,
            tension: 400,
            friction: 3,
          }),
        ]).start();
        break;
      case 'pulse':
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'lift':
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.02,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
          Animated.timing(elevationAnim, {
            toValue: 8,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
        break;
      case 'ripple':
        rippleAnim.setValue(0);
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
    }

    onPressIn?.(event);
  };

  const handlePressOut = (event: Record<string, unknown>) => {
    if (disabled) return;

    // Reset animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();

    onPressOut?.(event);
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
    elevation: elevationAnim,
    shadowOffset: {
      width: 0,
      height: elevationAnim,
    },
    shadowOpacity: elevationAnim.interpolate({
      inputRange: [0, 8],
      outputRange: [0, 0.2],
    }),
    shadowRadius: elevationAnim.interpolate({
      inputRange: [0, 8],
      outputRange: [0, 4],
    }),
  };

  const rippleStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: rippleColor || theme.colors.primary,
    opacity: rippleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.2, 0],
    }),
    transform: [
      {
        scale: rippleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 2],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      {...props}
      style={[style, { overflow: 'hidden' }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={animatedStyle}>
        {animationType === 'ripple' && <Animated.View style={rippleStyle} />}
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: ViewStyle;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  style,
  leftAction,
  rightAction,
  disabled = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (disabled) return;

    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const shouldSwipe =
        Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > 500;

      if (shouldSwipe) {
        const direction = translationX > 0 ? 'right' : 'left';
        const toValue = direction === 'right' ? 300 : -300;

        // Trigger haptic feedback
        HapticFeedbackService.triggerImpact('medium');

        // Animate out
        Animated.parallel([
          Animated.timing(translateX, {
            toValue,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Call appropriate callback
          if (direction === 'right' && onSwipeRight) {
            onSwipeRight();
          } else if (direction === 'left' && onSwipeLeft) {
            onSwipeLeft();
          }

          // Reset position
          translateX.setValue(0);
          opacity.setValue(1);
          scale.setValue(1);
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }).start();
      }
    }
  };

  const cardStyle = {
    transform: [
      { translateX },
      { scale },
      {
        rotate: translateX.interpolate({
          inputRange: [-300, 0, 300],
          outputRange: ['-10deg', '0deg', '10deg'],
        }),
      },
    ],
    opacity,
  };

  const leftActionStyle = {
    opacity: translateX.interpolate({
      inputRange: [0, swipeThreshold],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  };

  const rightActionStyle = {
    opacity: translateX.interpolate({
      inputRange: [-swipeThreshold, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
  };

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Left action */}
      {leftAction && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              paddingLeft: 20,
            },
            leftActionStyle,
          ]}
        >
          {leftAction}
        </Animated.View>
      )}

      {/* Right action */}
      {rightAction && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              paddingRight: 20,
            },
            rightActionStyle,
          ]}
        >
          {rightAction}
        </Animated.View>
      )}

      {/* Card content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={!disabled}
      >
        <Animated.View style={cardStyle}>{children}</Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Floating Action Button with micro-interactions
interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
  disabled?: boolean;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  size = 56,
  backgroundColor,
  position = 'bottom-right',
  offset = 16,
  disabled = false,
  testID,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    if (disabled) return;

    HapticFeedbackService.triggerImpact('medium');

    // Rotation animation
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: offset, right: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'top-right':
        return { top: offset, right: offset };
      case 'top-left':
        return { top: offset, left: offset };
      default:
        return { bottom: offset, right: offset };
    }
  };

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        getPositionStyle(),
        animatedStyle,
      ]}
    >
      <AnimatedTouchable
        onPress={handlePress}
        disabled={disabled}
        hapticType='none' // We handle haptics manually
        animationType='scale'
        scaleValue={0.9}
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: size / 2,
        }}
        testID={testID}
        accessible={true}
        accessibilityRole='button'
        accessibilityLabel='Floating action button'
      >
        {icon}
      </AnimatedTouchable>
    </Animated.View>
  );
};

// Progress indicator with smooth animations
interface AnimatedProgressProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  animated?: boolean;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  borderRadius = 4,
  animated = true,
  showPercentage = false,
  style,
}) => {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={style}>
      <View
        style={{
          height,
          backgroundColor: backgroundColor || theme.colors.surfaceVariant,
          borderRadius,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: progressWidth,
            backgroundColor: progressColor || theme.colors.primary,
            borderRadius,
          }}
        />
      </View>
      {showPercentage && (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 4,
            fontSize: 12,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};
