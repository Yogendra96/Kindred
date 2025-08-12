import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { eachDayOfInterval, format, isWithinInterval, subDays } from 'date-fns';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useDispatch } from 'react-redux';

import { loggingService } from '../services/LoggingService';
import { updateFootprint } from '../store/slices/carbonSlice';
import { useTheme } from '../theme/ThemeProvider';
import { saveActivityData } from '../utils/carbonCalculator';

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

// Color constants to avoid literals
const COLORS = {
  lightGray: '#f8f8f8',
  mediumGray: '#666',
  darkGray: '#333',
  lightGreen: '#e8f5e9',
  veryLightGray: '#f5f5f5',
  white: '#fff',
  black: '#000',
  green: '#2ecc71',
  red: '#c62828',
  lightRed: '#ffebee',
  orange: '#ef6c00',
  lightOrange: '#fff3e0',
} as const;

const ActivityTracker: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [selectedCategory] = useState<string | null>(null);

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
            (acc[activity.type] ?? 0) + (activity.completed ? 1 : 0),
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

  // Load cached data and check connectivity
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          setActivities(JSON.parse(cached));
          setLoading(false);
        }
      } catch (error_) {
        console.error('Error loading cached data:', error_);
      }
    };

    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        void syncOfflineActions();
      }
    });

    void loadCachedData();
    void fetchActivities();

    return () => {
      unsubscribeNetInfo();
    };
  }, [syncOfflineActions]);

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
    } catch (error_) {
      loggingService.error('Error syncing offline actions', {
        error: error_ instanceof Error ? error_.message : String(error_),
      });
    }
  }, [handleActivityCompletion]);

  const fetchActivities = async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const snapshot = await firestore()
        .collection('daily_activities')
        .doc(user.uid)
        .get();

      if (snapshot.exists) {
        const data = snapshot.data()?.activities ?? [];
        setActivities(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
      setError(null);
    } catch (error_) {
      setError('Failed to load activities');
      loggingService.error('Error fetching activities', {
        error: error_ instanceof Error ? error_.message : String(error_),
      });
    } finally {
      setLoading(false);
    }
  };

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
            (await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY)) ?? '[]',
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
          const impactData = {
            [activity.type]: activity.impact,
          };
          await saveActivityData(impactData);
          dispatch(updateFootprint({ [activity.type]: activity.impact }));
        }

        setActivities(updatedActivities);
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify(updatedActivities),
        );
        setError(null);
      } catch (error_) {
        loggingService.error('Error updating activity', {
          error: error_ instanceof Error ? error_.message : String(error_),
        });
        setError('Failed to update activity');
      }
    },
    [activities, isOnline, dispatch],
  );

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
        accessible
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
            accessible
            accessibilityRole='button'
            accessibilityLabel={`${activity.completed ? 'Uncheck' : 'Check'} ${activity.title}`}
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
              accessibilityElementsHidden
              importantForAccessibility='no-hide-descendants'
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [loading, handleActivityCompletion],
  );

  const renderSummaryCard = () => (
    <View
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      accessible
      accessibilityRole='summary'
    >
      <Text
        style={[styles.cardTitle, { color: theme.colors.text.primary }]}
        accessibilityRole='header'
        accessibilityLevel={2}
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
            backgroundGradient: theme.colors.surface,
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
      <View accessible accessibilityRole='image'>
        <Text
          accessibilityLiveRegion='polite'
          accessibilityLabel={`Activity breakdown chart: ${Object.entries(
            summary.categoryBreakdown,
          )
            .map(([category, count]) => `${category}: ${count} activities`)
            .join(', ')}`}
          style={styles.screenReaderOnly}
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
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradient: theme.colors.surface,
            decimalPlaces: 0,
            color: (_opacity = 1) => theme.colors.secondary,
            labelColor: (_opacity = 1) => theme.colors.text.primary,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          accessibilityLabel='Activity breakdown by category bar chart'
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
        accessible
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
        <View
          style={styles.offlineContainer}
          accessibilityLiveRegion='polite'
          accessibilityRole='status'
        >
          <Text style={styles.offlineText} accessibilityRole='text'>
            <span role='img' aria-label='mobile phone'>
              📱
            </span>
            {'  '}
            You're offline - changes will sync when back online
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
});

ActivityTracker.displayName = 'ActivityTracker';

const styles = StyleSheet.create({
  activitiesContainer: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
  },
  activityDescription: {
    color: COLORS.mediumGray,
    fontSize: 14,
    marginBottom: 10,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityTitle: {
    color: COLORS.darkGray,
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 15,
    margin: 10,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
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
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  checkButton: {
    padding: 5,
  },
  completedCard: {
    backgroundColor: COLORS.lightGreen,
  },
  container: {
    backgroundColor: COLORS.veryLightGray,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
    margin: 20,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  offlineContainer: {
    backgroundColor: COLORS.lightOrange,
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
  offlineText: {
    color: COLORS.orange,
    fontSize: 14,
    textAlign: 'center',
  },
  points: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 'bold',
  },
  screenReaderOnly: {
    left: -10000,
    position: 'absolute',
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
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default ActivityTracker;
