import type {
  EnergyInput,
  FoodInput,
  TransportationInput,
  WasteInput,
} from '../carbonCalculator';
import {
  calculateCarbonFootprint,
  CarbonCalculator,
  getCarbonFootprintTips,
  InputValidationError,
} from '../carbonCalculator';

describe('Carbon Calculator', () => {
  describe('calculateCarbonFootprint', () => {
    it('should calculate carbon footprint correctly', async () => {
      const footprint = await calculateCarbonFootprint();

      expect(footprint).toHaveProperty('transportation');
      expect(footprint).toHaveProperty('food');
      expect(footprint).toHaveProperty('energy');
      expect(footprint).toHaveProperty('waste');

      expect(typeof footprint.transportation).toBe('number');
      expect(typeof footprint.food).toBe('number');
      expect(typeof footprint.energy).toBe('number');
      expect(typeof footprint.waste).toBe('number');
    });
  });

  describe('getCarbonFootprintTips', () => {
    it('should return tips based on footprint values', () => {
      const footprint = {
        transportation: 6,
        food: 4,
        energy: 11,
        waste: 3,
      };

      const tips = getCarbonFootprintTips(footprint);

      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.every(tip => typeof tip === 'string')).toBe(true);
    });

    it('should return empty array for low footprint values', () => {
      const footprint = {
        transportation: 1,
        food: 1,
        energy: 1,
        waste: 1,
      };

      const tips = getCarbonFootprintTips(footprint);
      expect(tips).toHaveLength(0);
    });
  });
});

describe('CarbonCalculator', () => {
  let calculator: CarbonCalculator;

  beforeEach(() => {
    calculator = CarbonCalculator.getInstance();
  });

  describe('calculateTransportEmissions', () => {
    it('should calculate car emissions correctly', () => {
      const input: TransportationInput = {
        mode: 'car',
        distance: 100,
        fuelType: 'petrol',
      };
      expect(calculator.calculateTransportEmissions(input)).toBe(19.2);
    });

    it('should handle car pooling correctly', () => {
      const input: TransportationInput = {
        mode: 'car',
        distance: 100,
        fuelType: 'petrol',
        passengers: 4,
      };
      expect(calculator.calculateTransportEmissions(input)).toBe(4.8);
    });

    it('should throw error for invalid distance', () => {
      const input: TransportationInput = {
        mode: 'car',
        distance: -10,
        fuelType: 'petrol',
      };
      expect(() => calculator.calculateTransportEmissions(input)).toThrow(
        InputValidationError,
      );
    });

    it('should throw error for invalid passengers', () => {
      const input: TransportationInput = {
        mode: 'car',
        distance: 100,
        fuelType: 'petrol',
        passengers: 51,
      };
      expect(() => calculator.calculateTransportEmissions(input)).toThrow(
        InputValidationError,
      );
    });
  });

  describe('calculateEnergyEmissions', () => {
    it('should calculate electricity emissions correctly', () => {
      const input: EnergyInput = {
        type: 'electricity',
        source: 'coal',
        consumption: 1000,
      };
      expect(calculator.calculateEnergyEmissions(input)).toBe(995);
    });

    it('should calculate heating emissions correctly', () => {
      const input: EnergyInput = {
        type: 'heating',
        source: 'natural_gas',
        consumption: 1000,
      };
      expect(calculator.calculateEnergyEmissions(input)).toBe(203);
    });

    it('should throw error for invalid consumption', () => {
      const input: EnergyInput = {
        type: 'electricity',
        source: 'coal',
        consumption: -100,
      };
      expect(() => calculator.calculateEnergyEmissions(input)).toThrow(
        InputValidationError,
      );
    });
  });

  describe('calculateFoodEmissions', () => {
    it('should calculate meat emissions correctly', () => {
      const input: FoodInput = {
        type: 'meat',
        subtype: 'beef',
        quantity: 1,
      };
      expect(calculator.calculateFoodEmissions(input)).toBe(27);
    });

    it('should handle organic options correctly', () => {
      const input: FoodInput = {
        type: 'vegetables',
        quantity: 1,
        isOrganic: true,
      };
      expect(calculator.calculateFoodEmissions(input)).toBe(0.32);
    });

    it('should handle local produce correctly', () => {
      const input: FoodInput = {
        type: 'vegetables',
        quantity: 1,
        isLocal: true,
      };
      expect(calculator.calculateFoodEmissions(input)).toBe(0.29);
    });
  });

  describe('calculateTotalEmissions', () => {
    it('should calculate total emissions correctly', () => {
      const transport: TransportationInput[] = [
        {
          mode: 'car',
          distance: 100,
          fuelType: 'petrol',
        },
      ];

      const energy: EnergyInput[] = [
        {
          type: 'electricity',
          source: 'coal',
          consumption: 1000,
        },
      ];

      const food: FoodInput[] = [
        {
          type: 'meat',
          subtype: 'beef',
          quantity: 1,
        },
      ];

      const waste: WasteInput[] = [
        {
          type: 'landfill',
          quantity: 100,
        },
      ];

      const result = calculator.calculateTotalEmissions(
        transport,
        energy,
        food,
        waste,
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.breakdown.transport.total).toBe(19.2);
      expect(result.breakdown.energy.total).toBe(995);
      expect(result.breakdown.food.total).toBe(27);
      expect(result.breakdown.waste.total).toBe(58.7);

      // Check that percentages add up to 100%
      const totalPercentage = Object.values(result.breakdown).reduce(
        (sum, category) => sum + category.percentage,
        0,
      );
      expect(Math.round(totalPercentage)).toBe(100);
    });
  });

  describe('getEmissionReductionTips', () => {
    it('should return tips for each category', () => {
      const categories: ('transport' | 'energy' | 'food' | 'waste')[] = [
        'transport',
        'energy',
        'food',
        'waste',
      ];

      categories.forEach(category => {
        const tips = calculator.getEmissionReductionTips(category);
        expect(Array.isArray(tips)).toBe(true);
        expect(tips.length).toBeGreaterThan(0);
        expect(tips.every(tip => typeof tip === 'string')).toBe(true);
      });
    });

    it('should return empty array for invalid category', () => {
      const tips = calculator.getEmissionReductionTips('invalid' as any);
      expect(tips).toEqual([]);
    });
  });
});
