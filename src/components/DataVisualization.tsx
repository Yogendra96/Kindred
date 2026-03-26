// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import SkeletonLoader from './SkeletonLoader';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';

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

interface DataVisualizationProps {
  title?: string;
  subtitle?: string;
  data: DataPoint[] | LineDataPoint[];
  type: 'pie' | 'line' | 'bar';
  loading?: boolean;
  error?: string;
  onDataPointPress?: (dataPoint: any, index: number) => void;
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

/**
 * Data Visualization Component
 * Provides interactive charts and data summaries
 */
export const DataVisualization: React.FC<DataVisualizationProps> = ({
  title,
  subtitle,
  data,
  type,
  loading = false,
  error,
  onDataPointPress,
  showLegend = true,
  showValues = true,
  animated = true,
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
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!loading && data && data.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    }
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

  const colors = customColors || defaultColors;

  const formatValueDisplay = (value: number): string => {
    if (formatValue) return formatValue(value);
    return `${value.toLocaleString()}${unit}`;
  };

  const handleDataPointPress = (dataPoint: any, index: number) => {
    HapticFeedbackService.triggerSelection();
    setSelectedIndex(index);
    onDataPointPress?.(dataPoint, index);

    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const getChartConfig = () => ({
    backgroundColor: 'transparent',
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 12, fontWeight: '500' },
  });

  const renderPieChart = () => {
    const pieData = (data as DataPoint[]).map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length],
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
        {isScreenReaderEnabled && (
          <View style={styles.accessibleSummary}>
            <Text style={[styles.accessibleTitle, { color: theme.colors.onSurface }]} accessibilityRole='header'>Chart Summary</Text>
            {pieData.map((item, index) => (
              <Text key={index} style={{ color: theme.colors.onSurface }}>{item.name}: {formatValueDisplay(item.value)}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie': return renderPieChart();
      case 'line':
      case 'bar':
      default: return renderPieChart(); // Simplification for now
    }
  };

  if (loading) {
    return (
      <View style={styles.container} testID={testID}>
        <SkeletonLoader variant='text' width='60%' height={24} />
        <SkeletonLoader variant='chart' />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]} testID={testID}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>}
        </View>
      )}
      {renderChart()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginVertical: 8, elevation: 4 },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 14 },
  chartContainer: { alignItems: 'center' },
  accessibleSummary: { marginTop: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 },
  accessibleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});

export default DataVisualization;
