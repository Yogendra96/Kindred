import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateFootprint } from '../../store/slices/carbonSlice';
import CarbonFootprintCard from '../../components/CarbonFootprintCard';
import ActivityTracker from '../../components/ActivityTracker';
import EcoTips from '../../components/EcoTips';
import { calculateCarbonFootprint } from '../../utils/carbonCalculator';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { footprint, goals } = useSelector((state: RootState) => state.carbon);

  useEffect(() => {
    // Simulate fetching and updating carbon footprint data
    const fetchCarbonData = async () => {
      const newFootprint = await calculateCarbonFootprint();
      dispatch(updateFootprint(newFootprint));
    };
    fetchCarbonData();
  }, [dispatch]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Carbon Footprint</Text>
        <Text style={styles.subtitle}>Track and reduce your environmental impact</Text>
      </View>

      <CarbonFootprintCard
        total={footprint.total}
        target={goals.target}
        categories={footprint}
      />

      <ActivityTracker />

      <EcoTips />

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Weekly Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{footprint.transportation}kg</Text>
            <Text style={styles.statLabel}>Transportation</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{footprint.food}kg</Text>
            <Text style={styles.statLabel}>Food</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{footprint.energy}kg</Text>
            <Text style={styles.statLabel}>Energy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{footprint.waste}kg</Text>
            <Text style={styles.statLabel}>Waste</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default HomeScreen;