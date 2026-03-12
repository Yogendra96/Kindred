import { useTheme } from '../theme/ThemeProvider';
import SkeletonLoader from './SkeletonLoader';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

export interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
  target?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  category?: string;
}

export interface AnalyticsDashboardProps {
  title?: string;
  metrics?: MetricCard[];
  timeSeriesData?: TimeSeriesData[];
  pieChartData?: PieChartData[];
  barChartData?: ChartData;
  isLoading?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
  onMetricPress?: (metric: MetricCard) => void;
  onChartPress?: (chartType: string, data: unknown) => void;
  showComparison?: boolean;
  comparisonPeriod?: 'day' | 'week' | 'month' | 'year';
  customFilters?: Array<{
    id: string;
    label: string;
    value: unknown;
  }>;
  style?: Record<string, unknown>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  title = 'Analytics Dashboard',
  metrics = [],
  timeSeriesData = [],
  pieChartData = [],
  barChartData,
  isLoading = false,
  refreshInterval,
  onRefresh,
  onMetricPress,
  onChartPress,
  showComparison = true,
  comparisonPeriod = 'week',
  customFilters = [],
  style,
}) => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(comparisonPeriod);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const animationProgress = useSharedValue(0);

  // Animation for dashboard entrance
  useEffect(() => {
    animationProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval, onRefresh]);

  // Process time series data for charts
  const processedTimeSeriesData = useMemo(() => {
    if (!timeSeriesData.length) return null;

    const labels = timeSeriesData.map(item => {
      const date = new Date(item.timestamp);
      return selectedPeriod === 'day'
        ? date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = timeSeriesData.map(item => item.value);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [timeSeriesData, selectedPeriod]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  // Animated styles

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animationProgress.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(animationProgress.value, [0, 1], [50, 0]),
        },
      ],
    };
  });

  const MetricCardComponent = ({
    metric,
    index,
    animationProgress,
    onMetricPress,
    theme,
  }: {
    metric: MetricCard;
    index: number;
    animationProgress: Animated.SharedValue<number>;
    onMetricPress?: (metric: MetricCard) => void;
    theme: any;
  }) => {
    const cardAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(animationProgress.value, [0, 1], [0, 1]),
        transform: [
          {
            translateY: interpolate(
              animationProgress.value,
              [0, 1],
              [30 + index * 10, 0],
            ),
          },
        ],
      };
    });

    const getChangeColor = () => {
      if (!metric.change) return theme.colors.text;
      switch (metric.changeType) {
        case 'increase':
          return '#22C55E';
        case 'decrease':
          return '#EF4444';
        default:
          return theme.colors.text;
      }
    };

    const getChangeIcon = () => {
      if (!metric.change) return '';
      switch (metric.changeType) {
        case 'increase':
          return '↗';
        case 'decrease':
          return '↘';
        default:
          return '→';
      }
    };

    return (
      <Animated.View style={cardAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
          onPress={() => onMetricPress?.(metric)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[
              metric.color || theme.colors.primary,
              `${metric.color || theme.colors.primary}80`,
            ]}
            style={styles.metricGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: theme.colors.text }]}>
                {metric.title}
              </Text>
              {metric.icon && (
                <Text style={styles.metricIcon}>{metric.icon}</Text>
              )}
            </View>

            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {metric.value}
                {metric.unit && (
                  <Text style={styles.metricUnit}> {metric.unit}</Text>
                )}
              </Text>

              {metric.change !== undefined && (
                <View style={styles.metricChange}>
                  <Text
                    style={[styles.changeText, { color: getChangeColor() }]}
                  >
                    {getChangeIcon()} {Math.abs(metric.change)}%
                  </Text>
                </View>
              )}
            </View>

            {metric.target && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (Number(metric.value) / metric.target) * 100,
                          100,
                        )}%`,
                        backgroundColor: metric.color || theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.targetText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Target: {metric.target}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPeriodSelector = () => {
    const periods = [
      { key: 'day', label: '24H' },
      { key: 'week', label: '7D' },
      { key: 'month', label: '30D' },
      { key: 'year', label: '1Y' },
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor:
                  selectedPeriod === period.key
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() =>
              setSelectedPeriod(period.key as typeof comparisonPeriod)
            }
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color:
                    selectedPeriod === period.key
                      ? theme.colors.surface
                      : theme.colors.text,
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderChart = (chartType: string, data: unknown, title: string) => {
    if (isLoading) {
      return (
        <View style={styles.chartContainer}>
          <SkeletonLoader variant='chart' width={chartWidth} height={220} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.chartContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onChartPress?.(chartType, data)}
        activeOpacity={0.9}
      >
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {title}
        </Text>

        {chartType === 'line' && !!data && (
          <LineChart
            data={data as any}
            width={chartWidth - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=''
            yAxisSuffix=''
          />
        )}

        {chartType === 'bar' && !!data && (
          <BarChart
            data={data as any}
            width={chartWidth - 32}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            withHorizontalLabels={true}
            yAxisLabel=''
            yAxisSuffix=''
          />
        )}

        {chartType === 'pie' && pieChartData.length > 0 && (
          <PieChart
            data={pieChartData}
            width={chartWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor='population'
            backgroundColor='transparent'
            paddingLeft='15'
            style={styles.chart}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && metrics.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <SkeletonLoader variant='text' lines={1} width={200} />
        <View style={styles.metricsGrid}>
          {[1, 2, 3, 4].map(item => (
            <SkeletonLoader key={item} variant='card' width={160} />
          ))}
        </View>
        <SkeletonLoader variant='chart' width={chartWidth} height={220} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {showComparison && renderPeriodSelector()}
        </View>

        {/* Custom Filters */}
        {customFilters.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
          >
            {customFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      selectedFilter === filter.id
                        ? theme.colors.primary
                        : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === filter.id ? null : filter.id,
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color:
                        selectedFilter === filter.id
                          ? theme.colors.surface
                          : theme.colors.text,
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCardComponent
                key={metric.id}
                metric={metric}
                index={index}
                animationProgress={animationProgress}
                onMetricPress={onMetricPress}
                theme={theme}
              />
            ))}
          </View>
        )}

        {/* Charts */}
        <View style={styles.chartsContainer}>
          {processedTimeSeriesData &&
            renderChart('line', processedTimeSeriesData, 'Trend Analysis')}

          {barChartData && renderChart('bar', barChartData, 'Comparison Chart')}

          {pieChartData.length > 0 &&
            renderChart('pie', pieChartData, 'Distribution')}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  metricGradient: {
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricContent: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  metricChange: {
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  targetText: {
    fontSize: 10,
    opacity: 0.7,
  },
  chartsContainer: {
    gap: 20,
  },
  chartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
});

export default React.memo(AnalyticsDashboard);
