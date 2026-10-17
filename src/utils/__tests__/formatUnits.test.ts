import { formatWeight, formatDistance, getWeightUnit, getDistanceUnit } from '../formatUnits';

describe('formatUnits Utility', () => {
  describe('formatWeight', () => {
    it('formats metric kg correctly', () => {
      expect(formatWeight(10, 'metric')).toBe('10.0 kg');
      expect(formatWeight(12.345, 'metric', 2)).toBe('12.35 kg');
    });

    it('converts and formats imperial lbs correctly', () => {
      // 10 kg * 2.20462 = 22.0 lbs
      expect(formatWeight(10, 'imperial')).toBe('22.0 lbs');
      expect(formatWeight(1, 'imperial', 2)).toBe('2.20 lbs');
    });

    it('handles zero, NaN and infinite values safely', () => {
      expect(formatWeight(0, 'metric')).toBe('0.0 kg');
      expect(formatWeight(NaN, 'metric')).toBe('0.0 kg');
      expect(formatWeight(Infinity, 'imperial')).toBe('0.0 lbs');
    });
  });

  describe('formatDistance', () => {
    it('formats metric km correctly', () => {
      expect(formatDistance(5, 'metric')).toBe('5.0 km');
      expect(formatDistance(42.195, 'metric', 2)).toBe('42.20 km');
    });

    it('converts and formats imperial miles correctly', () => {
      // 10 km * 0.621371 = 6.2 mi
      expect(formatDistance(10, 'imperial')).toBe('6.2 mi');
      expect(formatDistance(1, 'imperial', 2)).toBe('0.62 mi');
    });

    it('handles zero, NaN and infinite values safely', () => {
      expect(formatDistance(0, 'metric')).toBe('0.0 km');
      expect(formatDistance(NaN, 'metric')).toBe('0.0 km');
      expect(formatDistance(-Infinity, 'imperial')).toBe('0.0 mi');
    });
  });

  describe('unit symbols', () => {
    it('returns correct symbol for weight', () => {
      expect(getWeightUnit('metric')).toBe('kg');
      expect(getWeightUnit('imperial')).toBe('lbs');
    });

    it('returns correct symbol for distance', () => {
      expect(getDistanceUnit('metric')).toBe('km');
      expect(getDistanceUnit('imperial')).toBe('mi');
    });
  });
});
