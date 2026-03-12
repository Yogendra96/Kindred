import { updateFootprint, updateEcosystem } from '../store/slices/carbonSlice';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { format, subDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDispatch } from 'react-redux';

interface Activity {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  type: 'transportation' | 'food' | 'energy' | 'waste';
  impact: number;
  timestamp: number;
}

interface ActivitySummary {
  totalPoints: number;
  completedActivities: number;
  carbonSaved: number;
  streakDays: number;
  categoryBreakdown: {
    [key: string]: number;
  };
}

const CACHE_KEY = 'activities_cache';
const OFFLINE_ACTIONS_KEY = 'offline_actions';
const screenWidth = Dimensions.get('window').width;

const ActivityTracker: React.FC = () => {
  const { theme } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, _setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [selectedCategory, _setSelectedCategory] = useState<string | null>(
    null,
  );

  const dispatch = useDispatch();

  // Calculate activity summary metrics
  const summary = useMemo((): ActivitySummary => {
    const filteredActivities = activities.filter(
      activity =>
        isWithinInterval(new Date(activity.timestamp), dateRange) &&
        (!selectedCategory || activity.type === selectedCategory),
    );

    return {
      totalPoints: filteredActivities.reduce(
        (sum, activity) => sum + (activity.completed ? activity.points : 0),
        0,
      ),
      completedActivities: filteredActivities.filter(a => a.completed).length,
      carbonSaved: filteredActivities.reduce(
        (sum, activity) => sum + (activity.completed ? activity.impact : 0),
        0,
      ),
      streakDays: calculateStreak(filteredActivities),
      categoryBreakdown: filteredActivities.reduce(
        (acc, activity) => ({
          ...acc,
          [activity.type]:
            (acc[activity.type] || 0) + (activity.completed ? 1 : 0),
        }),
        {},
      ),
    };
  }, [activities, dateRange, selectedCategory]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const dates = eachDayOfInterval(dateRange);
    const data = dates.map(date => {
      const dayActivities = activities.filter(
        activity =>
          format(new Date(activity.timestamp), 'yyyy-MM-dd') ===
            format(date, 'yyyy-MM-dd') &&
          activity.completed &&
          (!selectedCategory || activity.type === selectedCategory),
      );

      return {
        date: format(date, 'MMM dd'),
        impact: dayActivities.reduce(
          (sum, activity) => sum + activity.impact,
          0,
        ),
      };
    });

    return {
      labels: data.map(d => d.date),
      datasets: [
        {
          data: data.map(d => d.impact),
          color: (_opacity = 1) => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  }, [activities, dateRange, selectedCategory, theme]);

  const handleActivityCompletion = useCallback(
    async (activity: Activity, isSync = false) => {
      const user = auth().currentUser;
      if (!user) return;

      try {
        const updatedActivities = activities.map(a =>
          a.id === activity.id ? { ...a, completed: !a.completed } : a,
        );

        if (!isOnline && !isSync) {
          // Store action for later sync
          const offlineActions = JSON.parse(
            (await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY)) || '[]',
          );
          offlineActions.push({ activity, timestamp: Date.now() });
          await AsyncStorage.setItem(
            OFFLINE_ACTIONS_KEY,
            JSON.stringify(offlineActions),
          );

          // Update local state
          setActivities(updatedActivities);
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify(updatedActivities),
          );
          return;
        }

        // Update Firestore
        await firestore()
          .collection('daily_activities')
          .doc(user.uid)
          .set({ activities: updatedActivities });

        // Update carbon footprint if completing activity
        if (!activity.completed) {
          dispatch(updateFootprint({ [activity.type]: activity.impact }));

          // Update Ecosystem State (Bio-Digital Twin)
          // Logic: Different activities impact different ecosystem aspects
          let ecosystemUpdates: Partial<
            import('../store/slices/carbonSlice').EcosystemState
          > = {};

          switch (activity.type) {
            case 'transportation':
              ecosystemUpdates = {
                airQuality: Math.min(1.0, 0.05), // Improve air quality
                health: Math.min(1.0, 0.02),
              };
              break;
            case 'food':
              ecosystemUpdates = {
                biodiversity: Math.min(1.0, 0.03),
                health: Math.min(1.0, 0.02),
              };
              break;
            case 'energy':
              ecosystemUpdates = {
                treeCount: 1, // "Plant" a virtual tree
                health: Math.min(1.0, 0.02),
              };
              break;
            case 'waste':
              ecosystemUpdates = {
                waterClarity: Math.min(1.0, 0.05),
                health: Math.min(1.0, 0.02),
              };
              break;
          }

          // Apply updates via Redux
          dispatch(updateEcosystem(ecosystemUpdates));
        }

        setActivities(updatedActivities);
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify(updatedActivities),
        );
        setError(null);
      } catch (err) {
        console.error('Error updating activity:', err);
        setError('Failed to update activity');
      }
    },
    [activities, isOnline, dispatch],
  );

  const syncOfflineActions = useCallback(async () => {
    try {
      const offlineActions = await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY);
      if (offlineActions) {
        const actions = JSON.parse(offlineActions);
        for (const action of actions) {
          await handleActivityCompletion(action.activity, true);
        }
        await AsyncStorage.removeItem(OFFLINE_ACTIONS_KEY);
      }
    } catch (err) {
      console.error('Error syncing offline actions:', err);
    }
  }, [handleActivityCompletion]);

  const fetchActivities = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const snapshot = await firestore()
        .collection('daily_activities')
        .doc(user.uid)
        .get();

      const data = snapshot.data()?.activities;
      if (data) {
        setActivities(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
      setError(null);
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cached data and check connectivity
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          setActivities(JSON.parse(cached));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading cached data:', err);
      }
    };

    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        syncOfflineActions();
      }
    });

    loadCachedData();
    fetchActivities();

    return () => {
      unsubscribeNetInfo();
    };
  }, [syncOfflineActions, fetchActivities]);

  const calculateStreak = (filteredActivities: Activity[]): number => {
    let streak = 0;
    let currentDate = new Date();
    const maxDaysToCheck = 365; // Prevent infinite loops

    while (streak < maxDaysToCheck) {
      const hasActivities = filteredActivities.some(
        activity =>
          format(new Date(activity.timestamp), 'yyyy-MM-dd') ===
            format(currentDate, 'yyyy-MM-dd') && activity.completed,
      );

      if (!hasActivities) break;

      streak++;
      currentDate = subDays(currentDate, 1);
    }

    return streak;
  };

  const renderActivity = useCallback(
    ({ item: activity }: { item: Activity }) => (
      <TouchableOpacity
        style={[
          styles.activityCard,
          activity.completed && styles.completedCard,
        ]}
        onPress={() => handleActivityCompletion(activity)}
        disabled={loading}
        accessible={true}
        accessibilityRole='button'
        accessibilityLabel={`${activity.title} activity`}
        accessibilityHint={`${
          activity.completed ? 'Mark as incomplete' : 'Mark as complete'
        }. Earns ${activity.points} points and saves ${activity.impact}kg CO2`}
        accessibilityState={{ selected: activity.completed, disabled: loading }}
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} accessibilityRole='text'>
            {activity.title}
          </Text>
          <Text
            style={styles.points}
            accessibilityLabel={`${activity.points} points`}
          >
            +{activity.points} pts
          </Text>
        </View>
        <Text style={styles.activityDescription} accessibilityRole='text'>
          {activity.description}
        </Text>
        <View style={styles.activityFooter}>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => handleActivityCompletion(activity)}
            disabled={loading}
            accessible={true}
            accessibilityRole='button'
            accessibilityLabel={`${activity.completed ? 'Uncheck' : 'Check'} ${
              activity.title
            }`}
            accessibilityHint={`Mark this activity as ${
              activity.completed ? 'incomplete' : 'complete'
            }`}
            accessibilityState={{
              selected: activity.completed,
              disabled: loading,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={
                activity.completed
                  ? 'checkmark-circle'
                  : 'checkmark-circle-outline'
              }
              size={24}
              color={activity.completed ? '#2ecc71' : '#666'}
              accessibilityElementsHidden={true}
              importantForAccessibility='no-hide-descendants'
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [loading, handleActivityCompletion, theme.colors],
  );

  const renderSummaryCard = () => (
    <View
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      accessible={true}
      accessibilityRole='summary'
    >
      <Text
        style={[styles.cardTitle, { color: theme.colors.text.primary }]}
        accessibilityRole='header'
      >
        Activity Summary
      </Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
            {summary.totalPoints}
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Total Points
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            {summary.carbonSaved.toFixed(1)}t
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            CO₂ Saved
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>
            {summary.streakDays}
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Day Streak
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCharts = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
        Impact Timeline
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={chartData}
          width={screenWidth * 1.5}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (_opacity = 1) => theme.colors.primary,
            labelColor: (_opacity = 1) => theme.colors.text.primary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </View>
  );

  const renderCategoryBreakdown = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
        Category Breakdown
      </Text>
      <View accessible={true} accessibilityRole='image'>
        <Text
          accessibilityLiveRegion='polite'
          accessibilityLabel={`Activity breakdown chart: ${Object.entries(
            summary.categoryBreakdown,
          )
            .map(([category, count]) => `${category}: ${count} activities`)
            .join(', ')}`}
          style={{ position: 'absolute', left: -10000 }}
        >
          Activity categories:{' '}
          {Object.entries(summary.categoryBreakdown)
            .map(([category, count]) => `${category}: ${count}`)
            .join(', ')}
        </Text>
        <BarChart
          data={{
            labels: Object.keys(summary.categoryBreakdown),
            datasets: [
              {
                data: Object.values(summary.categoryBreakdown),
              },
            ],
          }}
          yAxisLabel=''
          yAxisSuffix=''
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (_opacity = 1) => theme.colors.secondary,
            labelColor: (_opacity = 1) => theme.colors.text.primary,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.surface },
        ]}
        accessible={true}
        accessibilityRole='progressbar'
        accessibilityLabel='Loading activities'
        accessibilityLiveRegion='polite'
      >
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.text.primary }]}
          accessibilityLiveRegion='polite'
        >
          Loading your activity data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View
          style={styles.errorContainer}
          accessibilityLiveRegion='polite'
          accessibilityRole='alert'
        >
          <Text style={styles.errorText} accessibilityRole='text'>
            ⚠ {error}
          </Text>
        </View>
      )}
      {!isOnline && (
        <View style={styles.offlineContainer} accessibilityLiveRegion='polite'>
          <Text style={styles.offlineText} accessibilityRole='text'>
            📱 You're offline - changes will sync when back online
          </Text>
        </View>
      )}

      {renderSummaryCard()}
      {renderCharts()}
      {renderCategoryBreakdown()}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
          Recent Activities
        </Text>
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.activitiesContainer}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    borderRadius: 15,
    padding: 20,
    margin: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  activitiesContainer: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  completedCard: {
    backgroundColor: '#e8f5e9',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  checkButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  offlineContainer: {
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  offlineText: {
    color: '#ef6c00',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default React.memo(ActivityTracker);
