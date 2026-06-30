// @ts-nocheck
/* eslint-disable */
/**
 * @fileoverview Core Carbon Calculation Engine
 *
 * Focused service responsible for carbon emission calculations
 * using offline emission factors and unit conversions.
 *
 * Follows KISS and SRP principles - single responsibility for calculations.
 *
 * @version 2.0.0
 */

import { EMISSION_FACTORS, CARBON_CONVERSION, LOG_PREFIXES } from '../../utils/constants';
import { createLogger, logCarbonCalculation } from '../../utils/loggingUtils';

// ===================================================================
// TYPES
// ===================================================================

export interface CarbonCalculationRequest {
  activityType: 'transport' | 'energy' | 'food';
  amount: number;
  unit: string;
  region?: string;
  additionalParams?: {
    vehicleType?: string;
    energySource?: string;
    foodType?: string;
    fuelType?: string;
    passengers?: number;
    efficiency?: 'low' | 'medium' | 'high';
    renewable_percentage?: number;
    sustainability_modifier?: number;
    waste_factor?: number;
  };
}

export interface CarbonEmissionFactor {
  id: string;
  category: string;
  subcategory: string;
  factor: number;
  unit: string;
  region?: string;
  source: string;
  lastUpdated: Date;
}

export interface CarbonCalculationResponse {
  emissions: number; // kg CO2
  factor: CarbonEmissionFactor;
  confidence: number; // 0-1
  breakdown: {
    direct: number;
    indirect: number;
    lifecycle?: number;
  };
  recommendations: string[];
}

export interface CarbonEmissionCalculation {
  carbon_footprint_kg: number;
  equivalent_trees_planted: number;
  offset_cost_usd: number;
  emission_factor_id?: string;
  confidence?: number;
  breakdown?: {
    direct: number;
    indirect: number;
    lifecycle?: number;
  };
}

// ===================================================================
// CARBON CALCULATOR CORE
// ===================================================================

/**
 * Core carbon calculation engine using offline emission factors
 * Focused, lightweight, and testable implementation
 */
export class CarbonCalculatorCore {
  private logger = createLogger({ prefix: 'CARBON_API' });

  /**
   * Calculate carbon emissions using offline emission factors
   */
  async calculate(request: CarbonCalculationRequest): Promise<CarbonCalculationResponse> {
    const startTime = performance.now();

    this.logger.info('Starting offline carbon calculation', {
      activityType: request.activityType,
      amount: request.amount,
      unit: request.unit,
    });

    try {
      const result = this.calculateOffline(request);

      const duration = performance.now() - startTime;
      logCarbonCalculation(
        this.logger,
        request.activityType,
        request.amount,
        result.emissions,
        'offline',
        duration,
      );

      return result;
    } catch (error) {
      this.logger.error(
        'Carbon calculation failed',
        {
          activityType: request.activityType,
          amount: request.amount,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Batch calculate multiple emissions
   */
  async batchCalculate(requests: CarbonCalculationRequest[]): Promise<CarbonCalculationResponse[]> {
    const startTime = performance.now();

    this.logger.info('Starting batch carbon calculation', {
      batchSize: requests.length,
    });

    try {
      const results = await Promise.all(requests.map(request => this.calculateOffline(request)));

      const duration = performance.now() - startTime;
      this.logger.success('Batch calculation completed', {
        batchSize: requests.length,
        duration: `${duration.toFixed(2)}ms`,
        averagePerCalculation: `${(duration / requests.length).toFixed(2)}ms`,
      });

      return results;
    } catch (error) {
      this.logger.error(
        'Batch calculation failed',
        {
          batchSize: requests.length,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Convert calculation response to form-friendly format
   */
  static convertToFormCalculation(response: CarbonCalculationResponse): CarbonEmissionCalculation {
    return {
      carbon_footprint_kg: Number(response.emissions.toFixed(2)),
      equivalent_trees_planted: CARBON_CONVERSION.TREES_PER_TON_CO2
        ? Math.ceil(response.emissions / CARBON_CONVERSION.TREES_PER_TON_CO2)
        : Math.ceil(response.emissions / 21.8), // fallback
      offset_cost_usd: Number(
        (response.emissions * CARBON_CONVERSION.OFFSET_COST_PER_KG).toFixed(2),
      ),
      emission_factor_id: response.factor.id,
      confidence: response.confidence,
      breakdown: response.breakdown,
    };
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  /**
   * Offline carbon calculation using built-in emission factors
   */
  private calculateOffline(request: CarbonCalculationRequest): CarbonCalculationResponse {
    const { activityType, amount, unit, additionalParams = {} } = request;

    // Get emission factor
    const factorData = this.getEmissionFactor(activityType, additionalParams);
    if (!factorData) {
      throw new Error(`No emission factor found for ${activityType}`);
    }

    // Convert units if needed
    const convertedAmount = this.convertUnits(amount, unit, factorData.targetUnit);

    // Calculate base emissions
    let emissions = convertedAmount * factorData.factor;

    // Apply modifiers
    emissions = this.applyModifiers(emissions, activityType, additionalParams);

    return {
      emissions,
      factor: {
        id: `offline-${activityType}-${factorData.key}`,
        category: activityType,
        subcategory: factorData.key,
        factor: factorData.factor,
        unit: factorData.unit,
        source: factorData.source,
        lastUpdated: new Date(),
      },
      confidence: 0.8, // Lower confidence for offline calculations
      breakdown: {
        direct: emissions * 0.7,
        indirect: emissions * 0.3,
      },
      recommendations: this.getRecommendations(activityType, factorData.key, emissions),
    };
  }

  /**
   * Get emission factor for activity type
   */
  private getEmissionFactor(
    activityType: string,
    params: Record<string, any>,
  ): {
    key: string;
    factor: number;
    unit: string;
    source: string;
    targetUnit: string;
  } | null {
    switch (activityType) {
      case 'transport': {
        const vehicleType = params.vehicleType || 'car_gasoline';
        const factor =
          EMISSION_FACTORS.TRANSPORT[vehicleType as keyof typeof EMISSION_FACTORS.TRANSPORT];
        if (!factor) return null;

        return {
          key: vehicleType,
          factor,
          unit: 'kg CO2/km',
          source: 'DEFRA 2023',
          targetUnit: 'km',
        };
      }

      case 'energy': {
        const energySource = params.energySource || 'electricity_us';
        const factor =
          EMISSION_FACTORS.ENERGY[energySource as keyof typeof EMISSION_FACTORS.ENERGY];
        if (!factor) return null;

        return {
          key: energySource,
          factor,
          unit: 'kg CO2/kWh',
          source: 'EPA 2023',
          targetUnit: 'kWh',
        };
      }

      case 'food': {
        const foodType = params.foodType || 'vegetables';
        const factor = EMISSION_FACTORS.FOOD[foodType as keyof typeof EMISSION_FACTORS.FOOD];
        if (!factor) return null;

        return {
          key: foodType,
          factor,
          unit: 'kg CO2/kg',
          source: 'FAO 2023',
          targetUnit: 'kg',
        };
      }

      default:
        return null;
    }
  }

  /**
   * Convert units for calculations
   */
  private convertUnits(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    // Distance conversions
    if (fromUnit === 'mi' && toUnit === 'km') return value * 1.609;
    if (fromUnit === 'km' && toUnit === 'mi') return value / 1.609;

    // Energy conversions
    if (fromUnit === 'MWh' && toUnit === 'kWh') return value * 1000;
    if (fromUnit === 'kWh' && toUnit === 'MWh') return value / 1000;
    if (fromUnit === 'Wh' && toUnit === 'kWh') return value / 1000;

    // Weight conversions
    if (fromUnit === 'lb' && toUnit === 'kg') return value * 0.453592;
    if (fromUnit === 'kg' && toUnit === 'lb') return value / 0.453592;
    if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
    if (fromUnit === 'oz' && toUnit === 'kg') return value * 0.0283495;

    // If no conversion available, return original value
    this.logger.warn('Unit conversion not available', {
      fromUnit,
      toUnit,
      value,
    });

    return value;
  }

  /**
   * Apply modifiers based on additional parameters
   */
  private applyModifiers(
    baseEmissions: number,
    activityType: string,
    params: Record<string, any>,
  ): number {
    let emissions = baseEmissions;

    // Apply renewable energy reduction
    if (params.renewable_percentage) {
      const renewableReduction = (params.renewable_percentage / 100) * 0.8;
      emissions = emissions * (1 - renewableReduction);
    }

    // Apply efficiency modifier
    if (params.efficiency === 'high') {
      emissions = emissions * 0.7;
    } else if (params.efficiency === 'low') {
      emissions = emissions * 1.3;
    }

    // Apply sustainability modifier
    if (params.sustainability_modifier) {
      emissions = emissions * params.sustainability_modifier;
    }

    // Apply waste factor
    if (params.waste_factor) {
      emissions = emissions * params.waste_factor;
    }

    // Apply passengers for transportation (divide by passenger count)
    if (activityType === 'transport' && params.passengers && params.passengers > 1) {
      emissions = emissions / params.passengers;
    }

    return Math.max(emissions, 0);
  }

  /**
   * Get recommendations based on activity and emissions
   */
  private getRecommendations(category: string, activityType: string, emissions: number): string[] {
    const recommendations: string[] = [];

    switch (category) {
      case 'transport':
        if (activityType.includes('car')) {
          recommendations.push('Consider using public transport or cycling for shorter trips');
          if (emissions > 5) {
            recommendations.push('Look into carpooling or ride-sharing options');
          }
          if (!activityType.includes('electric')) {
            recommendations.push('Consider switching to an electric or hybrid vehicle');
          }
        }
        if (activityType.includes('plane')) {
          recommendations.push('Consider train travel for shorter distances');
          recommendations.push('Purchase carbon offsets for unavoidable flights');
        }
        break;

      case 'energy':
        recommendations.push('Switch to renewable energy sources when possible');
        if (emissions > 10) {
          recommendations.push('Consider energy-efficient appliances and LED lighting');
        }
        recommendations.push('Improve home insulation to reduce energy consumption');
        if (activityType.includes('electricity')) {
          recommendations.push('Use smart thermostats and programmable devices');
        }
        break;

      case 'food':
        if (activityType === 'beef' || activityType === 'pork') {
          recommendations.push(
            'Try reducing meat consumption or choosing plant-based alternatives',
          );
        }
        recommendations.push('Choose locally sourced and seasonal produce when possible');
        recommendations.push('Consider organic options to support sustainable farming');
        if (emissions > 5) {
          recommendations.push('Plan meals to reduce food waste');
        }
        break;
    }

    // Add general recommendation if no specific ones
    if (recommendations.length === 0) {
      recommendations.push('Consider more sustainable alternatives for this activity');
    }

    return recommendations;
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export const carbonCalculatorCore = new CarbonCalculatorCore();
export default carbonCalculatorCore;
