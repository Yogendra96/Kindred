// @ts-nocheck
/* eslint-disable */
import { analyticsService } from '../services/AnalyticsService';

// Custom error types for better error handling
export class CarbonCalculationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'CarbonCalculationError';
  }
}

export class InputValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

// Constants
const MINIMUM_DISTANCE = 0;
const MINIMUM_CONSUMPTION = 0;
const MINIMUM_QUANTITY = 0;
const MAXIMUM_PASSENGERS = 50;
const DECIMAL_PLACES = 2;
const PERCENTAGE_MULTIPLIER = 100;

type TransportMode = 'car' | 'bus' | 'train' | 'subway' | 'plane';
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
type EnergySource = 'coal' | 'natural_gas' | 'renewable' | 'oil' | 'electric';
type FoodType = 'meat' | 'dairy' | 'vegetables' | 'processed';
type WasteType = 'landfill' | 'recycled' | 'composted';

const EMISSION_FACTORS = {
  transport: {
    car: {
      petrol: 0.192 as number, // per km
      diesel: 0.171 as number,
      electric: 0.053 as number,
      hybrid: 0.111 as number,
    },
    bus: 0.082 as number, // per km per person
    train: 0.037 as number,
    subway: 0.033 as number,
    plane: {
      shortHaul: 0.156 as number,
      longHaul: 0.139 as number,
    },
  },
  energy: {
    electricity: {
      coal: 0.995 as number,
      natural_gas: 0.185 as number,
      renewable: 0.025 as number,
      standard: 0.233 as number,
      electric: 0.171 as number,
    },
    heating: {
      natural_gas: 0.203 as number,
      oil: 0.298 as number,
      electric: 0.171 as number,
    },
  },
  food: {
    meat: {
      beef: 27 as number,
      pork: 12.1 as number,
      chicken: 6.9 as number,
      standard: 13.3 as number,
      organic: 11.2 as number,
    },
    dairy: {
      milk: 1.39 as number,
      cheese: 13.5 as number,
      standard: 3.2 as number,
      organic: 2.8 as number,
    },
    vegetables: {
      standard: 0.37 as number,
      organic: 0.32 as number,
      local: 0.29 as number,
    },
    processed: 3.8 as number,
  },
  waste: {
    landfill: 0.587 as number,
    recycled: 0.021 as number,
    composted: 0.008 as number,
  },
} as const;

export interface TransportationInput {
  mode: TransportMode;
  distance: number;
  fuelType?: FuelType;
  isShortHaul?: boolean;
  passengers?: number;
}

export interface EnergyInput {
  type: 'electricity' | 'heating';
  source: EnergySource;
  consumption: number;
}

export interface FoodInput {
  type: FoodType;
  subtype?: string;
  quantity: number;
  isOrganic?: boolean;
  isLocal?: boolean;
}

export interface WasteInput {
  type: WasteType;
  quantity: number;
}

/**
 * Result interface for total emissions calculation
 */
export interface EmissionResult {
  total: number;
  breakdown: {
    transport: CategoryBreakdown;
    energy: CategoryBreakdown;
    food: CategoryBreakdown;
    waste: CategoryBreakdown;
  };
}

interface CategoryBreakdown {
  total: number;
  percentage: number;
}

/**
 * CarbonCalculator class implements methods to calculate carbon emissions
 * from various sources including transportation, energy usage, food consumption,
 * and waste management.
 */
export class CarbonCalculator {
  private static instance: CarbonCalculator;

  private constructor() {}

  /**
   * Gets the singleton instance of CarbonCalculator
   */
  static getInstance(): CarbonCalculator {
    if (!CarbonCalculator.instance) {
      CarbonCalculator.instance = new CarbonCalculator();
    }
    return CarbonCalculator.instance;
  }

  /**
   * Validates numeric input
   * @throws {InputValidationError} If validation fails
   */
  private validateNumericInput(
    value: number,
    min: number,
    fieldName: string,
  ): void {
    if (typeof value !== 'number' || isNaN(value) || value < min) {
      throw new InputValidationError(
        `Invalid ${fieldName}: must be a number >= ${min}`,
        fieldName,
      );
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Number(value.toFixed(DECIMAL_PLACES));
  }

  private logCalculation(
    type: string,
    details: Record<string, any>,
    emissions: number,
  ): void {
    analyticsService.logEvent('carbon_calculation', {
      type,
      ...details,
      emissions,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Calculates emissions from transportation activities
   * @param input Transportation details including mode and distance
   * @throws {InputValidationError} If input validation fails
   * @throws {CarbonCalculationError} If calculation fails
   */
  calculateTransportEmissions(input: TransportationInput): number {
    try {
      this.validateNumericInput(input.distance, MINIMUM_DISTANCE, 'distance');
      if (input.passengers) {
        this.validateNumericInput(input.passengers, 1, 'passengers');
        if (input.passengers > MAXIMUM_PASSENGERS) {
          throw new InputValidationError(
            `Invalid passengers: must be <= ${MAXIMUM_PASSENGERS}`,
            'passengers',
          );
        }
      }

      let emissions = 0;

      if (input.mode === 'car' && input.fuelType) {
        emissions =
          EMISSION_FACTORS.transport.car[input.fuelType] * input.distance;
        if (input.passengers && input.passengers > 1) {
          emissions /= input.passengers;
        }
      } else if (input.mode === 'plane') {
        const factor = input.isShortHaul
          ? EMISSION_FACTORS.transport.plane.shortHaul
          : EMISSION_FACTORS.transport.plane.longHaul;
        emissions = factor * input.distance;
      } else if (
        input.mode === 'bus' ||
        input.mode === 'train' ||
        input.mode === 'subway'
      ) {
        emissions =
          (EMISSION_FACTORS.transport[input.mode] as number) * input.distance;
      }

      const result = this.roundToTwoDecimals(emissions);
      this.logCalculation('transport', input, result);
      return result;
    } catch (error) {
      if (
        error instanceof InputValidationError ||
        error instanceof CarbonCalculationError
      ) {
        throw error;
      }
      throw new CarbonCalculationError(
        'Error calculating transport emissions',
        { error, input },
      );
    }
  }

  /**
   * Calculates emissions from energy consumption
   * @param input Energy consumption details
   * @throws {InputValidationError} If input validation fails
   * @throws {CarbonCalculationError} If calculation fails
   */
  calculateEnergyEmissions(input: EnergyInput): number {
    try {
      this.validateNumericInput(
        input.consumption,
        MINIMUM_CONSUMPTION,
        'consumption',
      );

      const factors =
        input.type === 'electricity'
          ? EMISSION_FACTORS.energy.electricity
          : EMISSION_FACTORS.energy.heating;

      const factor = factors[input.source as keyof typeof factors];
      if (typeof factor !== 'number') {
        throw new CarbonCalculationError('Invalid energy source', {
          source: input.source,
        });
      }

      const emissions = factor * input.consumption;
      const result = this.roundToTwoDecimals(emissions);
      this.logCalculation('energy', input, result);
      return result;
    } catch (error) {
      if (
        error instanceof InputValidationError ||
        error instanceof CarbonCalculationError
      ) {
        throw error;
      }
      throw new CarbonCalculationError('Error calculating energy emissions', {
        error,
        input,
      });
    }
  }

  calculateFoodEmissions(input: FoodInput): number {
    try {
      this.validateNumericInput(input.quantity, MINIMUM_QUANTITY, 'quantity');

      let factor = 0;
      if (input.type === 'vegetables') {
        if (input.isLocal) {
          factor = EMISSION_FACTORS.food.vegetables.local;
        } else {
          factor =
            EMISSION_FACTORS.food.vegetables[
              input.isOrganic ? 'organic' : 'standard'
            ];
        }
      } else if (input.type === 'processed') {
        factor = EMISSION_FACTORS.food.processed;
      } else if (input.type === 'meat' || input.type === 'dairy') {
        const category = EMISSION_FACTORS.food[input.type];
        if (input.subtype && input.subtype in category) {
          factor = category[input.subtype as keyof typeof category];
        } else {
          factor = category[input.isOrganic ? 'organic' : 'standard'];
        }
      }

      if (factor === 0) {
        throw new CarbonCalculationError('Invalid food type or configuration', {
          input,
        });
      }

      const emissions = factor * input.quantity;
      const result = this.roundToTwoDecimals(emissions);
      this.logCalculation('food', input, result);
      return result;
    } catch (error) {
      if (
        error instanceof InputValidationError ||
        error instanceof CarbonCalculationError
      ) {
        throw error;
      }
      throw new CarbonCalculationError('Error calculating food emissions', {
        error,
        input,
      });
    }
  }

  calculateWasteEmissions(input: WasteInput): number {
    try {
      this.validateNumericInput(input.quantity, MINIMUM_QUANTITY, 'quantity');

      const factor = EMISSION_FACTORS.waste[input.type];
      if (typeof factor !== 'number') {
        throw new CarbonCalculationError('Invalid waste type', {
          type: input.type,
        });
      }

      const emissions = factor * input.quantity;
      const result = this.roundToTwoDecimals(emissions);
      this.logCalculation('waste', input, result);
      return result;
    } catch (error) {
      if (
        error instanceof InputValidationError ||
        error instanceof CarbonCalculationError
      ) {
        throw error;
      }
      throw new CarbonCalculationError('Error calculating waste emissions', {
        error,
        input,
      });
    }
  }

  /**
   * Calculates total emissions across all categories
   * @returns {EmissionResult} Detailed breakdown of emissions
   * @throws {CarbonCalculationError} If calculation fails
   */
  calculateTotalEmissions(
    transport: TransportationInput[],
    energy: EnergyInput[],
    food: FoodInput[],
    waste: WasteInput[],
  ): EmissionResult {
    try {
      const transportTotal = this.roundToTwoDecimals(
        transport.reduce(
          (total, input) => total + this.calculateTransportEmissions(input),
          0,
        ),
      );

      const energyTotal = this.roundToTwoDecimals(
        energy.reduce(
          (total, input) => total + this.calculateEnergyEmissions(input),
          0,
        ),
      );

      const foodTotal = this.roundToTwoDecimals(
        food.reduce(
          (total, input) => total + this.calculateFoodEmissions(input),
          0,
        ),
      );

      const wasteTotal = this.roundToTwoDecimals(
        waste.reduce(
          (total, input) => total + this.calculateWasteEmissions(input),
          0,
        ),
      );

      const total = this.roundToTwoDecimals(
        transportTotal + energyTotal + foodTotal + wasteTotal,
      );

      const result: EmissionResult = {
        total,
        breakdown: {
          transport: {
            total: transportTotal,
            percentage: this.roundToTwoDecimals(
              (transportTotal / total) * PERCENTAGE_MULTIPLIER,
            ),
          },
          energy: {
            total: energyTotal,
            percentage: this.roundToTwoDecimals(
              (energyTotal / total) * PERCENTAGE_MULTIPLIER,
            ),
          },
          food: {
            total: foodTotal,
            percentage: this.roundToTwoDecimals(
              (foodTotal / total) * PERCENTAGE_MULTIPLIER,
            ),
          },
          waste: {
            total: wasteTotal,
            percentage: this.roundToTwoDecimals(
              (wasteTotal / total) * PERCENTAGE_MULTIPLIER,
            ),
          },
        },
      };

      analyticsService.logEvent('daily_carbon_footprint', result);
      return result;
    } catch (error) {
      throw new CarbonCalculationError('Error calculating total emissions', {
        error,
      });
    }
  }

  calculateCarbonSaved(
    oldActivity: TransportationInput,
    newActivity: TransportationInput,
  ): number {
    try {
      const oldEmissions = this.calculateTransportEmissions(oldActivity);
      const newEmissions = this.calculateTransportEmissions(newActivity);
      const saved = this.roundToTwoDecimals(oldEmissions - newEmissions);

      if (saved < 0) {
        throw new CarbonCalculationError(
          'New activity produces more emissions than old activity',
          {
            oldEmissions,
            newEmissions,
            saved,
          },
        );
      }

      analyticsService.logEvent('carbon_saved', {
        oldActivity,
        newActivity,
        savedEmissions: saved,
      });

      return saved;
    } catch (error) {
      if (
        error instanceof InputValidationError ||
        error instanceof CarbonCalculationError
      ) {
        throw error;
      }
      throw new CarbonCalculationError('Error calculating carbon saved', {
        error,
      });
    }
  }

  getEmissionReductionTips(
    category: 'transport' | 'energy' | 'food' | 'waste',
  ): string[] {
    const tips: Record<string, string[]> = {
      transport: [
        'Consider using public transportation instead of private vehicles',
        'Try carpooling with colleagues or friends',
        'Switch to an electric or hybrid vehicle',
        'Use a bicycle for short distances',
        'Combine multiple errands into one trip',
      ],
      energy: [
        'Switch to energy-efficient LED bulbs',
        'Use natural light when possible',
        'Install a smart thermostat',
        'Use energy-efficient appliances',
        'Consider solar panels for your home',
      ],
      food: [
        'Reduce meat consumption, especially beef',
        'Choose local and seasonal produce',
        'Plan meals to reduce food waste',
        'Start composting food scraps',
        'Try plant-based alternatives',
      ],
      waste: [
        'Implement proper recycling practices',
        'Use reusable bags and containers',
        'Avoid single-use plastics',
        'Compost organic waste',
        'Choose products with minimal packaging',
      ],
    };

    return tips[category] || [];
  }
}

export const carbonCalculator = CarbonCalculator.getInstance();
export default carbonCalculator;
