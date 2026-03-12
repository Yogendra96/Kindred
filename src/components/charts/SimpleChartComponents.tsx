import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import { ModernDesignSystem } from '../../design-system/ModernDesignSystem';

const { width: _screenWidth } = Dimensions.get('window');

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BaseChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  theme?: any;
  animated?: boolean;
  interactive?: boolean;
  accessibilityLabel?: string;
}

// Simple placeholder chart components for now
export const ModernDonutChart: React.FC<BaseChartProps> = ({
  data,
  title,
  subtitle,
  height = 240,
  theme = ModernDesignSystem.LightTheme,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={[styles.chartContainer, { height }]}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: item.color || theme.colors.primary },
                ]}
              />
              <Text style={[styles.legendText, { color: theme.colors.text }]}>
                {item.label}: {percentage}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const ModernBarChart: React.FC<BaseChartProps> = ({
  data,
  title,
  subtitle,
  height = 240,
  theme = ModernDesignSystem.LightTheme,
}) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <View style={[styles.chartContainer, { height }]}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      <View style={styles.barContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 160; // max 160px
          return (
            <View key={index} style={styles.barItem}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: item.color || theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.barLabel, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {item.label}
              </Text>
              <Text
                style={[styles.barValue, { color: theme.colors.textSecondary }]}
              >
                {item.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const ModernLineChart: React.FC<BaseChartProps> = ({
  data,
  title,
  subtitle,
  height = 240,
  theme = ModernDesignSystem.LightTheme,
}) => {
  return (
    <View style={[styles.chartContainer, { height }]}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      <View style={styles.lineChartPlaceholder}>
        <Text
          style={[
            styles.placeholderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Line Chart: {data.length} data points
        </Text>
        {data.map((item, index) => (
          <View key={index} style={styles.dataPoint}>
            <Text style={[styles.dataPointText, { color: theme.colors.text }]}>
              {item.label}: {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const ModernProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  theme?: any;
}> = ({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  children,
  theme = ModernDesignSystem.LightTheme,
}) => {
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={styles.progressContent}>
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {percentage}%
        </Text>
        {children}
      </View>
    </View>
  );
};

export const ModernMetricCard: React.FC<{
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  theme?: any;
  icon?: React.ReactNode;
  onPress?: () => void;
}> = ({
  title,
  value,
  trend,
  color,
  theme = ModernDesignSystem.LightTheme,
  icon,
  onPress,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.metricHeader}>
        {icon && <View style={styles.metricIcon}>{icon}</View>}
        <Text
          style={[styles.metricTitle, { color: theme.colors.textSecondary }]}
        >
          {title}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color: color || theme.colors.text }]}>
        {value}
      </Text>
      {trend && (
        <Text
          style={[styles.metricTrend, { color: getTrendColor(trend, theme) }]}
        >
          {getTrendSymbol(trend)} {trend}
        </Text>
      )}
    </Component>
  );
};

const getTrendColor = (trend: 'up' | 'down' | 'stable', theme: any) => {
  switch (trend) {
    case 'up':
      return '#4CAF50';
    case 'down':
      return '#F44336';
    default:
      return theme.colors.textSecondary;
  }
};

const getTrendSymbol = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return '↗';
    case 'down':
      return '↘';
    default:
      return '→';
  }
};

const styles = StyleSheet.create({
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  legendContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
    paddingHorizontal: 8,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barWrapper: {
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    height: 32,
  },
  barValue: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  lineChartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 14,
    marginBottom: 16,
  },
  dataPoint: {
    marginVertical: 2,
  },
  dataPointText: {
    fontSize: 12,
  },
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 12,
    borderColor: '#E0E0E0',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default {
  ModernDonutChart,
  ModernBarChart,
  ModernLineChart,
  ModernProgressRing,
  ModernMetricCard,
};
