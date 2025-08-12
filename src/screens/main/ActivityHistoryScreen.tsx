import React, { useState } from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

interface ActivityItem {
  id: string;
  type: 'transport' | 'energy' | 'food' | 'consumption';
  title: string;
  description: string;
  carbon: number;
  date: string;
  time: string;
}

const ActivityHistoryScreen = () => {
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>(
    'all',
  );

  // Mock data - in a real app, this would come from Redux store or API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'transport',
      title: 'Car Commute',
      description: '15 miles to work',
      carbon: 8.2,
      date: '2025-01-20',
      time: '08:30',
    },
    {
      id: '2',
      type: 'food',
      title: 'Lunch',
      description: 'Grilled chicken salad',
      carbon: 2.1,
      date: '2025-01-20',
      time: '12:15',
    },
    {
      id: '3',
      type: 'energy',
      title: 'Home Energy',
      description: 'Daily electricity usage',
      carbon: 12.5,
      date: '2025-01-19',
      time: '23:59',
    },
    {
      id: '4',
      type: 'consumption',
      title: 'Online Shopping',
      description: 'Clothing purchase with delivery',
      carbon: 15.3,
      date: '2025-01-19',
      time: '16:45',
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'transport':
        return 'car-outline';
      case 'energy':
        return 'flash-outline';
      case 'food':
        return 'restaurant-outline';
      case 'consumption':
        return 'bag-outline';
      default:
        return 'leaf-outline';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'transport':
        return '#FF6B6B';
      case 'energy':
        return '#4ECDC4';
      case 'food':
        return '#45B7D1';
      case 'consumption':
        return '#96CEB4';
      default:
        return '#34C759';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <View
          style={[
            styles.activityIcon,
            { backgroundColor: getActivityColor(item.type) },
          ]}
        >
          <Icon name={getActivityIcon(item.type)} size={20} color='#fff' />
        </View>
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDescription}>{item.description}</Text>
          <Text style={styles.activityDateTime}>
            {formatDate(item.date)} • {item.time}
          </Text>
        </View>
      </View>
      <View style={styles.activityRight}>
        <Text style={styles.carbonAmount}>{item.carbon.toFixed(1)} kg</Text>
        <Text style={styles.carbonLabel}>CO₂</Text>
      </View>
    </View>
  );

  const FilterButton = ({
    label,
    value,
    isSelected,
  }: {
    label: string;
    value: typeof filter;
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
      accessible
      accessibilityRole='button'
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const totalCarbon = activities.reduce(
    (sum, activity) => sum + activity.carbon,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity History</Text>
        <Text style={styles.subtitle}>
          Track your carbon footprint over time
        </Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalCarbon.toFixed(1)} kg</Text>
          <Text style={styles.summaryLabel}>Total CO₂ This Period</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{activities.length}</Text>
          <Text style={styles.summaryLabel}>Activities Logged</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <FilterButton label='All' value='all' isSelected={filter === 'all'} />
        <FilterButton
          label='Daily'
          value='daily'
          isSelected={filter === 'daily'}
        />
        <FilterButton
          label='Weekly'
          value='weekly'
          isSelected={filter === 'weekly'}
        />
        <FilterButton
          label='Monthly'
          value='monthly'
          isSelected={filter === 'monthly'}
        />
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name='leaf-outline' size={48} color='#8E8E93' />
            <Text style={styles.emptyTitle}>No Activities Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your carbon footprint to see your history here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  activityDateTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  activityDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  activityDetails: {
    flex: 1,
  },
  activityIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  activityItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityTitle: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  carbonAmount: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  carbonLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  container: {
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 14,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  filterButton: {
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#34C759',
  },
  filterButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
  },
  summary: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  summaryValue: {
    color: '#34C759',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    color: '#1a1a1a',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default ActivityHistoryScreen;
