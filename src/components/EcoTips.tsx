 import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EcoTip {
  id: string;
  title: string;
  description: string;
  category: 'transportation' | 'food' | 'energy' | 'waste';
}

const ecoTips: EcoTip[] = [
  {
    id: '1',
    title: 'Carpool to Work',
    description: 'Share rides with colleagues to reduce emissions and save money',
    category: 'transportation',
  },
  {
    id: '2',
    title: 'Meatless Mondays',
    description: 'Try going vegetarian one day a week to reduce your carbon footprint',
    category: 'food',
  },
  {
    id: '3',
    title: 'Smart Thermostat',
    description: 'Install a smart thermostat to optimize your home\'s energy usage',
    category: 'energy',
  },
  {
    id: '4',
    title: 'Compost Food Waste',
    description: 'Start composting to reduce landfill waste and create nutrient-rich soil',
    category: 'waste',
  },
];

const EcoTips: React.FC = () => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation':
        return 'car';
      case 'food':
        return 'restaurant';
      case 'energy':
        return 'flash';
      case 'waste':
        return 'trash';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eco Tips</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tipsContainer}
      >
        {ecoTips.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons
                name={getCategoryIcon(tip.category)}
                size={24}
                color="#2ecc71"
              />
              <Text style={styles.tipTitle}>{tip.title}</Text>
            </View>
            <Text style={styles.tipDescription}>{tip.description}</Text>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn More</Text>
              <Ionicons name="arrow-forward" size={16} color="#2ecc71" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
  tipsContainer: {
    gap: 15,
  },
  tipCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    width: 250,
    marginRight: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  learnMoreText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default EcoTips;