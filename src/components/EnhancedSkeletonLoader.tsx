import { useTheme } from '../theme/ThemeProvider';
import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';

interface EnhancedSkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'list' | 'chart';
  width?: number | string;
  height?: number;
  lines?: number;
  spacing?: number;
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  customStyle?: Record<string, unknown>;
  children?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

const EnhancedSkeletonLoader: React.FC<EnhancedSkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height = 20,
  lines = 1,
  spacing = 8,
  animation = 'shimmer',
  accessibilityLabel,
  accessibilityHint,
  testID,
  customStyle,
  children,
}) => {
  const { theme, isDark } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] =
    React.useState(false);

  React.useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );

    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    if (animation === 'none' || isScreenReaderEnabled) return;

    const createAnimation = () => {
      switch (animation) {
        case 'pulse':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          );
        case 'wave':
        case 'shimmer':
        default:
          return Animated.loop(
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          );
      }
    };

    const animationLoop = createAnimation();
    animationLoop.start();

    return () => animationLoop.stop();
  }, [animation, animatedValue, isScreenReaderEnabled]);

  const getSkeletonStyle = () => {
    const baseStyle = {
      backgroundColor: isDark ? theme.colors.surface : '#E1E9EE',
      borderRadius: 4,
    };

    if (animation === 'none' || isScreenReaderEnabled) {
      return baseStyle;
    }

    const animatedStyle = {
      opacity:
        animation === 'pulse'
          ? animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            })
          : 0.7,
    };

    if (animation === 'shimmer' || animation === 'wave') {
      const _translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-screenWidth, screenWidth],
      });

      return {
        ...baseStyle,
        overflow: 'hidden',
        position: 'relative',
      };
    }

    return { ...baseStyle, ...animatedStyle };
  };

  const renderShimmerOverlay = () => {
    if (animation !== 'shimmer' && animation !== 'wave') return null;
    if (isScreenReaderEnabled) return null;

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-screenWidth, screenWidth],
    });

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.8)',
            transform: [{ translateX }],
          },
        ]}
      />
    );
  };

  const renderVariant = () => {
    switch (variant) {
      case 'circular':
        return (
          <Animated.View
            style={[
              getSkeletonStyle(),
              {
                width: height,
                height: height,
                borderRadius: height / 2,
              },
              customStyle,
            ]}
            accessible={true}
            accessibilityLabel={
              accessibilityLabel || 'Loading circular content'
            }
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            {renderShimmerOverlay()}
          </Animated.View>
        );

      case 'rectangular':
        return (
          <Animated.View
            style={[
              getSkeletonStyle(),
              {
                width,
                height,
              },
              customStyle,
            ]}
            accessible={true}
            accessibilityLabel={
              accessibilityLabel || 'Loading rectangular content'
            }
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            {renderShimmerOverlay()}
          </Animated.View>
        );

      case 'card':
        return (
          <View
            style={[
              styles.cardContainer,
              { backgroundColor: theme.colors.surface },
              customStyle,
            ]}
            accessible={true}
            accessibilityLabel={accessibilityLabel || 'Loading card content'}
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            <Animated.View style={[getSkeletonStyle(), styles.cardHeader]}>
              {renderShimmerOverlay()}
            </Animated.View>
            <View style={styles.cardBody}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    getSkeletonStyle(),
                    styles.cardLine,
                    { width: index === 2 ? '60%' : '100%' },
                  ]}
                >
                  {renderShimmerOverlay()}
                </Animated.View>
              ))}
            </View>
          </View>
        );

      case 'list':
        return (
          <View
            accessible={true}
            accessibilityLabel={accessibilityLabel || 'Loading list content'}
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            {Array.from({ length: lines }).map((_, index) => (
              <View
                key={index}
                style={[styles.listItem, { marginBottom: spacing }]}
              >
                <Animated.View style={[getSkeletonStyle(), styles.listAvatar]}>
                  {renderShimmerOverlay()}
                </Animated.View>
                <View style={styles.listContent}>
                  <Animated.View style={[getSkeletonStyle(), styles.listTitle]}>
                    {renderShimmerOverlay()}
                  </Animated.View>
                  <Animated.View
                    style={[getSkeletonStyle(), styles.listSubtitle]}
                  >
                    {renderShimmerOverlay()}
                  </Animated.View>
                </View>
              </View>
            ))}
          </View>
        );

      case 'chart':
        return (
          <View
            style={[styles.chartContainer, customStyle]}
            accessible={true}
            accessibilityLabel={accessibilityLabel || 'Loading chart content'}
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            <Animated.View style={[getSkeletonStyle(), styles.chartCircle]}>
              {renderShimmerOverlay()}
            </Animated.View>
            <View style={styles.chartLegend}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.legendItem}>
                  <Animated.View
                    style={[getSkeletonStyle(), styles.legendColor]}
                  >
                    {renderShimmerOverlay()}
                  </Animated.View>
                  <Animated.View
                    style={[getSkeletonStyle(), styles.legendText]}
                  >
                    {renderShimmerOverlay()}
                  </Animated.View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'text':
      default:
        return (
          <View
            accessible={true}
            accessibilityLabel={accessibilityLabel || 'Loading text content'}
            accessibilityHint={accessibilityHint}
            accessibilityRole='progressbar'
            testID={testID}
          >
            {Array.from({ length: lines }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  getSkeletonStyle(),
                  {
                    width: index === lines - 1 ? '70%' : width,
                    height,
                    marginBottom: index < lines - 1 ? spacing : 0,
                  },
                  customStyle,
                ]}
              >
                {renderShimmerOverlay()}
              </Animated.View>
            ))}
          </View>
        );
    }
  };

  if (children) {
    return <View style={customStyle}>{children}</View>;
  }

  return renderVariant();
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    height: 120,
    marginBottom: 12,
    borderRadius: 8,
  },
  cardBody: {
    gap: 8,
  },
  cardLine: {
    height: 16,
    borderRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
  listTitle: {
    height: 16,
    width: '80%',
    borderRadius: 4,
  },
  listSubtitle: {
    height: 12,
    width: '60%',
    borderRadius: 4,
  },
  chartContainer: {
    alignItems: 'center',
    padding: 16,
  },
  chartCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  chartLegend: {
    width: '100%',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    height: 14,
    width: 80,
    borderRadius: 4,
  },
});

export default EnhancedSkeletonLoader;
