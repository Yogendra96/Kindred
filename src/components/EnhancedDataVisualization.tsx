import React, { useEffect, useRef, useState } from 'react';

import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  // TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/ThemeProvider';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

import { HapticFeedbackService } from '../services/HapticFeedbackService';

import EnhancedSkeletonLoader from './EnhancedSkeletonLoader';
import { AnimatedTouchable } from './MicroInteractions';

const COLORS = {
  black: '#000',
  blackTransparent05: 'rgba(0,0,0,0.05)',
  blackTransparent10: 'rgba(0,0,0,0.1)',
};

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface LineDataPoint {
  x: number;
  y: number;
  label?: string;
}

interface EnhancedChartProps {
  title?: string;
  subtitle?: string;
  data: DataPoint[] | LineDataPoint[];
  type: 'pie' | 'line' | 'bar';
  loading?: boolean;
  error?: string;
  onDataPointPress?: (dataPoint: unknown, index: number) => void;
  showLegend?: boolean;
  showValues?: boolean;
  animated?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  customColors?: string[];
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  formatValue?: (value: number) => string;
  unit?: string;
}

export const EnhancedDataVisualization: React.FC<EnhancedChartProps> = ({
  title,
  subtitle,
  data,
  type,
  loading = false,
  error,
  onDataPointPress,
  showLegend = true,
  showValues = true,
  _animated = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  customColors,
  height = 220,
  showGrid = true,
  showAxis = true,
  formatValue,
  unit = '',
}) => {
  const { theme, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!loading && data.length > 0) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // fadeAnim and scaleAnim are refs and don't change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data]);

  const defaultColors = [
    theme.colors.primary,
    theme.colors.secondary,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
  ];

  const colors = customColors ?? defaultColors;

  const formatValueDisplay = (value: number): string => {
    if (formatValue) {
      return formatValue(value);
    }
    return `${value.toLocaleString()}${unit}`;
  };

  const handleDataPointPress = (dataPoint: unknown, index: number) => {
    HapticFeedbackService.triggerSelection();
    setSelectedIndex(index);
    onDataPointPress?.(dataPoint, index);

    // Animate selection
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
  };

  const getChartConfig = () => {
    return {
      backgroundColor: 'transparent',
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      color: (_opacity = 1) =>
        `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.7,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
      style: {
        borderRadius: 16,
      },
      propsForLabels: {
        fontSize: 12,
        fontWeight: '500',
      },
      propsForVerticalLabels: {
        fontSize: 10,
      },
      propsForHorizontalLabels: {
        fontSize: 10,
      },
    };
  };

  const renderPieChart = () => {
    const pieData = (data as DataPoint[]).map((item, index) => ({
      ...item,
      color: item.color ?? colors[index % colors.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          width={chartWidth}
          height={height}
          chartConfig={getChartConfig()}
          accessor='value'
          backgroundColor='transparent'
          paddingLeft='15'
          center={[10, 10]}
          absolute={showValues}
          hasLegend={showLegend && !isScreenReaderEnabled}
        />

        {/* Accessible data summary for screen readers */}
        {isScreenReaderEnabled && (
          <View style={styles.accessibleSummary}>
            <Text
              style={[
                styles.accessibleTitle,
                { color: theme.colors.onSurface },
              ]}
              accessible
              accessibilityRole='header'
            >
              Chart Data Summary
            </Text>
            {pieData.map((item, index) => (
              <Text
                key={index}
                style={[
                  styles.accessibleItem,
                  { color: theme.colors.onSurface },
                ]}
                accessible
              >
                {item.name}: {formatValueDisplay(item.value)}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLineChart = () => {
    const lineData = {
      labels: (data as LineDataPoint[]).map((_, index) => `${index + 1}`),
      datasets: [
        {
          data: (data as LineDataPoint[]).map(point => point.y),
          color: (_opacity = 1) => colors[0],
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={lineData}
          width={chartWidth}
          height={height}
          chartConfig={{
            ...getChartConfig(),
            fillShadowGradient: colors[0],
            fillShadowGradientOpacity: 0.1,
          }}
          bezier
          style={styles.chartStyle}
          withDots
          withShadow
          withScrollableDot
          withInnerLines={showGrid}
          withOuterLines={showAxis}
        />

        {/* Accessible data summary for screen readers */}
        {isScreenReaderEnabled && (
          <View style={styles.accessibleSummary}>
            <Text
              style={[
                styles.accessibleTitle,
                { color: theme.colors.onSurface },
              ]}
              accessible
              accessibilityRole='header'
            >
              Line Chart Data
            </Text>
            {(data as LineDataPoint[]).map((point, index) => (
              <Text
                key={index}
                style={[
                  styles.accessibleItem,
                  { color: theme.colors.onSurface },
                ]}
                accessible
              >
                Point {index + 1}: {formatValueDisplay(point.y)}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderBarChart = () => {
    const barData = {
      labels: (data as DataPoint[]).map(item => item.name.substring(0, 3)),
      datasets: [
        {
          data: (data as DataPoint[]).map(item => item.value),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={chartWidth}
          height={height}
          chartConfig={getChartConfig()}
          style={styles.chartStyle}
          showValuesOnTopOfBars={showValues}
          withInnerLines={showGrid}
          fromZero
        />

        {/* Accessible data summary for screen readers */}
        {isScreenReaderEnabled && (
          <View style={styles.accessibleSummary}>
            <Text
              style={[
                styles.accessibleTitle,
                { color: theme.colors.onSurface },
              ]}
              accessible
              accessibilityRole='header'
            >
              Bar Chart Data
            </Text>
            {(data as DataPoint[]).map((item, index) => (
              <Text
                key={index}
                style={[
                  styles.accessibleItem,
                  { color: theme.colors.onSurface },
                ]}
                accessible
              >
                {item.name}: {formatValueDisplay(item.value)}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      default:
        return renderPieChart();
    }
  };

  const renderLegend = () => {
    if (!showLegend || type !== 'pie' || isScreenReaderEnabled) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendContainer}
        contentContainerStyle={styles.legendContent}
      >
        {(data as DataPoint[]).map((item, index) => (
          <AnimatedTouchable
            key={index}
            onPress={() => handleDataPointPress(item, index)}
            style={[
              styles.legendItem,
              selectedIndex === index ? [
                styles.selectedLegendItem,
                { backgroundColor: theme.colors.primaryContainer }
              ] : styles.unselectedLegendItem,
            ]}
            hapticType='light'
            animationType='scale'
            accessible
            accessibilityRole='button'
            accessibilityLabel={`${item.name}: ${formatValueDisplay(item.value)}`}
            accessibilityState={{ selected: selectedIndex === index }}
          >
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor: item.color || colors[index % colors.length],
                },
              ]}
            />
            <View style={styles.legendTextContainer}>
              <Text
                style={[styles.legendName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatValueDisplay(item.value)}
              </Text>
            </View>
          </AnimatedTouchable>
        ))}
      </ScrollView>
    );
  };

  const renderError = () => (
    <View
      style={[
        styles.errorContainer,
        { backgroundColor: theme.colors.errorContainer },
      ]}
    >
      <Ionicons
        name='warning-outline'
        size={32}
        color={theme.colors.error}
        accessible
        accessibilityLabel='Error icon'
      />
      <Text
        style={[styles.errorText, { color: theme.colors.onErrorContainer }]}
        accessible
      >
        {error || 'Failed to load chart data'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container} testID={testID}>
        {title && (
          <EnhancedSkeletonLoader
            variant='text'
            width='60%'
            height={24}
            accessibilityLabel='Loading chart title'
          />
        )}
        {subtitle && (
          <EnhancedSkeletonLoader
            variant='text'
            width='40%'
            height={16}
            accessibilityLabel='Loading chart subtitle'
          />
        )}
        <EnhancedSkeletonLoader
          variant='chart'
          accessibilityLabel='Loading chart data'
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container} testID={testID}>
        {renderError()}
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Ionicons
          name='bar-chart-outline'
          size={48}
          color={theme.colors.onSurfaceVariant}
          accessible
          accessibilityLabel='No data icon'
        />
        <Text
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          accessible
        >
          No data available
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '2deg'],
              }),
            },
          ],
        },
      ]}
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel || `${type} chart`}
      accessibilityHint={
        accessibilityHint || 'Double tap to interact with chart data'
      }
    >
      {/* Header */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              accessible
              accessibilityRole='header'
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
              accessible
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Chart */}
      {renderChart()}

      {/* Legend */}
      {renderLegend()}

      {/* Summary Stats */}
      {type === 'pie' && !isScreenReaderEnabled && (
        <View style={styles.summaryContainer}>
          <Text
            style={[
              styles.summaryTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
            accessible
          >
            Total:{' '}
            {formatValueDisplay(
              (data as DataPoint[]).reduce((sum, item) => sum + item.value, 0),
            )}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  accessibleItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  accessibleSummary: {
    backgroundColor: COLORS.blackTransparent05,
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
  accessibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  container: {
    borderRadius: 16,
    elevation: 4,
    marginVertical: 8,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    marginVertical: 8,
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    marginVertical: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 16,
  },
  legendColor: {
    borderRadius: 6,
    height: 12,
    marginRight: 8,
    width: 12,
  },
  legendContainer: {
    maxHeight: 120,
  },
  legendContent: {
    paddingHorizontal: 8,
  },
  legendItem: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    marginHorizontal: 4,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendTextContainer: {
    flex: 1,
  },
  legendValue: {
    fontSize: 11,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryContainer: {
    alignItems: 'center',
    borderTopColor: COLORS.blackTransparent10,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartStyle: {
    borderRadius: 16,
    marginVertical: 8,
  },
  selectedLegendItem: {
    // backgroundColor handled dynamically with theme
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  unselectedLegendItem: {
    backgroundColor: 'transparent',
  },
});

export default EnhancedDataVisualization;
