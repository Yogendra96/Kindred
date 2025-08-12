import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';

import { iotIntegrationService } from '../services/IoTIntegrationService';
import { loggingService } from '../services/LoggingService';
import { mlCarbonPrediction } from '../services/MLCarbonPrediction';
import { useTheme } from '../theme/ThemeProvider';

interface InsightData {
  predictedCarbon: number[];
  trendAnalysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
    timeframe: string;
  };
  comparativeData: {
    userVsAverage: number;
    userVsFriends: number;
    cityAverage: number;
    globalAverage: number;
  };
  recommendations: {
    id: string;
    title: string;
    description: string;
    potentialSaving: number;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
  }[];
  achievements: {
    nextMilestone: {
      title: string;
      progress: number;
      target: number;
    };
    recentUnlocks: unknown[];
  };
}

interface HeatmapData {
  date: string;
  value: number;
  day: number;
  week: number;
}

const { width } = Dimensions.get('window');
const chartWidth = width - 32;

// Color constants to avoid literals
const COLORS = {
  white: 'white',
  black: '#000',
  whiteTransparent30: 'rgba(255, 255, 255, 0.3)',
  whiteTransparent50: 'rgba(255, 255, 255, 0.5)',
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
} as const;

export const AdvancedInsightsDashboard: React.FC = () => {
  const theme = useTheme();
  const carbonData = useSelector((state: { carbon: unknown }) => state.carbon);

  const [insights, setInsights] = useState<InsightData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'week' | 'month' | 'year'
  >('month');
  const [_selectedMetric] = useState<
    'carbon' | 'energy' | 'transport' | 'waste'
  >('carbon');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.easy;
      case 'medium':
        return COLORS.medium;
      case 'hard':
        return COLORS.hard;
      default:
        return COLORS.easy;
    }
  };

  const loadInsightData = useCallback(async () => {
    let isCancelled = false;

    try {
      setIsLoading(true);

      // Create promises for parallel execution
      const predictionPromise = generatePredictions();
      const trendsPromise = analyzeTrends();
      const comparativePromise = getComparativeData();
      const recommendationsPromise = generateRecommendations();
      const achievementsPromise = getAchievementInsights();
      const heatmapPromise = generateHeatmapData();

      // Execute all operations in parallel for better performance
      const [
        predictions,
        trends,
        comparative,
        recommendations,
        achievements,
        heatmap,
      ] = await Promise.all([
        predictionPromise,
        trendsPromise,
        comparativePromise,
        recommendationsPromise,
        achievementsPromise,
        heatmapPromise,
      ]);

      // Check if component is still mounted
      if (!isCancelled) {
        setInsights({
          predictedCarbon: predictions,
          trendAnalysis: trends,
          comparativeData: comparative,
          recommendations,
          achievements,
        });

        setHeatmapData(heatmap);
      }
    } catch (error) {
      if (!isCancelled) {
        loggingService.error('Failed to load insight data:', { error });
        Alert.alert('Error', 'Failed to load insights. Please try again.');
      }
    } finally {
      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [
    generatePredictions,
    analyzeTrends,
    getComparativeData,
    generateRecommendations,
    getAchievementInsights,
    generateHeatmapData,
  ]);

  useEffect(() => {
    void loadInsightData();
  }, [loadInsightData]);

  const generatePredictions = useCallback(async (): Promise<number[]> => {
    try {
      // Use ML service to predict future carbon footprint
      const historicalData = carbonData?.history;
      if (!Array.isArray(historicalData)) {
        loggingService.warn('Historical data is not available or invalid');
        return Array.from(
          { length: 30 },
          (_, i) => Math.random() * 5 + 15 + Math.sin(i / 7) * 2,
        );
      }

      const inputData = historicalData
        .slice(-30)
        .map(
          (entry: {
            total?: number;
            timestamp?: number;
            transport?: number;
            energy?: number;
            food?: number;
            waste?: number;
            date?: string;
          }) => {
            if (!entry || typeof entry !== 'object') {
              loggingService.warn('Invalid historical data entry:', { entry });
              return null;
            }

            return {
              transport:
                typeof entry.transport === 'number' ? entry.transport : 0,
              energy: typeof entry.energy === 'number' ? entry.energy : 0,
              food: typeof entry.food === 'number' ? entry.food : 0,
              waste: typeof entry.waste === 'number' ? entry.waste : 0,
              date: entry.date ?? new Date().toISOString(),
            };
          },
        )
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (inputData.length === 0) {
        loggingService.info(
          'No valid historical data found, generating mock predictions',
        );
        return Array.from(
          { length: 30 },
          (_, i) => Math.random() * 5 + 15 + Math.sin(i / 7) * 2,
        );
      }

      const predictions = await mlCarbonPrediction.predictFutureFootprint(
        inputData,
        30,
      );

      if (!Array.isArray(predictions) || predictions.length === 0) {
        loggingService.warn(
          'ML prediction returned invalid data, using fallback',
        );
        return Array.from({ length: 30 }, () => Math.random() * 5 + 15);
      }

      return predictions.map(p => {
        if (p && typeof p.totalCarbon === 'number' && !isNaN(p.totalCarbon)) {
          return Math.max(0, p.totalCarbon); // Ensure non-negative values
        }
        loggingService.warn('Invalid prediction data point:', { p });
        return Math.random() * 5 + 15; // Fallback for invalid predictions
      });
    } catch (error) {
      loggingService.error('Prediction generation failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return Array.from({ length: 30 }, () => Math.random() * 5 + 15);
    }
  }, [carbonData]);

  const analyzeTrends = useCallback(async () => {
    try {
      const historyData = carbonData?.history;
      if (!Array.isArray(historyData) || historyData.length < 14) {
        loggingService.info('Insufficient historical data for trend analysis');
        return {
          direction: 'stable' as const,
          percentage: 0,
          timeframe: '2 weeks',
        };
      }

      const recentData = historyData.slice(-14);
      const olderData = historyData.slice(-28, -14);

      if (recentData.length === 0 || olderData.length === 0) {
        return {
          direction: 'stable' as const,
          percentage: 0,
          timeframe: '2 weeks',
        };
      }

      const calculateAverage = (data: unknown[]): number => {
        const validEntries = data.filter(
          (entry): entry is { total: number } =>
            entry &&
            typeof entry === 'object' &&
            'total' in entry &&
            typeof (entry as { total: unknown }).total === 'number' &&
            !isNaN((entry as { total: number }).total),
        );

        if (validEntries.length === 0) {
          loggingService.warn('No valid entries found for trend calculation');
          return 0;
        }

        const sum = validEntries.reduce((acc, entry) => acc + entry.total, 0);
        return sum / validEntries.length;
      };

      const recentAvg = calculateAverage(recentData);
      const olderAvg = calculateAverage(olderData);

      if (olderAvg === 0) {
        loggingService.warn(
          'Division by zero in trend analysis, using stable trend',
        );
        return {
          direction: 'stable' as const,
          percentage: 0,
          timeframe: '2 weeks',
        };
      }

      const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

      // Ensure percentage is valid
      const validPercentage = isNaN(percentageChange)
        ? 0
        : Math.abs(percentageChange);

      return {
        direction:
          percentageChange > 5
            ? 'increasing'
            : percentageChange < -5
              ? 'decreasing'
              : 'stable',
        percentage: Math.min(validPercentage, 1000), // Cap at 1000% for extreme cases
        timeframe: '2 weeks',
      };
    } catch (error) {
      loggingService.error('Error in trend analysis:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        direction: 'stable' as const,
        percentage: 0,
        timeframe: '2 weeks',
      };
    }
  }, [carbonData]);

  const getComparativeData = useCallback(async () => {
    try {
      // Mock comparative data - in real app, this would come from analytics service
      const currentFootprint = carbonData?.currentFootprint;
      let userTotal = 20; // Default fallback

      if (
        currentFootprint &&
        typeof currentFootprint.total === 'number' &&
        !isNaN(currentFootprint.total)
      ) {
        userTotal = Math.max(0, currentFootprint.total); // Ensure non-negative
      } else {
        loggingService.warn(
          'Invalid current footprint data, using default value',
        );
      }

      const cityAverage = 25;
      const friendsAverage = 22;
      const globalAverage = 28;

      return {
        userVsAverage: cityAverage > 0 ? userTotal / cityAverage : 1,
        userVsFriends: friendsAverage > 0 ? userTotal / friendsAverage : 1,
        cityAverage,
        globalAverage,
      };
    } catch (error) {
      loggingService.error('Error in comparative data calculation:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        userVsAverage: 1,
        userVsFriends: 1,
        cityAverage: 25,
        globalAverage: 28,
      };
    }
  }, [carbonData]);

  const generateRecommendations = useCallback(async () => {
    try {
      const recommendations = [];

      // IoT-based recommendations with error handling
      try {
        const connectedDevices = iotIntegrationService.getConnectedDevices();
        if (Array.isArray(connectedDevices)) {
          const thermostat = connectedDevices.find(
            d => d && typeof d === 'object' && d.type === 'thermostat',
          );
          if (thermostat) {
            recommendations.push({
              id: 'thermostat_optimization',
              title: 'Optimize Thermostat Settings',
              description: 'Lower your thermostat by 2°F to save energy',
              potentialSaving: 2.5,
              difficulty: 'easy' as const,
              category: 'Energy',
            });
          }
        }
      } catch (iotError) {
        loggingService.warn(
          'IoT service error, skipping IoT recommendations:',
          { iotError },
        );
      }

      // Transportation recommendations with safe property access
      const transportValue = carbonData?.transport;
      const energyValue = carbonData?.energy;

      if (
        typeof transportValue === 'number' &&
        typeof energyValue === 'number' &&
        transportValue > energyValue
      ) {
        recommendations.push({
          id: 'transport_reduction',
          title: 'Try Public Transportation',
          description: 'Replace 2 car trips per week with public transport',
          potentialSaving: 3.8,
          difficulty: 'medium' as const,
          category: 'Transport',
        });
      }

      // Always include baseline recommendations
      recommendations.push(
        {
          id: 'plant_based_meals',
          title: 'Add Plant-Based Meals',
          description: 'Replace 2 meat meals per week with plant-based options',
          potentialSaving: 4.2,
          difficulty: 'easy' as const,
          category: 'Food',
        },
        {
          id: 'recycling_improvement',
          title: 'Improve Recycling Habits',
          description: 'Ensure all recyclable materials are properly sorted',
          potentialSaving: 1.8,
          difficulty: 'easy' as const,
          category: 'Waste',
        },
      );

      // Validate recommendations
      const validRecommendations = recommendations.filter(
        rec =>
          rec &&
          typeof rec.id === 'string' &&
          typeof rec.title === 'string' &&
          typeof rec.potentialSaving === 'number' &&
          !isNaN(rec.potentialSaving),
      );

      return validRecommendations.slice(0, 4); // Top 4 recommendations
    } catch (error) {
      loggingService.error('Error generating recommendations:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Return basic fallback recommendations
      return [
        {
          id: 'energy_saving',
          title: 'Basic Energy Saving',
          description: 'Turn off lights when not in use',
          potentialSaving: 1.5,
          difficulty: 'easy' as const,
          category: 'Energy',
        },
        {
          id: 'water_conservation',
          title: 'Water Conservation',
          description: 'Take shorter showers to save energy',
          potentialSaving: 2.0,
          difficulty: 'easy' as const,
          category: 'Energy',
        },
      ];
    }
  }, [carbonData]);

  const getAchievementInsights = useCallback(async () => {
    const currentTotal = carbonData.currentFootprint?.total ?? 20;
    const nextMilestones = [
      { title: 'Carbon Conscious', target: 15, icon: '🌱' },
      { title: 'Eco Warrior', target: 12, icon: '🌿' },
      { title: 'Planet Protector', target: 8, icon: '🌍' },
    ];

    const nextMilestone =
      nextMilestones.find(m => currentTotal > m.target) ?? nextMilestones[0];

    return {
      nextMilestone: {
        ...nextMilestone,
        progress: Math.max(
          0,
          (nextMilestone.target - currentTotal) / nextMilestone.target,
        ),
      },
      recentUnlocks: [], // Would come from achievement system
    };
  }, [carbonData]);

  const generateHeatmapData = useCallback(async (): Promise<HeatmapData[]> => {
    // Generate 52 weeks of data for yearly heatmap
    return Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);

      return {
        date: date.toISOString().split('T')[0],
        value: Math.random() * 30 + 10,
        day: date.getDay(),
        week: Math.floor(i / 7),
      };
    }).reverse();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsightData();
    setRefreshing(false);
  }, [loadInsightData]);

  const renderTimeframeSelector = () => (
    <View
      style={[
        styles.selectorContainer,
        { backgroundColor: theme.colors.surface },
      ]}
      accessible
      accessibilityRole='radiogroup'
      accessibilityLabel='Timeframe selector'
      accessibilityHint='Choose time period for data analysis'
    >
      {(['week', 'month', 'year'] as const).map(timeframe => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.selectorButton,
            selectedTimeframe === timeframe && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
          accessible
          accessibilityRole='radio'
          accessibilityState={{ selected: selectedTimeframe === timeframe }}
          accessibilityLabel={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} timeframe`}
          accessibilityHint={`Select ${timeframe} view for carbon data analysis`}
        >
          <Text
            style={[
              styles.selectorText,
              {
                color:
                  selectedTimeframe === timeframe
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
              },
            ]}
            accessible={false}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPredictionChart = () => {
    if (!insights) return null;

    const chartData = {
      labels: insights.predictedCarbon.map((_, i) =>
        i % 5 === 0 ? `Day ${i + 1}` : '',
      ),
      datasets: [
        {
          data: insights.predictedCarbon,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View
        style={[
          styles.chartContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          30-Day Carbon Prediction
        </Text>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (_opacity = 1) => theme.colors.onSurface,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
        />
      </View>
    );
  };

  const renderTrendAnalysis = () => {
    if (!insights) return null;

    const { trendAnalysis } = insights;
    const trendIcon =
      trendAnalysis.direction === 'increasing'
        ? 'trending-up'
        : trendAnalysis.direction === 'decreasing'
          ? 'trending-down'
          : 'remove';
    const trendColor =
      trendAnalysis.direction === 'increasing'
        ? '#FF5722'
        : trendAnalysis.direction === 'decreasing'
          ? '#4CAF50'
          : '#FF9800';

    return (
      <View
        style={[
          styles.trendContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.trendHeader}>
          <Ionicons name={trendIcon} size={24} color={trendColor} />
          <Text style={[styles.trendTitle, { color: theme.colors.onSurface }]}>
            Trend Analysis
          </Text>
        </View>
        <Text style={[styles.trendText, { color: theme.colors.onSurface }]}>
          Your carbon footprint is{' '}
          <Text style={[styles.boldText, { color: trendColor }]}>
            {trendAnalysis.direction}
          </Text>
          {' by '}
          {trendAnalysis.percentage.toFixed(1)}% over the last{' '}
          {trendAnalysis.timeframe}
        </Text>
      </View>
    );
  };

  const renderComparativeChart = () => {
    if (!insights) return null;

    const { comparativeData } = insights;
    const userData = carbonData.currentFootprint?.total ?? 20;

    const chartData = {
      labels: ['You', 'Friends\nAvg', 'City\nAvg', 'Global\nAvg'],
      datasets: [
        {
          data: [
            userData,
            comparativeData.cityAverage * comparativeData.userVsFriends,
            comparativeData.cityAverage,
            comparativeData.globalAverage,
          ],
        },
      ],
    };

    return (
      <View
        style={[
          styles.chartContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Comparative Analysis
        </Text>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={220}
          yAxisLabel=''
          yAxisSuffix=' kg'
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (_opacity = 1) => theme.colors.onSurface,
            barPercentage: 0.6,
          }}
        />
      </View>
    );
  };

  const renderCarbonHeatmap = () => (
    <View
      style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}
    >
      <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
        Carbon Intensity Heatmap
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmapContainer}>
          {Array.from({ length: 52 }, (_, week) => (
            <View key={week} style={styles.heatmapWeek}>
              {Array.from({ length: 7 }, (_, day) => {
                const dataPoint = heatmapData.find(
                  d => d.week === week && d.day === day,
                );
                const intensity = dataPoint
                  ? Math.min(1, dataPoint.value / 30)
                  : 0;

                return (
                  <View
                    key={day}
                    style={[
                      styles.heatmapDay,
                      {
                        backgroundColor: `rgba(76, 175, 80, ${intensity})`,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.heatmapLegend}>
        <Text style={[styles.legendText, { color: theme.colors.outline }]}>
          Less
        </Text>
        <View style={styles.legendScale}>
          {Array.from({ length: 5 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.legendSquare,
                { backgroundColor: `rgba(76, 175, 80, ${(i + 1) * 0.2})` },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: theme.colors.outline }]}>
          More
        </Text>
      </View>
    </View>
  );

  const renderRecommendations = () => {
    if (!insights) return null;

    return (
      <View
        style={[
          styles.recommendationsContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Smart Recommendations
        </Text>
        {insights.recommendations.map(rec => (
          <View key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text
                style={[
                  styles.recommendationTitle,
                  { color: theme.colors.onSurface },
                ]}
              >
                {rec.title}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(rec.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {rec.difficulty.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.recommendationDescription,
                { color: theme.colors.outline },
              ]}
            >
              {rec.description}
            </Text>
            <View style={styles.recommendationFooter}>
              <View style={styles.savingInfo}>
                <Ionicons name='leaf' size={16} color='#4CAF50' />
                <Text
                  style={[styles.savingText, { color: theme.colors.onSurface }]}
                >
                  Save {rec.potentialSaving} kg CO₂
                </Text>
              </View>
              <Text
                style={[styles.categoryText, { color: theme.colors.primary }]}
              >
                {rec.category}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAchievementProgress = () => {
    if (!insights) return null;

    const { nextMilestone } = insights.achievements;

    return (
      <View
        style={[
          styles.achievementContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Next Milestone
        </Text>
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneHeader}>
            <span role='img' aria-label='trophy emoji'>
              🏆
            </span>
            <View style={styles.milestoneInfo}>
              <Text
                style={[
                  styles.milestoneTitle,
                  { color: theme.colors.onSurface },
                ]}
              >
                {nextMilestone.title}
              </Text>
              <Text
                style={[
                  styles.milestoneTarget,
                  { color: theme.colors.outline },
                ]}
              >
                Target: {nextMilestone.target} kg CO₂/month
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.outline },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${nextMilestone.progress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressText, { color: theme.colors.onSurface }]}
            >
              {(nextMilestone.progress * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Generating AI Insights...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderTimeframeSelector()}
      {renderTrendAnalysis()}
      {renderPredictionChart()}
      {renderComparativeChart()}
      {renderCarbonHeatmap()}
      {renderRecommendations()}
      {renderAchievementProgress()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  achievementContainer: {
    borderRadius: 16,
    elevation: 2,
    margin: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    borderRadius: 16,
    elevation: 2,
    margin: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  heatmapContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  heatmapDay: {
    borderRadius: 2,
    height: 12,
    marginBottom: 2,
    width: 12,
  },
  heatmapLegend: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  heatmapWeek: {
    marginRight: 2,
  },
  legendScale: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  legendSquare: {
    borderRadius: 2,
    height: 12,
    marginHorizontal: 1,
    width: 12,
  },
  legendText: {
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  milestoneCard: {
    backgroundColor: COLORS.whiteTransparent50,
    borderRadius: 12,
    padding: 16,
  },
  milestoneHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTarget: {
    fontSize: 12,
    marginTop: 2,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    borderRadius: 4,
    flex: 1,
    height: 8,
    marginRight: 12,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  progressFill: {
    borderRadius: 4,
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  recommendationCard: {
    backgroundColor: COLORS.whiteTransparent50,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationsContainer: {
    borderRadius: 16,
    elevation: 2,
    margin: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savingInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  savingText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectorButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  selectorContainer: {
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    margin: 16,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendContainer: {
    borderRadius: 12,
    elevation: 1,
    margin: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  trendHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 14,
    lineHeight: 20,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdvancedInsightsDashboard;
