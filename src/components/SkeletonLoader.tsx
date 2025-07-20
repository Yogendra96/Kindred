import React, { useEffect } from 'react';

import type { ViewStyle } from 'react-native';
import { Dimensions, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Props for the base SkeletonLoader component
 */
export interface SkeletonLoaderProps {
  /** Width of the skeleton element */
  width?: number | string;
  /** Height of the skeleton element */
  height?: number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Additional styles to apply */
  style?: ViewStyle;
  /** Children to show when not loading */
  children?: React.ReactNode;
  /** Whether to show skeleton or content */
  isLoading?: boolean;
  /** Duration of shimmer animation in milliseconds */
  animationDuration?: number;
  /** Colors for shimmer gradient */
  shimmerColors?: string[];
  /** Direction of shimmer animation */
  direction?: 'horizontal' | 'vertical';
  /** Intensity of shimmer effect */
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * Props for SkeletonText component
 */
export interface SkeletonTextProps {
  /** Number of text lines to display */
  lines?: number;
  /** Height of each text line */
  lineHeight?: number;
  /** Spacing between lines */
  lineSpacing?: number;
  /** Width of the last line (for natural text appearance) */
  lastLineWidth?: number | string;
  /** Additional styles to apply */
  style?: ViewStyle;
  /** Whether to show skeleton or content */
  isLoading?: boolean;
}

/**
 * Props for SkeletonCircle component
 */
export interface SkeletonCircleProps {
  /** Diameter of the circle */
  size?: number;
  /** Additional styles to apply */
  style?: ViewStyle;
  /** Whether to show skeleton or content */
  isLoading?: boolean;
}

/**
 * Props for SkeletonImage component
 */
export interface SkeletonImageProps {
  /** Width of the image placeholder */
  width?: number | string;
  /** Height of the image placeholder */
  height?: number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Additional styles to apply */
  style?: ViewStyle;
  /** Whether to show skeleton or content */
  isLoading?: boolean;
}

/**
 * Props for SkeletonCard component
 */
export interface SkeletonCardProps {
  /** Additional styles to apply */
  style?: ViewStyle;
  /** Whether to show skeleton or content */
  isLoading?: boolean;
  /** Show avatar section */
  showAvatar?: boolean;
  /** Show title section */
  showTitle?: boolean;
  /** Show subtitle section */
  showSubtitle?: boolean;
  /** Show content section */
  showContent?: boolean;
  /** Show actions section */
  showActions?: boolean;
  /** Size of the avatar */
  avatarSize?: number;
  /** Number of title lines */
  titleLines?: number;
  /** Number of content lines */
  contentLines?: number;
}

/**
 * Base Skeleton Loader Component
 *
 * Displays an animated shimmer effect while content is loading.
 * Can be used standalone or as a building block for other skeleton components.
 *
 * @example
 * ```tsx
 * <SkeletonLoader width={200} height={20} />
 * <SkeletonLoader isLoading={loading}>
 *   <Text>Content to show when loaded</Text>
 * </SkeletonLoader>
 * ```
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
  isLoading = true,
  animationDuration = 1500,
  shimmerColors = ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
  direction = 'horizontal',
  intensity = 'medium',
}) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => {
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

  const getIntensityColors = () => {
    switch (intensity) {
      case 'low':
        return ['#f8f8f8', '#f0f0f0', '#f8f8f8'];
      case 'high':
        return ['#e8e8e8', '#d0d0d0', '#e8e8e8'];
      default:
        return shimmerColors;
    }
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
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
        <LinearGradient
          colors={getIntensityColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Text Component
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  lineSpacing = 8,
  lastLineWidth = '60%',
  style,
  isLoading = true,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={index < lines - 1 ? { marginBottom: lineSpacing } : undefined}
          isLoading={isLoading}
          {...props}
        />
      ))}
    </View>
  );
};

// Skeleton Circle Component
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  style,
  isLoading = true,
  ...props
}) => {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      isLoading={isLoading}
      {...props}
    />
  );
};

// Skeleton Image Component
export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height = 200,
  borderRadius = 8,
  style,
  isLoading = true,
  ...props
}) => {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      isLoading={isLoading}
      {...props}
    />
  );
};

// Skeleton Card Component
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  style,
  isLoading = true,
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showContent = true,
  showActions = true,
  avatarSize = 40,
  titleLines = 1,
  contentLines = 3,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.card, style]}>
      {/* Header with Avatar and Title */}
      {(showAvatar || showTitle || showSubtitle) && (
        <View style={styles.cardHeader}>
          {showAvatar && <SkeletonCircle size={avatarSize} isLoading={isLoading} {...props} />}
          <View style={styles.cardHeaderText}>
            {showTitle && (
              <SkeletonText
                lines={titleLines}
                lineHeight={18}
                lineSpacing={4}
                lastLineWidth='80%'
                isLoading={isLoading}
                {...props}
              />
            )}
            {showSubtitle && (
              <SkeletonLoader
                width='60%'
                height={14}
                style={styles.cardSubtitle}
                isLoading={isLoading}
                {...props}
              />
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {showContent && (
        <View style={styles.cardContent}>
          <SkeletonText
            lines={contentLines}
            lineHeight={16}
            lineSpacing={6}
            lastLineWidth='70%'
            isLoading={isLoading}
            {...props}
          />
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.cardActions}>
          <SkeletonLoader
            width={80}
            height={32}
            borderRadius={16}
            isLoading={isLoading}
            {...props}
          />
          <SkeletonLoader
            width={100}
            height={32}
            borderRadius={16}
            isLoading={isLoading}
            {...props}
          />
        </View>
      )}
    </View>
  );
};

// Skeleton List Component
export interface SkeletonListProps {
  itemCount?: number;
  itemHeight?: number;
  itemSpacing?: number;
  showSeparator?: boolean;
  style?: ViewStyle;
  isLoading?: boolean;
  renderItem?: (index: number) => React.ReactNode;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 5,
  itemHeight: _itemHeight = 60,
  itemSpacing = 12,
  showSeparator = false,
  style,
  isLoading = true,
  renderItem,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index}>
          {renderItem ? (
            renderItem(index)
          ) : (
            <View style={styles.listItem}>
              <SkeletonCircle size={40} isLoading={isLoading} {...props} />
              <View style={styles.listItemContent}>
                <SkeletonLoader width='80%' height={16} isLoading={isLoading} {...props} />
                <SkeletonLoader
                  width='60%'
                  height={12}
                  style={styles.listItemSubtitle}
                  isLoading={isLoading}
                  {...props}
                />
              </View>
            </View>
          )}
          {showSeparator && index < itemCount - 1 && <View style={styles.separator} />}
          {!showSeparator && index < itemCount - 1 && <View style={{ height: itemSpacing }} />}
        </View>
      ))}
    </View>
  );
};

// Skeleton Grid Component
export interface SkeletonGridProps {
  itemCount?: number;
  columns?: number;
  itemAspectRatio?: number;
  itemSpacing?: number;
  style?: ViewStyle;
  isLoading?: boolean;
  renderItem?: (index: number) => React.ReactNode;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  itemCount = 6,
  columns = 2,
  itemAspectRatio = 1,
  itemSpacing = 12,
  style,
  isLoading = true,
  renderItem,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  const itemWidth = (screenWidth - 32 - (columns - 1) * itemSpacing) / columns;
  const itemHeight = itemWidth / itemAspectRatio;

  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: itemCount }).map((_, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        return (
          <View
            key={index}
            style={[
              styles.gridItem,
              {
                width: itemWidth,
                height: itemHeight,
                marginRight: col < columns - 1 ? itemSpacing : 0,
                marginBottom: row < Math.ceil(itemCount / columns) - 1 ? itemSpacing : 0,
              },
            ]}
          >
            {renderItem ? (
              renderItem(index)
            ) : (
              <SkeletonLoader
                width='100%'
                height='100%'
                borderRadius={8}
                isLoading={isLoading}
                {...props}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

// Skeleton Chart Component
export interface SkeletonChartProps {
  width?: number | string;
  height?: number;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  style?: ViewStyle;
  isLoading?: boolean;
}

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  width = '100%',
  height = 200,
  chartType = 'line',
  style,
  isLoading = true,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  const renderChartSkeleton = () => {
    switch (chartType) {
      case 'pie':
        return (
          <View style={styles.pieChart}>
            <SkeletonCircle size={height * 0.8} isLoading={isLoading} {...props} />
          </View>
        );
      case 'bar':
        return (
          <View style={styles.barChart}>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader
                key={index}
                width={20}
                height={Math.random() * (height * 0.6) + height * 0.2}
                borderRadius={2}
                isLoading={isLoading}
                {...props}
              />
            ))}
          </View>
        );
      default:
        return (
          <SkeletonLoader
            width={width}
            height={height}
            borderRadius={8}
            isLoading={isLoading}
            {...props}
          />
        );
    }
  };

  return <View style={[{ width, height }, style]}>{renderChartSkeleton()}</View>;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardSubtitle: {
    marginTop: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    width: '100%',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemSubtitle: {
    marginTop: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridItem: {
    // Dynamic styles applied inline
  },
  pieChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 20,
  },
});

export default SkeletonLoader;
