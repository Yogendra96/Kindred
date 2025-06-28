import { performanceService } from '@services/PerformanceService';
import { useTheme } from '@theme/ThemeProvider';
import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface CarbonData {
  transport: number;
  energy: number;
  food: number;
  waste: number;
}

interface Props {
  data: CarbonData;
  totalEmissions: number;
  onCategoryPress?: (category: keyof CarbonData) => void;
}

const CarbonFootprintCard: React.FC<Props> = ({
  data,
  totalEmissions,
  onCategoryPress,
}) => {
  const { theme, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    performanceService.startTrace('prepare_chart_data');

    const result = [
      {
        name: 'Transport',
        population: data.transport,
        color: theme.colors.primary,
        legendFontColor: theme.colors.text.primary,
      },
      {
        name: 'Energy',
        population: data.energy,
        color: theme.colors.secondary,
        legendFontColor: theme.colors.text.primary,
      },
      {
        name: 'Food',
        population: data.food,
        color: theme.colors.accent,
        legendFontColor: theme.colors.text.primary,
      },
      {
        name: 'Waste',
        population: data.waste,
        color: theme.colors.warning,
        legendFontColor: theme.colors.text.primary,
      },
    ];

    performanceService.stopTrace('prepare_chart_data');
    return result;
  }, [data, theme, isDark]);

  const getEmissionLevel = (total: number): { text: string; color: string } => {
    if (total < 5) {
      return { text: 'Low Impact', color: theme.colors.success };
    } else if (total < 10) {
      return { text: 'Moderate Impact', color: theme.colors.warning };
    } else {
      return { text: 'High Impact', color: theme.colors.error };
    }
  };

  const emissionLevel = getEmissionLevel(totalEmissions);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Carbon Footprint Overview
      </Text>

      <View style={styles.summaryContainer}>
        <Text
          style={[styles.totalEmissions, { color: theme.colors.text.primary }]}
        >
          {totalEmissions.toFixed(1)}
        </Text>
        <Text style={[styles.unit, { color: theme.colors.text.secondary }]}>
          tonnes CO₂e/year
        </Text>
        <Text style={[styles.impactLevel, { color: emissionLevel.color }]}>
          {emissionLevel.text}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          accessor='population'
          backgroundColor='transparent'
          paddingLeft='15'
          absolute
        />
      </View>

      <View style={styles.breakdownContainer}>
        {Object.entries(data).map(([category, value]) => (
          <View
            key={category}
            style={[
              styles.categoryItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.categoryHeader}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: chartData.find(
                      item => item.name.toLowerCase() === category,
                    )?.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.categoryName,
                  { color: theme.colors.text.primary },
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
            <View style={styles.categoryValues}>
              <Text
                style={[
                  styles.categoryValue,
                  { color: theme.colors.text.primary },
                ]}
              >
                {value.toFixed(1)}t
              </Text>
              <Text
                style={[
                  styles.categoryPercentage,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {((value / totalEmissions) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalEmissions: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    marginTop: 4,
  },
  impactLevel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breakdownContainer: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default React.memo(CarbonFootprintCard);
