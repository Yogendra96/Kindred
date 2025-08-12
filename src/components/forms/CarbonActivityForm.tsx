import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';

import TransportationForm, { type TransportationData } from './TransportationForm';
import EnergyForm, { type EnergyData } from './EnergyForm';
import FoodForm, { type FoodData } from './FoodForm';
import { CarbonAPIService } from '../../services/CarbonAPIService';
import type { CarbonEmissionCalculation } from '../../services/CarbonAPIService';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';
import { addCarbonActivity, saveActivityToStorage } from '../../store/slices/carbonSlice';

export type CarbonActivityType = 'transport' | 'energy' | 'food';

export interface CarbonActivityResult {
  type: CarbonActivityType;
  data: TransportationData | EnergyData | FoodData;
  calculation: CarbonEmissionCalculation;
  timestamp: string;
}

interface CarbonActivityFormProps {
  activityType: CarbonActivityType;
  onSubmit: (result: CarbonActivityResult) => void;
  onCancel: () => void;
  initialData?: Partial<TransportationData | EnergyData | FoodData>;
}

const CarbonActivityForm: React.FC<CarbonActivityFormProps> = ({
  activityType,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const log = useAdvancedLogging({
    component: 'CarbonActivityForm',
    screen: 'CarbonTrackerScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
  });

  const calculateTransportationEmissions = useCallback(async (data: TransportationData): Promise<CarbonEmissionCalculation> => {
    log.info('Calculating transportation emissions', {
      mode: data.mode,
      distance: data.distance,
      passengers: data.passengers,
    });

    // Convert form data to API calculation request
    const calculationData = {
      activityType: 'transport',
      amount: data.distance,
      unit: 'km',
      region: 'US',
      additionalParams: {
        mode: data.mode,
        distance: data.distance,
        duration: data.duration,
        passengers: data.passengers ?? 1,
        fuel_type: data.fuelType,
        vehicle_type: data.vehicleType,
      },
    };

    const carbonService = new CarbonAPIService();
    const response = await carbonService.calculateEmissions(calculationData);
    const result = CarbonAPIService.convertToFormCalculation(response);
    
    log.trackBusinessEvent('transportation_emissions_calculated', {
      mode: data.mode,
      distance: data.distance,
      emissions: result.carbon_footprint_kg,
      equivalent_trees: result.equivalent_trees_planted,
    });

    return result;
  }, [log]);

  const calculateEnergyEmissions = useCallback(async (data: EnergyData): Promise<CarbonEmissionCalculation> => {
    log.info('Calculating energy emissions', {
      type: data.type,
      amount: data.amount,
      unit: data.unit,
      period: data.period,
    });

    // Convert period to multiplier for standardization
    const periodMultipliers = {
      daily: 1,
      weekly: 1/7,
      monthly: 1/30,
      yearly: 1/365,
      'one-time': 1,
    };

    const dailyAmount = data.amount * (periodMultipliers[data.period] ?? 1);

    const calculationData = {
      activityType: 'energy',
      amount: dailyAmount,
      unit: data.unit,
      region: 'US',
      additionalParams: {
        energy_type: data.type,
        amount: dailyAmount,
        unit: data.unit,
        source: data.source,
        efficiency: data.efficiency,
        renewable_percentage: data.renewableEnergy ? 100 : 0,
      },
    };

    const carbonService = new CarbonAPIService();
    const response = await carbonService.calculateEmissions(calculationData);
    const result = CarbonAPIService.convertToFormCalculation(response);
    
    log.trackBusinessEvent('energy_emissions_calculated', {
      type: data.type,
      amount: dailyAmount,
      unit: data.unit,
      emissions: result.carbon_footprint_kg,
      renewable: data.renewableEnergy,
    });

    return result;
  }, [log]);

  const calculateFoodEmissions = useCallback(async (data: FoodData): Promise<CarbonEmissionCalculation> => {
    log.info('Calculating food emissions', {
      category: data.category,
      mealType: data.mealType,
      servings: data.servings,
      dietType: data.dietType,
    });

    // Calculate waste factor
    const wasteFactor = 1 + (data.wasteAmount / 100);
    
    // Calculate sustainability modifiers
    let sustainabilityModifier = 1;
    if (data.isOrganic) sustainabilityModifier *= 0.9; // 10% reduction for organic
    if (data.isLocal) sustainabilityModifier *= 0.85; // 15% reduction for local
    
    // Packaging impact
    const packagingMultipliers = {
      minimal: 1,
      moderate: 1.1,
      excessive: 1.25,
    };

    const calculationData = {
      activityType: 'food',
      amount: data.servings,
      unit: 'servings',
      region: 'US',
      additionalParams: {
        category: data.category,
        meal_type: data.mealType,
        servings: data.servings,
        food_items: data.foodItems,
        diet_type: data.dietType,
        is_organic: data.isOrganic,
        is_local: data.isLocal,
        packaging_level: data.packaging,
        waste_percentage: data.wasteAmount,
        sustainability_modifier: sustainabilityModifier,
        packaging_multiplier: packagingMultipliers[data.packaging],
        waste_factor: wasteFactor,
      },
    };

    const carbonService = new CarbonAPIService();
    const response = await carbonService.calculateEmissions(calculationData);
    const result = CarbonAPIService.convertToFormCalculation(response);
    
    log.trackBusinessEvent('food_emissions_calculated', {
      category: data.category,
      mealType: data.mealType,
      servings: data.servings,
      dietType: data.dietType,
      emissions: result.carbon_footprint_kg,
      isOrganic: data.isOrganic,
      isLocal: data.isLocal,
      wasteAmount: data.wasteAmount,
    });

    return result;
  }, [log]);

  const handleFormSubmit = useCallback(async (formData: TransportationData | EnergyData | FoodData) => {
    setLoading(true);
    
    try {
      log.trackButtonPress('submit_carbon_activity', {
        activityType,
        timestamp: new Date().toISOString(),
      });

      let calculation: CarbonEmissionCalculation;

      // Calculate emissions based on activity type
      switch (activityType) {
        case 'transport':
          calculation = await calculateTransportationEmissions(formData as TransportationData);
          break;
        case 'energy':
          calculation = await calculateEnergyEmissions(formData as EnergyData);
          break;
        case 'food':
          calculation = await calculateFoodEmissions(formData as FoodData);
          break;
        default:
          throw new Error(`Unknown activity type: ${activityType}`);
      }

      // Create activity result
      const result: CarbonActivityResult = {
        type: activityType,
        data: formData,
        calculation,
        timestamp: new Date().toISOString(),
      };

      log.trackBusinessEvent('carbon_activity_completed', {
        activityType,
        emissions: calculation.carbon_footprint_kg,
        offset_cost: calculation.offset_cost_usd,
        equivalent_trees: calculation.equivalent_trees_planted,
        duration: Date.now() - (log as any).sessionStartTime, // Calculate session duration
      });

      // Save activity to Redux store
      dispatch(addCarbonActivity(result));

      // Save activity to persistent storage
      const storageActivity = {
        id: result.timestamp + '_' + activityType,
        type: result.type,
        description: `${activityType} activity - ${new Date().toLocaleDateString()}`,
        emissions: result.calculation,
        data: result.data,
        timestamp: result.timestamp,
        synced: false,
      };
      dispatch(saveActivityToStorage(storageActivity));

      // Show success message with results
      Alert.alert(
        'Carbon Impact Calculated!',
        `Your activity generated ${calculation.carbon_footprint_kg.toFixed(2)} kg CO₂.\n\n` +
        `💚 Plant ${calculation.equivalent_trees_planted} trees to offset this impact.\n` +
        `💰 Offset cost: $${calculation.offset_cost_usd.toFixed(2)}\n\n` +
        `✅ Activity saved to your carbon tracking history.`,
        [
          {
            text: 'View Details',
            onPress: () => onSubmit(result),
          },
        ]
      );

    } catch (error) {
      log.trackError('carbon_calculation_failed', {
        activityType,
        error: error instanceof Error ? error.message : 'Unknown error',
        formData: {
          type: activityType,
          // Log basic info without sensitive data
          hasDescription: !!(formData as any).description,
        },
      });

      Alert.alert(
        'Calculation Error',
        'Unable to calculate carbon emissions. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => handleFormSubmit(formData) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [activityType, calculateTransportationEmissions, calculateEnergyEmissions, calculateFoodEmissions, onSubmit, log]);

  const handleCancel = useCallback(() => {
    log.trackButtonPress('cancel_carbon_activity', {
      activityType,
      timestamp: new Date().toISOString(),
    });

    log.trackBusinessEvent('carbon_activity_cancelled', {
      activityType,
      duration: Date.now() - (log as any).sessionStartTime,
    });

    onCancel();
  }, [activityType, onCancel, log]);

  // Render loading overlay
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  // Render appropriate form based on activity type
  switch (activityType) {
    case 'transport':
      return (
        <TransportationForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={loading}
          initialData={initialData as Partial<TransportationData>}
        />
      );

    case 'energy':
      return (
        <EnergyForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={loading}
          initialData={initialData as Partial<EnergyData>}
        />
      );

    case 'food':
      return (
        <FoodForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={loading}
          initialData={initialData as Partial<FoodData>}
        />
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default CarbonActivityForm;