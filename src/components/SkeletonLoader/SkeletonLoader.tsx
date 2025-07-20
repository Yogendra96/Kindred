import React, { useEffect, useRef } from 'react';

import type { ColorValue, ViewStyle } from 'react-native';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Types for Skeleton Loader
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: [ColorValue, ColorValue, ColorValue];
  shimmerSpeed?: number;
  shimmerDirection?: 'horizontal' | 'vertical' | 'diagonal';
  children?: React.ReactNode;
  isLoading?: boolean;
  testID?: string;
}

export interface SkeletonLineProps extends SkeletonProps {
  lines?: number;
  lineSpacing?: number;
  lastLineWidth?: number | string;
}

export interface SkeletonCircleProps extends SkeletonProps {
  size?: number;
}

export interface SkeletonImageProps extends SkeletonProps {
  aspectRatio?: number;
}

export interface SkeletonCardProps {
  style?: ViewStyle;
  shimmerColors?: [ColorValue, ColorValue, ColorValue];
  shimmerSpeed?: number;
  isLoading?: boolean;
  children?: React.ReactNode;
  testID?: string;
}

export interface SkeletonListProps {
  itemCount?: number;
  itemHeight?: number;
  itemSpacing?: number;
  renderItem?: (index: number) => React.ReactNode;
  style?: ViewStyle;
  shimmerColors?: [ColorValue, ColorValue, ColorValue];
  shimmerSpeed?: number;
  isLoading?: boolean;
  testID?: string;
}

// Base Skeleton Component
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  shimmerColors = ['#E1E9EE', '#F2F8FC', '#E1E9EE'],
  shimmerSpeed = 1000,
  shimmerDirection = 'horizontal',
  children,
  isLoading = true,
  testID,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: shimmerSpeed,
          useNativeDriver: true,
        }),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading, shimmerAnimation, shimmerSpeed]);

  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  const getShimmerTransform = () => {
    const translateX = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-screenWidth, screenWidth],
    });

    const translateY = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    switch (shimmerDirection) {
      case 'vertical':
        return [{ translateY }];
      case 'diagonal':
        return [{ translateX }, { translateY }];
      default:
        return [{ translateX }];
    }
  };

  const getGradientDirection = () => {
    switch (shimmerDirection) {
      case 'vertical':
        return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
      case 'diagonal':
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
      default:
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
    }
  };

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: shimmerColors[0],
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: getShimmerTransform(),
          },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          style={StyleSheet.absoluteFillObject}
          {...getGradientDirection()}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Line Component
export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  lines = 1,
  lineSpacing = 8,
  lastLineWidth = '60%',
  height = 16,
  borderRadius = 4,
  style,
  shimmerColors,
  shimmerSpeed,
  shimmerDirection,
  isLoading = true,
  children,
  testID,
}) => {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  return (
    <View style={style} testID={testID}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={height}
          borderRadius={borderRadius}
          shimmerColors={shimmerColors}
          shimmerSpeed={shimmerSpeed}
          shimmerDirection={shimmerDirection}
          style={index > 0 ? { marginTop: lineSpacing } : undefined}
        />
      ))}
    </View>
  );
};

// Skeleton Circle Component
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  style,
  shimmerColors,
  shimmerSpeed,
  shimmerDirection,
  isLoading = true,
  children,
  testID,
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      shimmerColors={shimmerColors}
      shimmerSpeed={shimmerSpeed}
      shimmerDirection={shimmerDirection}
      isLoading={isLoading}
      testID={testID}
    >
      {children}
    </Skeleton>
  );
};

// Skeleton Image Component
export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height,
  aspectRatio = 16 / 9,
  borderRadius = 8,
  style,
  shimmerColors,
  shimmerSpeed,
  shimmerDirection,
  isLoading = true,
  children,
  testID,
}) => {
  const calculatedHeight = height || (typeof width === 'number' ? width / aspectRatio : 200);

  return (
    <Skeleton
      width={width}
      height={calculatedHeight}
      borderRadius={borderRadius}
      style={style}
      shimmerColors={shimmerColors}
      shimmerSpeed={shimmerSpeed}
      shimmerDirection={shimmerDirection}
      isLoading={isLoading}
      testID={testID}
    >
      {children}
    </Skeleton>
  );
};

// Skeleton Card Component
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  style,
  shimmerColors,
  shimmerSpeed,
  isLoading = true,
  children,
  testID,
}) => {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      <View style={styles.cardHeader}>
        <SkeletonCircle size={40} shimmerColors={shimmerColors} shimmerSpeed={shimmerSpeed} />
        <View style={styles.cardHeaderText}>
          <Skeleton
            width='70%'
            height={16}
            shimmerColors={shimmerColors}
            shimmerSpeed={shimmerSpeed}
          />
          <Skeleton
            width='50%'
            height={12}
            shimmerColors={shimmerColors}
            shimmerSpeed={shimmerSpeed}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
      <SkeletonImage
        aspectRatio={16 / 9}
        shimmerColors={shimmerColors}
        shimmerSpeed={shimmerSpeed}
        style={{ marginVertical: 12 }}
      />
      <SkeletonLine
        lines={3}
        lastLineWidth='80%'
        shimmerColors={shimmerColors}
        shimmerSpeed={shimmerSpeed}
      />
    </View>
  );
};

// Skeleton List Component
export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 5,
  itemHeight = 80,
  itemSpacing = 12,
  renderItem,
  style,
  shimmerColors,
  shimmerSpeed,
  isLoading = true,
  testID,
}) => {
  if (!isLoading) {
    return null;
  }

  const defaultRenderItem = (index: number) => (
    <View key={index} style={[styles.listItem, { height: itemHeight }]}>
      <SkeletonCircle size={50} shimmerColors={shimmerColors} shimmerSpeed={shimmerSpeed} />
      <View style={styles.listItemContent}>
        <Skeleton
          width='80%'
          height={16}
          shimmerColors={shimmerColors}
          shimmerSpeed={shimmerSpeed}
        />
        <Skeleton
          width='60%'
          height={12}
          shimmerColors={shimmerColors}
          shimmerSpeed={shimmerSpeed}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );

  return (
    <View style={style} testID={testID}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index}>
          {renderItem ? renderItem(index) : defaultRenderItem(index)}
          {index < itemCount - 1 && <View style={{ height: itemSpacing }} />}
        </View>
      ))}
    </View>
  );
};

// Predefined Skeleton Layouts
export const SkeletonLayouts = {
  // Carbon Activity Card
  CarbonActivityCard: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.card, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <View style={styles.activityHeader}>
            <SkeletonCircle size={24} {...props} />
            <Skeleton width='40%' height={16} style={{ marginLeft: 8 }} {...props} />
            <View style={{ flex: 1 }} />
            <Skeleton width={60} height={24} borderRadius={12} {...props} />
          </View>
          <Skeleton width='100%' height={20} style={{ marginVertical: 8 }} {...props} />
          <View style={styles.activityStats}>
            <Skeleton width={80} height={32} borderRadius={16} {...props} />
            <Skeleton width={100} height={32} borderRadius={16} {...props} />
            <Skeleton width={90} height={32} borderRadius={16} {...props} />
          </View>
        </>
      ) : (
        children
      )}
    </View>
  ),

  // User Profile
  UserProfile: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.profileContainer, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <SkeletonCircle size={80} {...props} />
          <Skeleton width={120} height={20} style={{ marginTop: 12 }} {...props} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} {...props} />
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} {...props} />
              <Skeleton width={60} height={12} style={{ marginTop: 4 }} {...props} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} {...props} />
              <Skeleton width={60} height={12} style={{ marginTop: 4 }} {...props} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} {...props} />
              <Skeleton width={60} height={12} style={{ marginTop: 4 }} {...props} />
            </View>
          </View>
        </>
      ) : (
        children
      )}
    </View>
  ),

  // Leaderboard Item
  LeaderboardItem: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.leaderboardItem, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <Skeleton width={24} height={24} borderRadius={12} {...props} />
          <SkeletonCircle size={40} style={{ marginLeft: 12 }} {...props} />
          <View style={styles.leaderboardContent}>
            <Skeleton width='70%' height={16} {...props} />
            <Skeleton width='50%' height={12} style={{ marginTop: 4 }} {...props} />
          </View>
          <Skeleton width={60} height={20} {...props} />
        </>
      ) : (
        children
      )}
    </View>
  ),

  // Achievement Badge
  AchievementBadge: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.achievementBadge, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <SkeletonCircle size={60} {...props} />
          <Skeleton width={80} height={14} style={{ marginTop: 8 }} {...props} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} {...props} />
        </>
      ) : (
        children
      )}
    </View>
  ),

  // Chart Placeholder
  Chart: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.chartContainer, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <Skeleton width='100%' height={200} borderRadius={8} {...props} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <Skeleton width={12} height={12} borderRadius={6} {...props} />
              <Skeleton width={60} height={12} style={{ marginLeft: 8 }} {...props} />
            </View>
            <View style={styles.legendItem}>
              <Skeleton width={12} height={12} borderRadius={6} {...props} />
              <Skeleton width={60} height={12} style={{ marginLeft: 8 }} {...props} />
            </View>
            <View style={styles.legendItem}>
              <Skeleton width={12} height={12} borderRadius={6} {...props} />
              <Skeleton width={60} height={12} style={{ marginLeft: 8 }} {...props} />
            </View>
          </View>
        </>
      ) : (
        children
      )}
    </View>
  ),

  // Navigation Tab
  NavigationTab: ({ isLoading = true, children, ...props }: SkeletonCardProps) => (
    <View style={[styles.navTab, props.style]} testID={props.testID}>
      {isLoading ? (
        <>
          <SkeletonCircle size={24} {...props} />
          <Skeleton width={50} height={12} style={{ marginTop: 4 }} {...props} />
        </>
      ) : (
        children
      )}
    </View>
  ),
};

// Skeleton Provider for consistent theming
export const SkeletonProvider: React.FC<{
  children: React.ReactNode;
  theme?: {
    shimmerColors?: [ColorValue, ColorValue, ColorValue];
    shimmerSpeed?: number;
    shimmerDirection?: 'horizontal' | 'vertical' | 'diagonal';
  };
}> = ({ children, theme: _theme }) => {
  // This could be implemented with React Context for global theming
  // For now, just render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 4,
  },
  leaderboardContent: {
    marginLeft: 12,
    flex: 1,
  },
  achievementBadge: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    minWidth: 100,
  },
  chartContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

export default Skeleton;
