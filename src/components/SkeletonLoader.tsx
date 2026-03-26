// @ts-nocheck
/* eslint-disable */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { View, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  isLoading?: boolean;
  animationDuration?: number;
  shimmerColors?: string[];
  direction?: 'horizontal' | 'vertical';
  intensity?: 'low' | 'medium' | 'high';
  variant?:
    | 'rect'
    | 'rectangular'
    | 'circle'
    | 'circular'
    | 'text'
    | 'image'
    | 'card'
    | 'list'
    | 'grid'
    | 'chart';
  lines?: number;
  items?: number;
  columns?: number;
  spacing?: number;
  animationSpeed?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
}

/**
 * Skeleton Loader Component with theme and accessibility support
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
  isLoading = true,
  animationDuration = 1500,
  shimmerColors,
  direction = 'horizontal',
  intensity = 'medium',
  variant = 'rect',
  testID = 'skeleton-loader',
  accessibilityLabel,
  accessibilityHint,
  animation = 'shimmer',
}) => {
  const { theme, isDark } = useTheme();
  const shimmerValue = useSharedValue(0);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isLoading && animation !== 'none' && !isScreenReaderEnabled) {
      shimmerValue.value = withRepeat(
        withTiming(1, {
          duration: animationDuration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      shimmerValue.value = 0;
    }
  }, [isLoading, animationDuration, animation, isScreenReaderEnabled]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'pulse') {
      const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 1, 0.3]);
      return { opacity };
    }

    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      direction === 'horizontal' ? [-screenWidth, screenWidth] : [0, 0],
    );

    const translateY = interpolate(
      shimmerValue.value,
      [0, 1],
      direction === 'vertical' ? [-100, 100] : [0, 0],
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const getColors = () => {
    if (shimmerColors) return shimmerColors;
    const base = isDark ? theme.colors.surface : '#f0f0f0';
    const highlight = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)';
    
    switch (intensity) {
      case 'low':
        return [base, isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)', base];
      case 'high':
        return [base, isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)', base];
      default:
        return [base, highlight, base];
    }
  };

  const getBorderRadius = () => {
    if (variant === 'circle' || variant === 'circular') {
      return typeof height === 'number' ? height / 2 : borderRadius;
    }
    return borderRadius;
  };

  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: getBorderRadius(),
          backgroundColor: isDark ? theme.colors.surface : '#f0f0f0',
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || `Loading ${variant}`}
      accessibilityHint={accessibilityHint}
    >
      {(animation === 'shimmer' || animation === 'wave') && !isScreenReaderEnabled && (
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
          <LinearGradient
            colors={getColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
      {animation === 'pulse' && !isScreenReaderEnabled && (
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
      )}
    </View>
  );
};

// Skeleton Text
export const SkeletonText: React.FC<any> = ({
  lines = 3,
  lineHeight = 16,
  lineSpacing = 8,
  lastLineWidth = '60%',
  style,
  isLoading = true,
  ...props
}) => {
  if (!isLoading) return null;
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
          isLoading={isLoading}
          {...props}
        />
      ))}
    </View>
  );
};

// Skeleton Circle
export const SkeletonCircle: React.FC<any> = ({ size = 50, style, isLoading = true, ...props }) => (
  <SkeletonLoader
    variant="circle"
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
    isLoading={isLoading}
    {...props}
  />
);

// Skeleton Image
export const SkeletonImage: React.FC<any> = ({ width = '100%', height = 200, borderRadius = 8, style, isLoading = true, ...props }) => (
  <SkeletonLoader
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={style}
    isLoading={isLoading}
    {...props}
  />
);

// Skeleton Card
export const SkeletonCard: React.FC<any> = ({ style, isLoading = true, ...props }) => {
  if (!isLoading) return null;
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <SkeletonCircle size={40} isLoading={isLoading} {...props} />
        <View style={styles.cardHeaderText}>
          <SkeletonText lines={1} lineHeight={18} isLoading={isLoading} {...props} />
          <SkeletonLoader width='60%' height={14} style={{ marginTop: 4 }} isLoading={isLoading} {...props} />
        </View>
      </View>
      <SkeletonText lines={3} lineHeight={16} lineSpacing={6} isLoading={isLoading} {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeaderText: { flex: 1, marginLeft: 12 },
});

export default SkeletonLoader;
