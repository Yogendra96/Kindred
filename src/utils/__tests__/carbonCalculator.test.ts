 import { calculateCarbonFootprint, getCarbonFootprintTips } from '../carbonCalculator';

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
        waste: 3
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
        waste: 1
      };

      const tips = getCarbonFootprintTips(footprint);
      expect(tips).toHaveLength(0);
    });
  });
});