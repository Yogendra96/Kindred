 import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressCircle } from 'react-native-svg-charts';

interface CarbonFootprintCardProps {
  total: number;
  target: number;
  categories: {
    transportation: number;
    food: number;
    energy: number;
    waste: number;
  };
}

const CarbonFootprintCard: React.FC<CarbonFootprintCardProps> = ({
  total,
  target,
  categories,
}) => {
  const progress = target > 0 ? Math.min(total / target, 1) : 0;
  const progressColor = progress > 0.8 ? '#e74c3c' : progress > 0.5 ? '#f39c12' : '#2ecc71';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Carbon Footprint</Text>
        <Text style={styles.total}>{total.toFixed(1)} kg CO₂</Text>
      </View>

      <View style={styles.progressContainer}>
        <ProgressCircle
          style={styles.progressCircle}
          progress={progress}
          progressColor={progressColor}
          backgroundColor="#f0f0f0"
          strokeWidth={10}
        />
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% of target
          </Text>
          <Text style={styles.targetText}>
            Target: {target} kg CO₂
          </Text>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <View style={styles.categoryItem}>
          <Text style={styles.categoryLabel}>Transportation</Text>
          <Text style={styles.categoryValue}>{categories.transportation} kg</Text>
        </View>
        <View style={styles.categoryItem}>
          <Text style={styles.categoryLabel}>Food</Text>
          <Text style={styles.categoryValue}>{categories.food} kg</Text>
        </View>
        <View style={styles.categoryItem}>
          <Text style={styles.categoryLabel}>Energy</Text>
          <Text style={styles.categoryValue}>{categories.energy} kg</Text>
        </View>
        <View style={styles.categoryItem}>
          <Text style={styles.categoryLabel}>Waste</Text>
          <Text style={styles.categoryValue}>{categories.waste} kg</Text>
        </View>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    height: 150,
    width: 150,
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  targetText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
});

export default CarbonFootprintCard;