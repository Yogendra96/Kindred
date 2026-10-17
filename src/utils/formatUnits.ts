/**
 * formatUnits.ts — Universal unit conversion and formatting for Metric vs Imperial preferences.
 */

export type UnitSystem = 'metric' | 'imperial';

/**
 * Formats a carbon / weight value in kg or lbs based on the chosen unit system.
 */
export function formatWeight(
  kg: number,
  units: UnitSystem = 'metric',
  decimals: number = 1,
): string {
  if (isNaN(kg) || !isFinite(kg)) {
    return `0.0 ${units === 'imperial' ? 'lbs' : 'kg'}`;
  }

  if (units === 'imperial') {
    const lbs = kg * 2.20462262;
    return `${lbs.toFixed(decimals)} lbs`;
  }

  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Formats a distance value in km or mi based on the chosen unit system.
 */
export function formatDistance(
  km: number,
  units: UnitSystem = 'metric',
  decimals: number = 1,
): string {
  if (isNaN(km) || !isFinite(km)) {
    return `0.0 ${units === 'imperial' ? 'mi' : 'km'}`;
  }

  if (units === 'imperial') {
    const miles = km * 0.62137119;
    return `${miles.toFixed(decimals)} mi`;
  }

  return `${km.toFixed(decimals)} km`;
}

/**
 * Returns the short symbol for weight unit.
 */
export function getWeightUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? 'lbs' : 'kg';
}

/**
 * Returns the short symbol for distance unit.
 */
export function getDistanceUnit(units: UnitSystem = 'metric'): string {
  return units === 'imperial' ? 'mi' : 'km';
}
