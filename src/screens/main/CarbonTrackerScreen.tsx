import React, { useEffect, useState } from 'react';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';
import { Logger } from '../../services/AdvancedLoggingService';

const CarbonTrackerScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use the advanced logging hook with automatic lifecycle tracking
  const log = useAdvancedLogging({
    component: 'CarbonTrackerScreen',
    screen: 'CarbonTrackerScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
    autoTrackPerformance: true,
  });

  const categories = [
    {
      id: 'transport',
      name: 'Transportation',
      icon: 'car-outline',
      color: '#FF6B6B',
      description: 'Cars, buses, flights, walking',
    },
    {
      id: 'energy',
      name: 'Energy',
      icon: 'flash-outline',
      color: '#4ECDC4',
      description: 'Electricity, heating, cooling',
    },
    {
      id: 'food',
      name: 'Food & Diet',
      icon: 'restaurant-outline',
      color: '#45B7D1',
      description: 'Meals, groceries, eating out',
    },
    {
      id: 'consumption',
      name: 'Consumption',
      icon: 'bag-outline',
      color: '#96CEB4',
      description: 'Shopping, purchases, goods',
    },
  ];

  const handleCategoryPress = (categoryId: string) => {
    log.trackButtonPress(`category_${categoryId}`, {
      categoryId,
      wasSelected: selectedCategory === categoryId,
    });

    // Track state change
    log.trackStateChange('selectedCategory', selectedCategory, categoryId);
    setSelectedCategory(categoryId);

    // TODO: Navigate to specific activity input form
    log.info('TODO: Navigate to activity input form', {
      action: 'navigation_todo',
      targetCategory: categoryId,
      tags: ['todo', 'navigation'],
    });

    // Track business event
    log.trackBusinessEvent('category_selection', {
      categoryId,
      selectionCount: selectedCategory ? 2 : 1, // Track if it's a re-selection
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Your Carbon Impact</Text>
        <Text style={styles.subtitle}>Select a category to log your activities</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { borderColor: category.color },
              selectedCategory === category.id && {
                backgroundColor: `${category.color}20`,
              },
            ]}
            onPress={() => handleCategoryPress(category.id)}
            accessible={true}
            accessibilityRole='button'
            accessibilityLabel={`Track ${category.name}`}
            accessibilityHint={category.description}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                <Icon name={category.icon} size={24} color='#fff' />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.quickActionButton}
          accessible={true}
          accessibilityRole='button'
          accessibilityLabel='Add a commute trip'
        >
          <Icon name='car-outline' size={20} color='#34C759' />
          <Text style={styles.quickActionText}>Add Commute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          accessible={true}
          accessibilityRole='button'
          accessibilityLabel='Log a meal'
        >
          <Icon name='restaurant-outline' size={20} color='#34C759' />
          <Text style={styles.quickActionText}>Log Meal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  categoriesContainer: {
    padding: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickActionButton: {
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
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
});

export default CarbonTrackerScreen;
