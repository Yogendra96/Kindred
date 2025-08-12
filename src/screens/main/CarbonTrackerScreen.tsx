import React, { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/Ionicons';

import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';
import type { CarbonActivityType } from '../../components/forms/CarbonActivityForm';

const CarbonTrackerScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigation = useNavigation();

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

    // Navigate to specific activity input form
    const activityTypeMap: Record<string, CarbonActivityType> = {
      transport: 'transport',
      energy: 'energy',
      food: 'food',
      consumption: 'food', // Map consumption to food for now
    };

    const activityType = activityTypeMap[categoryId];
    
    if (activityType) {
      log.info('Navigating to activity input form', {
        action: 'navigation',
        targetCategory: categoryId,
        activityType,
        tags: ['navigation', 'carbon_form'],
      });

      navigation.navigate('CarbonActivity' as never, {
        activityType,
      } as never);
    } else {
      log.warn('Unknown category selected', {
        categoryId,
        availableTypes: Object.keys(activityTypeMap),
      });
    }

    // Track business event
    log.trackBusinessEvent('category_selection', {
      categoryId,
      activityType,
      selectionCount: selectedCategory ? 2 : 1, // Track if it's a re-selection
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Your Carbon Impact</Text>
        <Text style={styles.subtitle}>
          Select a category to log your activities
        </Text>
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
            accessible
            accessibilityRole='button'
            accessibilityLabel={`Track ${category.name}`}
            accessibilityHint={category.description}
          >
            <View style={styles.categoryHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: category.color },
                ]}
              >
                <Icon name={category.icon} size={24} color='#fff' />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <Text style={styles.categoryDescription}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.quickActionButton}
          accessible
          accessibilityRole='button'
          accessibilityLabel='Add a commute trip'
          onPress={() => {
            log.trackButtonPress('quick_action_commute');
            navigation.navigate('CarbonActivity' as never, {
              activityType: 'transport',
              initialData: {
                mode: 'car',
                description: 'Daily commute',
              },
            } as never);
          }}
        >
          <Icon name='car-outline' size={20} color='#34C759' />
          <Text style={styles.quickActionText}>Add Commute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          accessible
          accessibilityRole='button'
          accessibilityLabel='Log a meal'
          onPress={() => {
            log.trackButtonPress('quick_action_meal');
            navigation.navigate('CarbonActivity' as never, {
              activityType: 'food',
              initialData: {
                mealType: 'lunch',
                servings: 1,
              },
            } as never);
          }}
        >
          <Icon name='restaurant-outline' size={20} color='#34C759' />
          <Text style={styles.quickActionText}>Log Meal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    padding: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    elevation: 4,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryDescription: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryName: {
    color: '#1a1a1a',
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 16,
    width: 48,
  },
  quickActionButton: {
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
  quickActionText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    color: '#1a1a1a',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default CarbonTrackerScreen;
