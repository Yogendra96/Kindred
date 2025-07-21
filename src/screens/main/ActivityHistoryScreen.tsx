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
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  
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
          <Icon
            name={getActivityIcon(item.type)}
            size={20}
            color='#fff'
          />
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
      style={[
        styles.filterButton,
        isSelected && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
      accessible={true}
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

  const totalCarbon = activities.reduce((sum, activity) => sum + activity.carbon, 0);

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
        <FilterButton label='Daily' value='daily' isSelected={filter === 'daily'} />
        <FilterButton label='Weekly' value='weekly' isSelected={filter === 'weekly'} />
        <FilterButton label='Monthly' value='monthly' isSelected={filter === 'monthly'} />
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  summary: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#34C759',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityDateTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  carbonAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  carbonLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ActivityHistoryScreen;