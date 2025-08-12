import React, {
  useEffect,
  useRef,
  useState,
  // useCallback,
  // useMemo,
} from 'react';

import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  // Alert,
  // Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@theme/ThemeProvider';
import { LineChart /* BarChart, PieChart */ } from 'react-native-chart-kit';

import { HapticFeedbackService } from '../services/HapticFeedbackService';

import { AnimatedTouchable } from './MicroInteractions';

const COLORS = {
  blackTransparent10: 'rgba(0,0,0,0.1)',
};

const { width: screenWidth } = Dimensions.get('window');

interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  jsHeapSize: number;
  nativeHeapSize: number;
  imageMemory: number;
  bundleSize: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  cpuUsage: { warning: number; critical: number };
  networkLatency: { warning: number; critical: number };
  renderTime: { warning: number; critical: number };
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: 'memory' | 'rendering' | 'network' | 'bundle';
  implemented: boolean;
}

const defaultThresholds: PerformanceThresholds = {
  fps: { warning: 45, critical: 30 },
  memoryUsage: { warning: 80, critical: 95 },
  cpuUsage: { warning: 70, critical: 90 },
  networkLatency: { warning: 1000, critical: 3000 },
  renderTime: { warning: 16, critical: 32 },
};

const optimizationSuggestions: OptimizationSuggestion[] = [
  {
    id: 'lazy-loading',
    title: 'Implement Lazy Loading',
    description:
      'Load components and images only when needed to reduce initial bundle size and memory usage.',
    impact: 'high',
    effort: 'medium',
    category: 'memory',
    implemented: false,
  },
  {
    id: 'image-optimization',
    title: 'Optimize Images',
    description:
      'Use WebP format, appropriate resolutions, and image caching to reduce memory usage.',
    impact: 'medium',
    effort: 'low',
    category: 'memory',
    implemented: false,
  },
  {
    id: 'memoization',
    title: 'Add React.memo and useMemo',
    description:
      'Prevent unnecessary re-renders by memoizing components and expensive calculations.',
    impact: 'medium',
    effort: 'medium',
    category: 'rendering',
    implemented: false,
  },
  {
    id: 'bundle-splitting',
    title: 'Code Splitting',
    description:
      'Split your bundle into smaller chunks to improve initial load time.',
    impact: 'high',
    effort: 'high',
    category: 'bundle',
    implemented: false,
  },
  {
    id: 'network-caching',
    title: 'Implement Network Caching',
    description: 'Cache API responses and implement offline-first strategies.',
    impact: 'high',
    effort: 'medium',
    category: 'network',
    implemented: false,
  },
];

interface EnhancedPerformanceMonitorProps {
  enabled?: boolean;
  samplingInterval?: number;
  maxDataPoints?: number;
  showRealTimeMetrics?: boolean;
  showOptimizationSuggestions?: boolean;
  onPerformanceAlert?: (alert: PerformanceAlert) => void;
  testID?: string;
}

export const EnhancedPerformanceMonitor: React.FC<
  EnhancedPerformanceMonitorProps
> = ({
  enabled = true,
  samplingInterval = 1000,
  maxDataPoints = 60,
  showRealTimeMetrics = true,
  showOptimizationSuggestions = true,
  onPerformanceAlert,
  testID,
}) => {
  const { theme, isDark } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>(
    optimizationSuggestions,
  );
  const [isMonitoring, setIsMonitoring] = useState(enabled);
  const [selectedMetric, setSelectedMetric] =
    useState<keyof PerformanceMetrics>('fps');
  const [thresholds, setThresholds] =
    useState<PerformanceThresholds>(defaultThresholds);
  const [_showDetails, _setShowDetails] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring, samplingInterval]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedThresholds = await AsyncStorage.getItem(
        'performance_thresholds',
      );
      const savedSuggestions = await AsyncStorage.getItem(
        'optimization_suggestions',
      );

      if (savedThresholds) {
        setThresholds(JSON.parse(savedThresholds));
      }

      if (savedSuggestions) {
        setSuggestions(JSON.parse(savedSuggestions));
      }
    } catch (error) {
      console.error('Error loading performance settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(
        'performance_thresholds',
        JSON.stringify(thresholds),
      );
      await AsyncStorage.setItem(
        'optimization_suggestions',
        JSON.stringify(suggestions),
      );
    } catch (error) {
      console.error('Error saving performance settings:', error);
    }
  };

  const startMonitoring = () => {
    stopMonitoring();

    intervalRef.current = setInterval(() => {
      collectMetrics();
    }, samplingInterval);

    // Start FPS monitoring
    measureFPS();
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  };

  const measureFPS = () => {
    const now = performance.now();
    frameCount.current++;

    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round(
        (frameCount.current * 1000) / (now - lastFrameTime.current),
      );
      frameCount.current = 0;
      lastFrameTime.current = now;

      // Store FPS for next collection
      frameRef.current = requestAnimationFrame(measureFPS);
      return fps;
    }

    frameRef.current = requestAnimationFrame(measureFPS);
    return null;
  };

  const collectMetrics = async () => {
    try {
      const now = Date.now();

      // Simulate metric collection (in a real app, these would be actual measurements)
      const newMetrics: PerformanceMetrics = {
        timestamp: now,
        fps: Math.max(0, 60 + Math.random() * 10 - 15), // Simulate FPS around 60
        memoryUsage: Math.min(100, 40 + Math.random() * 30), // Simulate memory usage
        cpuUsage: Math.min(100, 20 + Math.random() * 40), // Simulate CPU usage
        networkLatency: 100 + Math.random() * 500, // Simulate network latency
        renderTime: 8 + Math.random() * 16, // Simulate render time
        jsHeapSize: 50 + Math.random() * 20, // MB
        nativeHeapSize: 30 + Math.random() * 15, // MB
        imageMemory: 20 + Math.random() * 10, // MB
        bundleSize: 15 + Math.random() * 5, // MB
      };

      setMetrics(prev => {
        const updated = [...prev, newMetrics].slice(-maxDataPoints);
        checkThresholds(newMetrics);
        return updated;
      });
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  };

  const checkThresholds = (metrics: PerformanceMetrics) => {
    for (const [key, threshold] of Object.entries(thresholds)) {
      const metricKey = key as keyof PerformanceThresholds;
      const value = metrics[metricKey] as number;

      if (value >= threshold.critical) {
        createAlert(metricKey, value, threshold.critical, 'critical');
      } else if (value >= threshold.warning) {
        createAlert(metricKey, value, threshold.warning, 'warning');
      }
    }
  };

  const createAlert = (
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number,
    type: 'warning' | 'critical',
  ) => {
    const alertId = `${metric}_${type}_${Date.now()}`;
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      metric,
      value,
      threshold,
      message: `${metric} is ${type}: ${value.toFixed(1)} (threshold: ${threshold})`,
      timestamp: Date.now(),
      resolved: false,
    };

    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    onPerformanceAlert?.(alert);

    // Trigger haptic feedback for critical alerts
    if (type === 'critical') {
      HapticFeedbackService.triggerError();
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      ),
    );
  };

  const toggleSuggestion = (suggestionId: string) => {
    setSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === suggestionId
          ? { ...suggestion, implemented: !suggestion.implemented }
          : suggestion,
      ),
    );
    saveSettings();
  };

  const getChartData = () => {
    if (metrics.length === 0) return null;

    const labels = metrics.slice(-10).map((_, index) => `${index + 1}`);
    const data = metrics.slice(-10).map(m => m[selectedMetric] as number);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) =>
            `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getMetricColor = (value: number, metric: keyof PerformanceMetrics) => {
    const threshold = thresholds[metric as keyof PerformanceThresholds];
    if (!threshold) return theme.colors.primary;

    if (value >= threshold.critical) return '#F44336';
    if (value >= threshold.warning) return '#FF9800';
    return '#4CAF50';
  };

  const getCurrentMetrics = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const getAverageMetrics = () => {
    if (metrics.length === 0) return null;

    const recent = metrics.slice(-10);
    return {
      fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
      memoryUsage:
        recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      cpuUsage: recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length,
      networkLatency:
        recent.reduce((sum, m) => sum + m.networkLatency, 0) / recent.length,
      renderTime:
        recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length,
    };
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) =>
      `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) =>
      `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const currentMetrics = getCurrentMetrics();
  const averageMetrics = getAverageMetrics();
  const chartData = getChartData();
  const activeAlerts = alerts.filter(alert => !alert.resolved);

  if (!enabled) {
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={testID}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Performance Monitor
        </Text>
        <AnimatedTouchable
          onPress={() => setIsMonitoring(!isMonitoring)}
          style={[
            styles.toggleButton,
            isMonitoring ? styles.toggleButtonActive : styles.toggleButtonInactive,
          ]}
          hapticType='medium'
          animationType='scale'
          accessible
          accessibilityRole='switch'
          accessibilityState={{ checked: isMonitoring }}
          accessibilityLabel='Toggle performance monitoring'
        >
          <Ionicons
            name={isMonitoring ? 'play' : 'pause'}
            size={16}
            color='white'
          />
          <Text style={styles.toggleText}>{isMonitoring ? 'ON' : 'OFF'}</Text>
        </AnimatedTouchable>
      </View>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <View
          style={[
            styles.alertsContainer,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onErrorContainer },
            ]}
          >
            Active Alerts ({activeAlerts.length})
          </Text>
          {activeAlerts.slice(0, 3).map(alert => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertContent}>
                <Ionicons
                  name={alert.type === 'critical' ? 'warning' : 'alert-circle'}
                  size={16}
                  color={alert.type === 'critical' ? '#F44336' : '#FF9800'}
                />
                <Text
                  style={[
                    styles.alertText,
                    { color: theme.colors.onErrorContainer },
                  ]}
                >
                  {alert.message}
                </Text>
              </View>
              <AnimatedTouchable
                onPress={() => resolveAlert(alert.id)}
                style={styles.resolveButton}
                hapticType='light'
                animationType='scale'
                accessible
                accessibilityRole='button'
                accessibilityLabel='Resolve alert'
              >
                <Ionicons
                  name='checkmark'
                  size={16}
                  color={theme.colors.onErrorContainer}
                />
              </AnimatedTouchable>
            </View>
          ))}
        </View>
      )}

      {/* Real-time Metrics */}
      {showRealTimeMetrics && currentMetrics && (
        <View
          style={[
            styles.metricsContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Real-time Metrics
          </Text>
          <View style={styles.metricsGrid}>
            {Object.entries({
              FPS: currentMetrics.fps,
              'Memory %': currentMetrics.memoryUsage,
              'CPU %': currentMetrics.cpuUsage,
              'Latency ms': currentMetrics.networkLatency,
            }).map(([label, value]) => (
              <View key={label} style={styles.metricItem}>
                <Text
                  style={[
                    styles.metricLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: getMetricColor(
                        value,
                        label.toLowerCase().includes('fps')
                          ? 'fps'
                          : label.toLowerCase().includes('memory')
                            ? 'memoryUsage'
                            : label.toLowerCase().includes('cpu')
                              ? 'cpuUsage'
                              : 'networkLatency',
                      ),
                    },
                  ]}
                >
                  {value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Chart */}
      {chartData && (
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Performance Chart
            </Text>
            <View style={styles.metricSelector}>
              {(['fps', 'memoryUsage', 'cpuUsage'] as const).map(metric => (
                <AnimatedTouchable
                  key={metric}
                  onPress={() => setSelectedMetric(metric)}
                  style={[
                    styles.metricButton,
                    selectedMetric === metric ? [
                      styles.selectedMetricButton,
                      { backgroundColor: theme.colors.primary }
                    ] : styles.unselectedMetricButton,
                    { borderColor: theme.colors.outline },
                  ]}
                  hapticType='selection'
                  animationType='scale'
                  accessible
                  accessibilityRole='button'
                  accessibilityState={{ selected: selectedMetric === metric }}
                  accessibilityLabel={`Select ${metric} metric`}
                >
                  <Text
                    style={[
                      styles.metricButtonText,
                      {
                        color:
                          selectedMetric === metric
                            ? theme.colors.onPrimary
                            : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {metric.toUpperCase()}
                  </Text>
                </AnimatedTouchable>
              ))}
            </View>
          </View>

          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots
            withShadow={false}
            withVerticalLabels
            withHorizontalLabels
          />
        </View>
      )}

      {/* Optimization Suggestions */}
      {showOptimizationSuggestions && (
        <View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Optimization Suggestions
          </Text>
          {suggestions.map(suggestion => (
            <View key={suggestion.id} style={styles.suggestionItem}>
              <View style={styles.suggestionHeader}>
                <Text
                  style={[
                    styles.suggestionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {suggestion.title}
                </Text>
                <View style={styles.suggestionBadges}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          suggestion.impact === 'high'
                            ? '#4CAF50'
                            : suggestion.impact === 'medium'
                              ? '#FF9800'
                              : '#9E9E9E',
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {suggestion.impact} impact
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          suggestion.effort === 'low'
                            ? '#4CAF50'
                            : suggestion.effort === 'medium'
                              ? '#FF9800'
                              : '#F44336',
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {suggestion.effort} effort
                    </Text>
                  </View>
                </View>
              </View>
              <Text
                style={[
                  styles.suggestionDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {suggestion.description}
              </Text>
              <AnimatedTouchable
                onPress={() => toggleSuggestion(suggestion.id)}
                style={[
                  styles.suggestionButton,
                  {
                    backgroundColor: suggestion.implemented
                      ? '#4CAF50'
                      : theme.colors.primary,
                  },
                ]}
                hapticType='medium'
                animationType='scale'
                accessible
                accessibilityRole='button'
                accessibilityState={{ selected: suggestion.implemented }}
                accessibilityLabel={`Mark ${suggestion.title} as ${
                  suggestion.implemented ? 'not implemented' : 'implemented'
                }`}
              >
                <Ionicons
                  name={suggestion.implemented ? 'checkmark' : 'add'}
                  size={16}
                  color='white'
                />
                <Text style={styles.suggestionButtonText}>
                  {suggestion.implemented ? 'Implemented' : 'Mark as Done'}
                </Text>
              </AnimatedTouchable>
            </View>
          ))}
        </View>
      )}

      {/* Performance Summary */}
      {averageMetrics && (
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Performance Summary (Last 10 samples)
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Average FPS
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: getMetricColor(averageMetrics.fps, 'fps') },
                ]}
              >
                {averageMetrics.fps.toFixed(1)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Memory Usage
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: getMetricColor(
                      averageMetrics.memoryUsage,
                      'memoryUsage',
                    ),
                  },
                ]}
              >
                {averageMetrics.memoryUsage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                CPU Usage
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: getMetricColor(averageMetrics.cpuUsage, 'cpuUsage'),
                  },
                ]}
              >
                {averageMetrics.cpuUsage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Network Latency
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: getMetricColor(
                      averageMetrics.networkLatency,
                      'networkLatency',
                    ),
                  },
                ]}
              >
                {averageMetrics.networkLatency.toFixed(0)}ms
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  alertContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  alertItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
  },
  alertsContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  metricsContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resolveButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionBadges: {
    gap: 4,
  },
  suggestionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionItem: {
    borderBottomColor: COLORS.blackTransparent10,
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 16,
  },
  suggestionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  suggestionsContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  summaryContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonInactive: {
    backgroundColor: '#F44336',
  },
  selectedMetricButton: {
    // backgroundColor handled dynamically with theme
  },
  unselectedMetricButton: {
    backgroundColor: 'transparent',
  },
});

export default EnhancedPerformanceMonitor;
