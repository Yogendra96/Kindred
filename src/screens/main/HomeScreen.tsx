import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { updateFootprint } from '../../store/slices/carbonSlice';

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { footprint, loading, error } = useSelector(
    (state: RootState) => state.carbon,
  );
  const { profile } = useSelector((state: RootState) => state.user);

  const handleAddTransportation = () => {
    dispatch(
      updateFootprint({ transportation: footprint.transportation + 2.5 }),
    );
  };

  const handleAddFood = () => {
    dispatch(updateFootprint({ food: footprint.food + 1.2 }));
  };

  const handleAddEnergy = () => {
    dispatch(updateFootprint({ energy: footprint.energy + 3.1 }));
  };

  const handleAddWaste = () => {
    dispatch(updateFootprint({ waste: footprint.waste + 0.8 }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏠 Home</Text>
        <Text style={styles.subtitle}>
          Welcome{profile.name ? `, ${profile.name}` : ' to Kindred'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.footprintCard}>
          <Text style={styles.cardTitle}>Your Carbon Footprint</Text>
          <Text style={styles.totalFootprint}>
            {footprint.total.toFixed(1)} kg CO₂
          </Text>
          <Text style={styles.footprintLabel}>Today</Text>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Add Activity</Text>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={handleAddTransportation}
          >
            <Text style={styles.categoryEmoji}>🚗</Text>
            <Text style={styles.categoryText}>Drive 10km</Text>
            <Text style={styles.categoryValue}>+2.5 kg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={handleAddFood}
          >
            <Text style={styles.categoryEmoji}>🍖</Text>
            <Text style={styles.categoryText}>Meat meal</Text>
            <Text style={styles.categoryValue}>+1.2 kg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={handleAddEnergy}
          >
            <Text style={styles.categoryEmoji}>💡</Text>
            <Text style={styles.categoryText}>1 hour AC</Text>
            <Text style={styles.categoryValue}>+3.1 kg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={handleAddWaste}
          >
            <Text style={styles.categoryEmoji}>🗑️</Text>
            <Text style={styles.categoryText}>Plastic waste</Text>
            <Text style={styles.categoryValue}>+0.8 kg</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Masterpiece Features</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureBtn}
              onPress={() => navigation.navigate('CarbonTwin')}
            >
              <Text style={styles.featureEmoji}>🧬</Text>
              <Text style={styles.featureText}>Carbon Twin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureBtn}
              onPress={() => navigation.navigate('VisionCamera')}
            >
              <Text style={styles.featureEmoji}>📷</Text>
              <Text style={styles.featureText}>AI Vision</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureBtn}
              onPress={() => navigation.navigate('Verification')}
            >
              <Text style={styles.featureEmoji}>🛡️</Text>
              <Text style={styles.featureText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Today's Breakdown</Text>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>🚗 Transportation</Text>
            <Text style={styles.breakdownValue}>
              {footprint.transportation.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>🍽️ Food</Text>
            <Text style={styles.breakdownValue}>
              {footprint.food.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>⚡ Energy</Text>
            <Text style={styles.breakdownValue}>
              {footprint.energy.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>🗑️ Waste</Text>
            <Text style={styles.breakdownValue}>
              {footprint.waste.toFixed(1)} kg
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
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
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  footprintCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  totalFootprint: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  footprintLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  breakdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#333',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureBtn: {
    backgroundColor: 'white',
    width: '31%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureEmoji: { fontSize: 24, marginBottom: 5 },
  featureText: { fontSize: 12, fontWeight: 'bold' },
});

export default HomeScreen;
