import { AnalyticsService } from '../services/AnalyticsService';
const analyticsService = AnalyticsService.getInstance();
import { iotIntegrationService } from '../services/IoTIntegrationService';
import { mlCarbonPredictionService } from '../services/MLCarbonPrediction';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useSelector } from 'react-redux';

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
    recentUnlocks: any[];
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

export const AdvancedInsightsDashboard: React.FC = () => {
  const { theme } = useTheme();
  const carbonData = useSelector((state: any) => state.carbon);

  const [insights, setInsights] = useState<InsightData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'week' | 'month' | 'year'
  >('month');
  const [selectedMetric, _setSelectedMetric] = useState<
    'carbon' | 'energy' | 'transport' | 'waste'
  >('carbon');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsightData();
  }, [selectedTimeframe, selectedMetric]);

  const loadInsightData = async () => {
    try {
      setIsLoading(true);

      // Generate predictions using ML service
      const predictions = await generatePredictions();

      // Analyze trends
      const trends = await analyzeTrends();

      // Get comparative data
      const comparative = await getComparativeData();

      // Generate recommendations
      const recommendations = await generateRecommendations();

      // Get achievement data
      const achievements = await getAchievementInsights();

      // Generate heatmap data
      const heatmap = await generateHeatmapData();

      setInsights({
        predictedCarbon: predictions,
        trendAnalysis: trends,
        comparativeData: comparative,
        recommendations,
        achievements,
      });

      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Failed to load insight data:', error);
      Alert.alert('Error', 'Failed to load insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePredictions = async (): Promise<number[]> => {
    try {
      // Use ML service to predict future carbon footprint
      const historicalData = carbonData.history || [];
      const inputData = historicalData.slice(-30).map((entry: any) => ({
        transport: entry.transport || 0,
        energy: entry.energy || 0,
        food: entry.food || 0,
        waste: entry.waste || 0,
        date: entry.date,
      }));

      if (inputData.length === 0) {
        // Generate mock predictions if no historical data
        return Array.from(
          { length: 30 },
          (_, i) => Math.random() * 5 + 15 + Math.sin(i / 7) * 2,
        );
      }

      // MLCarbonPredictionService doesn't have predictFutureFootprint in this version. Use mock data for now.
      return Array.from(
        { length: 30 },
        (_, i) => Math.random() * 5 + 15 + Math.sin(i / 7) * 2,
      );
    } catch (error) {
      console.error('Prediction generation failed:', error);
      return Array.from({ length: 30 }, () => Math.random() * 5 + 15);
    }
  };

  const analyzeTrends = async (): Promise<InsightData['trendAnalysis']> => {
    const recentData = carbonData.history?.slice(-14) || [];
    const olderData = carbonData.history?.slice(-28, -14) || [];

    if (recentData.length === 0 || olderData.length === 0) {
      return {
        direction: 'stable' as const,
        percentage: 0,
        timeframe: '2 weeks',
      };
    }

    const recentAvg =
      recentData.reduce(
        (sum: number, entry: any) => sum + (entry.total || 0),
        0,
      ) / recentData.length;
    const olderAvg =
      olderData.reduce(
        (sum: number, entry: any) => sum + (entry.total || 0),
        0,
      ) / olderData.length;

    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      direction:
        percentageChange > 5
          ? 'increasing'
          : percentageChange < -5
          ? 'decreasing'
          : 'stable',
      percentage: Math.abs(percentageChange),
      timeframe: '2 weeks',
    };
  };

  const getComparativeData = async () => {
    // Mock comparative data - in real app, this would come from analytics service
    const userTotal = carbonData.currentFootprint?.total || 20;

    return {
      userVsAverage: userTotal / 25, // 25 is average
      userVsFriends: userTotal / 22, // 22 is friends average
      cityAverage: 25,
      globalAverage: 28,
    };
  };

  const generateRecommendations = async () => {
    const connectedDevices = iotIntegrationService.getConnectedDevices();
    const recommendations: InsightData['recommendations'] = [];

    // IoT-based recommendations
    const thermostat = connectedDevices.find(d => d.type === 'thermostat');
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

    // Transportation recommendations
    if (carbonData.transport > carbonData.energy) {
      recommendations.push({
        id: 'transport_reduction',
        title: 'Try Public Transportation',
        description: 'Replace 2 car trips per week with public transport',
        potentialSaving: 3.8,
        difficulty: 'medium' as const,
        category: 'Transport',
      });
    }

    // Food recommendations
    recommendations.push({
      id: 'plant_based_meals',
      title: 'Add Plant-Based Meals',
      description: 'Replace 2 meat meals per week with plant-based options',
      potentialSaving: 4.2,
      difficulty: 'easy' as const,
      category: 'Food',
    });

    // Waste recommendations
    recommendations.push({
      id: 'recycling_improvement',
      title: 'Improve Recycling Habits',
      description: 'Ensure all recyclable materials are properly sorted',
      potentialSaving: 1.8,
      difficulty: 'easy' as const,
      category: 'Waste',
    });

    return recommendations.slice(0, 4); // Top 4 recommendations
  };

  const getAchievementInsights = async () => {
    const currentTotal = carbonData.currentFootprint?.total || 20;
    const nextMilestones = [
      { title: 'Carbon Conscious', target: 15, icon: '🌱' },
      { title: 'Eco Warrior', target: 12, icon: '🌿' },
      { title: 'Planet Protector', target: 8, icon: '🌍' },
    ];

    const nextMilestone =
      nextMilestones.find(m => currentTotal > m.target) || nextMilestones[0];

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
  };

  const generateHeatmapData = async (): Promise<HeatmapData[]> => {
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
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsightData();
    setRefreshing(false);
  }, [selectedTimeframe, selectedMetric]);

  const renderTimeframeSelector = () => (
    <View
      style={[
        styles.selectorContainer,
        { backgroundColor: theme.colors.surface },
      ]}
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
          <Text style={{ color: trendColor, fontWeight: 'bold' }}>
            {trendAnalysis.direction}
          </Text>{' '}
          by {trendAnalysis.percentage.toFixed(1)}% over the last{' '}
          {trendAnalysis.timeframe}
        </Text>
      </View>
    );
  };

  const renderComparativeChart = () => {
    if (!insights) return null;

    const { comparativeData } = insights;
    const userData = carbonData.currentFootprint?.total || 20;

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
                  {
                    backgroundColor:
                      rec.difficulty === 'easy'
                        ? '#4CAF50'
                        : rec.difficulty === 'medium'
                        ? '#FF9800'
                        : '#F44336',
                  },
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
            <Text style={styles.milestoneIcon}>🏆</Text>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectorContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
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
  trendContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  trendText: {
    fontSize: 14,
    lineHeight: 20,
  },
  heatmapContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  heatmapWeek: {
    marginRight: 2,
  },
  heatmapDay: {
    width: 12,
    height: 12,
    marginBottom: 2,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendText: {
    fontSize: 12,
  },
  legendScale: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  legendSquare: {
    width: 12,
    height: 12,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  recommendationsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recommendationCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  milestoneCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestoneTarget: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
});

export default AdvancedInsightsDashboard;
