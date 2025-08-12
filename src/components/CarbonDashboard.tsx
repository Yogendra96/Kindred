/**
 * @fileoverview Modern Carbon Dashboard Component
 * 
 * Ultra-sophisticated carbon footprint dashboard with modern data visualization,
 * animated charts, interactive elements, and comprehensive analytics.
 * Features: Real-time charts, progress tracking, trend analysis, modern design
 *
 * @version 2.0.0 
 * @author Kindred Development Team
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from 'date-fns';

import type { RootState, AppDispatch } from '../store';
import { loadStoredActivities, clearOldStoredActivities } from '../store/slices/carbonSlice';
import type { CarbonActivity } from '../services/CarbonStorageService';
import { carbonStorageService } from '../services/CarbonStorageService';
import { useAdvancedLogging } from '../hooks/useAdvancedLogging';
import { ModernCard } from './modern/ModernCard';
import { 
  ModernDonutChart, 
  ModernBarChart, 
  ModernLineChart, 
  ModernProgressRing, 
  ModernMetricCard 
} from './charts/ModernChartComponents';
import { ModernDesignSystem } from '../design-system/ModernDesignSystem';

interface CarbonDashboardProps {
  onActivityPress?: (activity: CarbonActivity) => void;
  onAddActivity?: () => void;
  period?: 'week' | 'month' | 'year' | 'all';
  theme?: typeof ModernDesignSystem.LightTheme;
}

interface CategoryTotals {
  transport: number;
  energy: number;
  food: number;
  total: number;
}

interface TrendData {
  date: string;
  value: number;
  label: string;
}

const CarbonDashboard: React.FC<CarbonDashboardProps> = ({
  onActivityPress,
  onAddActivity,
  period = 'month',
  theme = ModernDesignSystem.LightTheme,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { activities, loading, error } = useSelector((state: RootState) => state.carbon);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>(period);
  const [storageStats, setStorageStats] = useState<{
    totalActivities: number;
    unsyncedActivities: number;
    storageSize: number;
  } | null>(null);
  const [dailyGoal] = useState(5); // kg CO₂ daily goal

  const log = useAdvancedLogging({
    component: 'CarbonDashboard',
    screen: 'HomeScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
  });

  // Load activities on component mount
  useEffect(() => {
    dispatch(loadStoredActivities());
    loadStorageStats();
  }, [dispatch]);

  // Load storage statistics
  const loadStorageStats = async () => {
    try {
      const stats = await carbonStorageService.getStorageStats();
      setStorageStats({
        totalActivities: stats.totalActivities,
        unsyncedActivities: stats.unsyncedActivities,
        storageSize: stats.storageSize,
      });
    } catch (error) {
      log.trackError('storage_stats_load_failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Filter activities by selected period
  const filteredActivities = useMemo(() => {
    if (selectedPeriod === 'all') {
      return activities;
    }

    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        return activities;
    }

    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }, [activities, selectedPeriod]);

  // Calculate totals for the selected period
  const periodTotals = useMemo((): CategoryTotals => {
    const totals = { transport: 0, energy: 0, food: 0, total: 0 };

    for (const activity of filteredActivities) {
      const emissions = activity.emissions.carbon_footprint_kg;
      const activityType = activity.type as keyof Omit<CategoryTotals, 'total'>;
      if (activityType in totals) {
        totals[activityType] += emissions;
        totals.total += emissions;
      }
    }

    return totals;
  }, [filteredActivities]);

  // Generate trend data for line chart
  const trendData = useMemo((): TrendData[] => {
    if (selectedPeriod === 'all') return [];

    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    const trendData: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayActivities = activities.filter((activity: CarbonActivity) => {
        const activityDate = new Date(activity.timestamp);
        return activityDate.toDateString() === date.toDateString();
      });

      const dayTotal = dayActivities.reduce((sum: number, activity: CarbonActivity) => 
        sum + activity.emissions.carbon_footprint_kg, 0);

      trendData.push({
        date: date.toISOString(),
        value: dayTotal,
        label: format(date, selectedPeriod === 'year' ? 'MMM' : 'dd'),
      });
    }

    return trendData;
  }, [activities, selectedPeriod]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (periodTotals.total === 0) return [];

    return [
      {
        label: 'Transport',
        value: periodTotals.transport,
        color: theme.colors.error,
        category: 'transport',
      },
      {
        label: 'Energy',
        value: periodTotals.energy,
        color: theme.colors.warning,
        category: 'energy',
      },
      {
        label: 'Food',
        value: periodTotals.food,
        color: theme.colors.success,
        category: 'food',
      },
    ].filter(item => item.value > 0);
  }, [periodTotals, theme]);

  // Calculate progress toward daily goal
  const todayEmissions = useMemo(() => {
    const today = new Date().toDateString();
    return activities
      .filter((activity: CarbonActivity) => new Date(activity.timestamp).toDateString() === today)
      .reduce((sum: number, activity: CarbonActivity) => sum + activity.emissions.carbon_footprint_kg, 0);
  }, [activities]);

  // Calculate previous period for comparison
  const previousPeriodTotals = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = subDays(now, 14);
        endDate = subDays(now, 7);
        break;
      case 'month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'year':
        startDate = startOfYear(subMonths(now, 12));
        endDate = endOfYear(subMonths(now, 12));
        break;
      default:
        return 0;
    }

    return activities
      .filter((activity: CarbonActivity) => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate && activityDate <= endDate;
      })
      .reduce((sum: number, activity: CarbonActivity) => sum + activity.emissions.carbon_footprint_kg, 0);
  }, [activities, selectedPeriod]);

  const periodChange = previousPeriodTotals > 0 
    ? ((periodTotals.total - previousPeriodTotals) / previousPeriodTotals) * 100
    : 0;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await dispatch(loadStoredActivities());
      await loadStorageStats();
      
      log.trackBusinessEvent('carbon_dashboard_refreshed', {
        period: selectedPeriod,
        activitiesCount: activities.length,
        totalEmissions: periodTotals.total,
      });
    } catch (error) {
      log.trackError('carbon_dashboard_refresh_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        period: selectedPeriod,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle clear old activities
  const handleClearOldActivities = () => {
    Alert.alert(
      'Clear Old Activities',
      'This will remove activities older than 90 days from local storage. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearOldStoredActivities(90));
              await loadStorageStats();
              
              log.trackBusinessEvent('carbon_activities_cleared', {
                daysKept: 90,
                previousCount: storageStats?.totalActivities || 0,
                newCount: activities.length,
              });
            } catch (error) {
              log.trackError('clear_activities_failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              
              Alert.alert('Error', 'Failed to clear old activities. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Format number with units
  const formatEmissions = (value: number): string => {
    if (value < 0.01) return '< 0.01 kg';
    if (value < 1) return `${value.toFixed(2)} kg`;
    if (value < 1000) return `${value.toFixed(1)} kg`;
    return `${(value / 1000).toFixed(2)} t`;
  };

  // Format storage size
  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get color for activity type using modern design system
  const getActivityColor = (type: CarbonActivity['type']): string => {
    switch (type) {
      case 'transport': return theme.colors.error;
      case 'energy': return theme.colors.warning;
      case 'food': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  // Get trend direction and percentage
  const getTrendInfo = () => {
    if (periodChange === 0) return { direction: 'stable' as const, text: 'No change' };
    const direction = periodChange > 0 ? 'up' as const : 'down' as const;
    const text = `${Math.abs(periodChange).toFixed(1)}% vs last ${selectedPeriod}`;
    return { direction, text };
  };

  // Render modern overview metrics
  const renderOverviewMetrics = () => {
    const trend = getTrendInfo();
    
    return (
      <ModernCard
        variant="elevated"
        theme={theme}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View style={modernStyles.metricsGrid}>
          <ModernMetricCard
            title="Today's Impact"
            value={formatEmissions(todayEmissions)}
            trend={todayEmissions > dailyGoal ? 'up' : todayEmissions < dailyGoal * 0.8 ? 'down' : 'stable'}
            trendValue={`Goal: ${formatEmissions(dailyGoal)}`}
            color={ModernDesignSystem.CarbonDesignTokens.getCarbonColor(todayEmissions)}
            theme={theme}
            icon={<Text style={{ fontSize: 24 }}>{ModernDesignSystem.CarbonDesignTokens.getCarbonIcon(todayEmissions)}</Text>}
          />
          
          <ModernMetricCard
            title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Total`}
            value={formatEmissions(periodTotals.total)}
            trend={trend.direction}
            trendValue={trend.text}
            color={theme.colors.primary}
            theme={theme}
            icon={<Text style={{ fontSize: 24 }}>📊</Text>}
          />
        </View>
        
        {/* Progress Ring */}
        <View style={modernStyles.progressContainer}>
          <ModernProgressRing
            progress={Math.min((todayEmissions / dailyGoal) * 100, 100)}
            size={100}
            strokeWidth={8}
            color={ModernDesignSystem.CarbonDesignTokens.getCarbonColor(todayEmissions)}
            theme={theme}
            animated={true}
          >
            <View style={modernStyles.progressContent}>
              <Text style={[modernStyles.progressValue, { color: theme.colors.text }]}>
                {((todayEmissions / dailyGoal) * 100).toFixed(0)}%
              </Text>
              <Text style={[modernStyles.progressLabel, { color: theme.colors.textSecondary }]}>
                of goal
              </Text>
            </View>
          </ModernProgressRing>
          
          <View style={modernStyles.progressDetails}>
            <Text style={[modernStyles.goalText, { color: theme.colors.text }]}>
              Daily Carbon Goal
            </Text>
            <Text style={[modernStyles.goalValue, { color: theme.colors.textSecondary }]}>
              {formatEmissions(dailyGoal)} per day
            </Text>
            <Text style={[modernStyles.remainingText, { color: theme.colors.primary }]}>
              {formatEmissions(Math.max(0, dailyGoal - todayEmissions))} remaining
            </Text>
          </View>
        </View>
      </ModernCard>
    );
  };

  // Render period selector using modern design
  const renderPeriodSelector = () => (
    <ModernCard
      variant="outlined"
      theme={theme}
      style={{ marginHorizontal: 16, marginBottom: 16 }}
    >
      <View style={modernStyles.periodSelector}>
        {(['week', 'month', 'year', 'all'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              modernStyles.periodButton,
              { 
                backgroundColor: selectedPeriod === p 
                  ? theme.colors.primary 
                  : theme.colors.backgroundSecondary,
                borderColor: selectedPeriod === p 
                  ? theme.colors.primary 
                  : theme.colors.border,
              }
            ]}
            onPress={() => {
              setSelectedPeriod(p);
              log.trackButtonPress('period_selected', { period: p });
            }}
          >
            <Text
              style={[
                modernStyles.periodButtonText,
                {
                  color: selectedPeriod === p 
                    ? theme.colors.textInverse 
                    : theme.colors.text,
                  fontWeight: selectedPeriod === p ? '600' : '500',
                }
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ModernCard>
  );

  // Render modern charts section
  const renderChartsSection = () => (
    <ModernCard
      title="Emission Breakdown"
      variant="elevated"
      theme={theme}
      style={{ marginHorizontal: 16, marginBottom: 16 }}
    >
      {chartData.length > 0 ? (
        <View>
          {/* Donut Chart for category breakdown */}
          <ModernDonutChart
            data={chartData}
            title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Breakdown`}
            subtitle={`Total: ${formatEmissions(periodTotals.total)} CO₂`}
            height={240}
            theme={theme}
            animated={true}
            interactive={true}
            showLabels={true}
            centerContent={
              <View style={modernStyles.donutCenter}>
                <Text style={[modernStyles.donutCenterValue, { color: theme.colors.text }]}>
                  {formatEmissions(periodTotals.total)}
                </Text>
                <Text style={[modernStyles.donutCenterLabel, { color: theme.colors.textSecondary }]}>
                  CO₂
                </Text>
              </View>
            }
            accessibilityLabel={`Carbon footprint breakdown showing ${chartData.length} categories`}
          />
          
          {/* Bar Chart for category comparison */}
          <ModernBarChart
            data={chartData}
            title="Category Comparison"
            height={180}
            theme={theme}
            animated={true}
            showValues={true}
            gradientColors={true}
            accessibilityLabel="Bar chart comparing emissions by category"
          />
        </View>
      ) : (
        <View style={modernStyles.emptyChart}>
          <Text style={[modernStyles.emptyChartText, { color: theme.colors.textSecondary }]}>
            No data available for the selected period
          </Text>
          <Text style={[modernStyles.emptyChartSubtext, { color: theme.colors.textTertiary }]}>
            Add some activities to see your carbon breakdown
          </Text>
        </View>
      )}
    </ModernCard>
  );

  // Render trend analysis
  const renderTrendAnalysis = () => {
    if (selectedPeriod === 'all' || trendData.length === 0) return null;

    return (
      <ModernCard
        title="Emission Trends"
        variant="elevated"
        theme={theme}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <ModernLineChart
          data={trendData}
          title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Trend`}
          subtitle="Daily carbon emissions over time"
          height={200}
          theme={theme}
          animated={true}
          smoothLine={true}
          showDots={true}
          showArea={true}
          gridLines={true}
          accessibilityLabel={`Line chart showing emission trends over the last ${selectedPeriod}`}
        />
        
        <View style={modernStyles.trendInsights}>
          <Text style={[modernStyles.insightTitle, { color: theme.colors.text }]}>
            Trend Insights
          </Text>
          <Text style={[modernStyles.insightText, { color: theme.colors.textSecondary }]}>
            {periodChange > 0 
              ? `📈 Emissions increased by ${Math.abs(periodChange).toFixed(1)}% compared to the previous ${selectedPeriod}`
              : periodChange < 0
              ? `📉 Great job! Emissions decreased by ${Math.abs(periodChange).toFixed(1)}% compared to the previous ${selectedPeriod}`
              : `➡️ Emissions remained stable compared to the previous ${selectedPeriod}`
            }
          </Text>
        </View>
      </ModernCard>
    );
  };

  // Render recent activities
  const renderRecentActivities = () => (
    <View style={styles.activitiesContainer}>
      <View style={styles.activitiesHeader}>
        <Text style={styles.activitiesTitle}>Recent Activities</Text>
        {onAddActivity && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              onAddActivity();
              log.trackButtonPress('add_activity', { from: 'dashboard' });
            }}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No activities found for the selected period
          </Text>
          {onAddActivity && (
            <TouchableOpacity 
              style={styles.emptyStateButton} 
              onPress={onAddActivity}
            >
              <Text style={styles.emptyStateButtonText}>Add Your First Activity</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.activitiesList}>
          {filteredActivities.slice(0, 10).map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityItem}
              onPress={() => {
                onActivityPress?.(activity);
                log.trackButtonPress('activity_pressed', {
                  activityType: activity.type,
                  emissions: activity.emissions.carbon_footprint_kg,
                });
              }}
            >
              <View 
                style={[
                  styles.activityIndicator, 
                  { backgroundColor: getActivityColor(activity.type) }
                ]} 
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityDate}>
                  {format(new Date(activity.timestamp), 'MMM d, yyyy · h:mm a')}
                </Text>
              </View>
              <View style={styles.activityEmissions}>
                <Text style={styles.activityEmissionsValue}>
                  {formatEmissions(activity.emissions.carbon_footprint_kg)}
                </Text>
                {!activity.synced && (
                  <View style={styles.unsyncedIndicator}>
                    <Text style={styles.unsyncedText}>●</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {filteredActivities.length > 10 && (
            <Text style={styles.moreActivitiesText}>
              +{filteredActivities.length - 10} more activities
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Render storage info
  const renderStorageInfo = () => storageStats && (
    <View style={styles.storageInfo}>
      <Text style={styles.storageTitle}>Storage Statistics</Text>
      <View style={styles.storageStats}>
        <Text style={styles.storageStat}>
          Total: {storageStats.totalActivities} activities
        </Text>
        <Text style={styles.storageStat}>
          Unsynced: {storageStats.unsyncedActivities}
        </Text>
        <Text style={styles.storageStat}>
          Size: {formatStorageSize(storageStats.storageSize)}
        </Text>
      </View>
      {storageStats.totalActivities > 50 && (
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClearOldActivities}
        >
          <Text style={styles.clearButtonText}>Clear Old Activities</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (error) {
    return (
      <ModernCard
        variant="elevated"
        theme={theme}
        style={{ margin: 16, padding: 24 }}
      >
        <View style={modernStyles.errorContainer}>
          <Text style={[modernStyles.errorTitle, { color: theme.colors.error }]}>
            ⚠️ Unable to Load Data
          </Text>
          <Text style={[modernStyles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[modernStyles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[modernStyles.retryButtonText, { color: theme.colors.textInverse }]}>
              🔄 Retry
            </Text>
          </TouchableOpacity>
        </View>
      </ModernCard>
    );
  }

  return (
    <ScrollView
      style={[modernStyles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || loading.activities}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    >
      {renderPeriodSelector()}
      {renderOverviewMetrics()}
      {renderChartsSection()}
      {renderTrendAnalysis()}
      
      {onAddActivity && (
        <ModernCard
          variant="outlined"
          theme={theme}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
          onPress={onAddActivity}
        >
          <View style={modernStyles.addActivityCard}>
            <Text style={[modernStyles.addActivityText, { color: theme.colors.primary }]}>
              ➕ Track New Carbon Activity
            </Text>
            <Text style={[modernStyles.addActivitySubtext, { color: theme.colors.textSecondary }]}>
              Add transportation, energy, or food activities
            </Text>
          </View>
        </ModernCard>
      )}
      
      {storageStats && (
        <ModernCard
          variant="filled"
          theme={theme}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View style={modernStyles.storageCard}>
            <Text style={[modernStyles.storageTitle, { color: theme.colors.text }]}>
              💾 Storage Status
            </Text>
            <View style={modernStyles.storageStats}>
              <Text style={[modernStyles.storageStat, { color: theme.colors.textSecondary }]}>
                📊 {storageStats.totalActivities} activities stored
              </Text>
              <Text style={[modernStyles.storageStat, { color: theme.colors.textSecondary }]}>
                🔄 {storageStats.unsyncedActivities} pending sync
              </Text>
              <Text style={[modernStyles.storageStat, { color: theme.colors.textSecondary }]}>
                💽 {formatStorageSize(storageStats.storageSize)} used
              </Text>
            </View>
            
            {storageStats.totalActivities > 50 && (
              <TouchableOpacity 
                style={[modernStyles.clearButton, { backgroundColor: theme.colors.warning }]}
                onPress={handleClearOldActivities}
              >
                <Text style={[modernStyles.clearButtonText, { color: theme.colors.textInverse }]}>
                  🧹 Clean Old Data
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ModernCard>
      )}
    </ScrollView>
  );
};

// Modern Styles using Design System
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  
  // Progress Ring Styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  progressDetails: {
    flex: 1,
    marginLeft: 20,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 14,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    borderRadius: ModernDesignSystem.BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: ModernDesignSystem.BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Donut Chart Center
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  donutCenterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Empty Chart State
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChartSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Trend Insights
  trendInsights: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Add Activity Card
  addActivityCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  addActivityText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  addActivitySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Storage Card
  storageCard: {
    alignItems: 'center',
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  storageStats: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  storageStat: {
    fontSize: 14,
    textAlign: 'center',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: ModernDesignSystem.BorderRadius.md,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Error States
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: ModernDesignSystem.BorderRadius.lg,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CarbonDashboard;