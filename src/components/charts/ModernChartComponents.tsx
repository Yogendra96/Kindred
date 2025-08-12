/**
 * 🎨 Modern Chart Components
 * Ultra-sophisticated data visualization components with animations and interactions
 * Features: Animated charts, accessibility, responsive design, modern aesthetics
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import type { Theme } from '../../design-system/ModernDesignSystem';
import { ModernDesignSystem } from '../../design-system/ModernDesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  category?: string;
}

interface BaseChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  theme?: Theme;
  animated?: boolean;
  interactive?: boolean;
  accessibilityLabel?: string;
}

// Modern Donut Chart Component
export const ModernDonutChart: React.FC<BaseChartProps & {
  centerContent?: React.ReactNode;
  strokeWidth?: number;
  showLabels?: boolean;
}> = ({
  data,
  title,
  subtitle,
  height = 240,
  theme = ModernDesignSystem.LightTheme,
  animated = true,
  interactive = true,
  centerContent,
  strokeWidth = 32,
  showLabels = true,
  accessibilityLabel,
}) => {
  const [animationProgress] = useState(new Animated.Value(0));
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  
  const radius = (height - strokeWidth) / 2 - 20;
  const centerX = height / 2;
  const centerY = height / 2;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else {
      animationProgress.setValue(1);
    }
  }, [animated, animationProgress]);

  const createPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;
    
    const color = item.color || theme.colors.primary;
    const isSelected = selectedSegment === index;
    
    return (
      <G key={index}>
        <Path
          d={createPath(startAngle, endAngle, radius)}
          stroke={color}
          strokeWidth={isSelected && interactive ? strokeWidth + 4 : strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={isSelected ? 1 : 0.9}
          onPress={() => interactive && setSelectedSegment(index === selectedSegment ? null : index)}
        />
        {showLabels && percentage > 0.05 && (
          <SvgText
            x={polarToCartesian(centerX, centerY, radius - strokeWidth/2, startAngle + angle/2).x}
            y={polarToCartesian(centerX, centerY, radius - strokeWidth/2, startAngle + angle/2).y}
            textAnchor="middle"
            fontSize="12"
            fill={theme.colors.text}
            fontWeight="600"
          >
            {(percentage * 100).toFixed(0)}%
          </SvgText>
        )}
      </G>
    );
  });

  return (
    <View style={[styles.chartContainer, { height }]}>
      {title && (
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.chartContent}>
        <Animated.View style={{ transform: [{ scale: animationProgress }] }}>
          <Svg width={height} height={height} accessibilityLabel={accessibilityLabel}>
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {segments}
          </Svg>
          
          {centerContent && (
            <View style={[styles.centerContent, { 
              top: centerY - 30, 
              left: centerX - 50,
              width: 100,
              height: 60 
            }]}>
              {centerContent}
            </View>
          )}
        </Animated.View>
        
        {interactive && selectedSegment !== null && (
          <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tooltipLabel, { color: theme.colors.text }]}>
              {data[selectedSegment].label}
            </Text>
            <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
              {data[selectedSegment].value.toFixed(2)} kg CO₂
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Modern Bar Chart Component
export const ModernBarChart: React.FC<BaseChartProps & {
  horizontal?: boolean;
  showValues?: boolean;
  gradientColors?: boolean;
}> = ({
  data,
  title,
  subtitle,
  height = 200,
  theme = ModernDesignSystem.LightTheme,
  animated = true,
  horizontal = false,
  showValues = true,
  gradientColors = true,
  accessibilityLabel,
}) => {
  const [animationProgress] = useState(new Animated.Value(0));
  
  const maxValue = Math.max(...data.map(d => d.value));
  const chartWidth = SCREEN_WIDTH - 60;
  const barSpacing = 8;
  const barWidth = (chartWidth - (data.length - 1) * barSpacing) / data.length;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animationProgress.setValue(1);
    }
  }, [animated, animationProgress]);

  const bars = data.map((item, index) => {
    const barHeight = (item.value / maxValue) * (height - 60);
    const x = index * (barWidth + barSpacing);
    const y = height - barHeight - 30;
    
    const color = item.color || ModernDesignSystem.CarbonDesignTokens.getCarbonColor(item.value);
    
    return (
      <G key={index}>
        <Defs>
          <LinearGradient id={`barGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        <Rect
          x={x}
          y={y}
          width={barWidth - 4}
          height={barHeight}
          fill={gradientColors ? `url(#barGradient${index})` : color}
          rx={theme.borderRadius.sm}
          ry={theme.borderRadius.sm}
        />
        {showValues && (
          <SvgText
            x={x + barWidth / 2 - 2}
            y={y - 8}
            textAnchor="middle"
            fontSize="12"
            fill={theme.colors.text}
            fontWeight="600"
          >
            {item.value.toFixed(1)}
          </SvgText>
        )}
        <SvgText
          x={x + barWidth / 2 - 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="11"
          fill={theme.colors.textSecondary}
          fontWeight="500"
        >
          {item.label}
        </SvgText>
      </G>
    );
  });

  return (
    <View style={[styles.chartContainer, { height: height + 40 }]}>
      {title && (
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <Animated.View style={{ transform: [{ scaleY: animationProgress }] }}>
        <Svg width={chartWidth} height={height} accessibilityLabel={accessibilityLabel}>
          {bars}
        </Svg>
      </Animated.View>
    </View>
  );
};

// Modern Line Chart Component
export const ModernLineChart: React.FC<BaseChartProps & {
  smoothLine?: boolean;
  showDots?: boolean;
  showArea?: boolean;
  gridLines?: boolean;
}> = ({
  data,
  title,
  subtitle,
  height = 200,
  theme = ModernDesignSystem.LightTheme,
  animated = true,
  smoothLine = true,
  showDots = true,
  showArea = true,
  gridLines = true,
  accessibilityLabel,
}) => {
  const [animationProgress] = useState(new Animated.Value(0));
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const chartWidth = SCREEN_WIDTH - 60;
  const chartHeight = height - 60;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      animationProgress.setValue(1);
    }
  }, [animated, animationProgress]);

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight + 30;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * chartWidth + 30;
  };

  // Generate line path
  let linePath = '';
  let areaPath = '';
  
  data.forEach((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    
    if (index === 0) {
      linePath += `M ${x} ${y}`;
      areaPath += `M ${x} ${height - 30} L ${x} ${y}`;
    } else {
      if (smoothLine) {
        const prevX = getX(index - 1);
        const prevY = getY(data[index - 1].value);
        const cpX = (prevX + x) / 2;
        linePath += ` Q ${cpX} ${prevY} ${x} ${y}`;
        areaPath += ` Q ${cpX} ${prevY} ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    }
    
    if (index === data.length - 1) {
      areaPath += ` L ${x} ${height - 30} Z`;
    }
  });

  return (
    <View style={[styles.chartContainer, { height: height + 40 }]}>
      {title && (
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <Animated.View style={{ opacity: animationProgress }}>
        <Svg width={chartWidth + 60} height={height} accessibilityLabel={accessibilityLabel}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {gridLines && (
            <G>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = 30 + ratio * chartHeight;
                return (
                  <Line
                    key={index}
                    x1={30}
                    y1={y}
                    x2={chartWidth + 30}
                    y2={y}
                    stroke={theme.colors.border}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    opacity={0.3}
                  />
                );
              })}
            </G>
          )}
          
          {/* Area fill */}
          {showArea && (
            <Path
              d={areaPath}
              fill="url(#areaGradient)"
              opacity={0.6}
            />
          )}
          
          {/* Line */}
          <Path
            d={linePath}
            stroke={theme.colors.primary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {showDots && data.map((point, index) => {
            const x = getX(index);
            const y = getY(point.value);
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill={theme.colors.surface}
                stroke={theme.colors.primary}
                strokeWidth={2}
              />
            );
          })}
          
          {/* X-axis labels */}
          {data.map((point, index) => {
            const x = getX(index);
            return (
              <SvgText
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill={theme.colors.textSecondary}
              >
                {point.label}
              </SvgText>
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
};

// Modern Progress Ring Component
export const ModernProgressRing: React.FC<{
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  theme?: Theme;
  animated?: boolean;
  children?: React.ReactNode;
}> = ({
  size = 120,
  strokeWidth = 8,
  progress,
  color,
  backgroundColor,
  theme = ModernDesignSystem.LightTheme,
  animated = true,
  children,
}) => {
  const [animationProgress] = useState(new Animated.Value(0));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animationProgress, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animationProgress.setValue(progress);
    }
  }, [animated, progress, animationProgress]);

  const ringColor = color || ModernDesignSystem.CarbonDesignTokens.getCarbonColor(progress / 10);
  const bgColor = backgroundColor || theme.colors.backgroundTertiary;

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {children && (
        <View style={styles.progressRingContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Modern Metric Card Component
export const ModernMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
  theme?: Theme;
  icon?: React.ReactNode;
  onPress?: () => void;
}> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color,
  theme = ModernDesignSystem.LightTheme,
  icon,
  onPress,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return theme.colors.error;
      case 'down': return theme.colors.success;
      case 'stable': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  const cardContent = (
    <View style={[
      styles.metricCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        ...theme.shadows.sm,
      }
    ]}>
      <View style={styles.metricHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metricTitle, { color: theme.colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.metricValue, { color: color || theme.colors.text }]}>
            {value}
          </Text>
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color: theme.colors.textTertiary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {icon && (
          <View style={styles.metricIcon}>
            {icon}
          </View>
        )}
      </View>
      
      {trend && trendValue && (
        <View style={styles.metricTrend}>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendIcon()} {trendValue}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  chartContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  chartHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContent: {
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
  },
  metricIcon: {
    marginLeft: 12,
  },
  metricTrend: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export {
  ModernDonutChart,
  ModernBarChart,
  ModernLineChart,
  ModernProgressRing,
  ModernMetricCard,
};