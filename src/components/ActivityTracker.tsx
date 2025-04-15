 import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Activity {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

const activities: Activity[] = [
  {
    id: '1',
    title: 'Used Public Transport',
    description: 'Take public transport instead of driving',
    points: 50,
    completed: false,
  },
  {
    id: '2',
    title: 'Meat-Free Meal',
    description: 'Have a vegetarian or vegan meal',
    points: 30,
    completed: false,
  },
  {
    id: '3',
    title: 'Recycled Waste',
    description: 'Properly sort and recycle your waste',
    points: 20,
    completed: false,
  },
  {
    id: '4',
    title: 'Energy Saving',
    description: 'Turn off lights and electronics when not in use',
    points: 40,
    completed: false,
  },
];

const ActivityTracker: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Activities</Text>
      <View style={styles.activitiesContainer}>
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.activityCard,
              activity.completed && styles.completedCard,
            ]}
          >
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.points}>+{activity.points} pts</Text>
            </View>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <View style={styles.activityFooter}>
              <TouchableOpacity style={styles.checkButton}>
                <Ionicons
                  name={activity.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={24}
                  color={activity.completed ? '#2ecc71' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activitiesContainer: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
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
});

export default ActivityTracker;