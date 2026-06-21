/**
 * @fileoverview Shared Application Constants
 *
 * Centralized constants to eliminate magic numbers, duplicate strings,
 * and improve maintainability following DRY principles.
 *
 * @version 1.0.0
 * @author Kindred Development Team
 */

// ===================================================================
// LOGGING CONSTANTS
// ===================================================================

export const LOG_PREFIXES = {
  CARBON_API: '🌱 [CarbonAPI]',
  NETWORK: '🌐 [NetworkOptimizer]',
  CACHE: '💾 [CacheService]',
  FIREBASE: '🔥 [Firebase]',
  ERROR_BOUNDARY: '🚨 [ErrorBoundary]',
  PERFORMANCE: '⚡ [Performance]',
  SECURITY: '🔒 [Security]',
  AUTH: '🔐 [Auth]',
  NAVIGATION: '🧭 [Navigation]',
  STORAGE: '💽 [Storage]',
  ANALYTICS: '📊 [Analytics]',
} as const;

export const LOG_LEVELS = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

// ===================================================================
// CARBON EMISSION FACTORS (kg CO2 per unit)
// ===================================================================

export const EMISSION_FACTORS = {
  TRANSPORT: {
    CAR_GASOLINE: 0.21, // kg CO2/km
    CAR_DIESEL: 0.25, // kg CO2/km
    CAR_ELECTRIC: 0.05, // kg CO2/km
    BUS: 0.08, // kg CO2/km
    TRAIN: 0.04, // kg CO2/km
    AIRPLANE_DOMESTIC: 0.25, // kg CO2/km
    AIRPLANE_INTERNATIONAL: 0.15, // kg CO2/km
    MOTORCYCLE: 0.12, // kg CO2/km
    BICYCLE: 0.0, // kg CO2/km
    WALKING: 0.0, // kg CO2/km
    SCOOTER: 0.05, // kg CO2/km
  },
  ENERGY: {
    ELECTRICITY_US: 0.4537, // kg CO2/kWh
    ELECTRICITY_EU: 0.2956, // kg CO2/kWh
    NATURAL_GAS: 0.2016, // kg CO2/kWh
    HEATING_OIL: 0.2756, // kg CO2/kWh
    COAL: 0.324, // kg CO2/kWh
    SOLAR: 0.046, // kg CO2/kWh
    WIND: 0.011, // kg CO2/kWh
    NUCLEAR: 0.012, // kg CO2/kWh
  },
  FOOD: {
    BEEF: 27.0, // kg CO2/kg
    PORK: 7.6, // kg CO2/kg
    CHICKEN: 6.9, // kg CO2/kg
    FISH: 5.4, // kg CO2/kg
    DAIRY: 3.2, // kg CO2/kg
    VEGETABLES: 0.4, // kg CO2/kg
    FRUITS: 0.7, // kg CO2/kg
    GRAINS: 1.4, // kg CO2/kg
    NUTS: 0.3, // kg CO2/kg
    LOCAL_ORGANIC: 0.2, // kg CO2/kg
  },
} as const;

// ===================================================================
// API CONFIGURATION
// ===================================================================

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT_RPM: 100, // requests per minute
  CACHE_TTL_SHORT: 300000, // 5 minutes
  CACHE_TTL_MEDIUM: 1800000, // 30 minutes
  CACHE_TTL_LONG: 3600000, // 1 hour
  CACHE_TTL_DAY: 86400000, // 24 hours
} as const;

export const API_ENDPOINTS = {
  CARBON_INTERFACE: 'https://www.carboninterface.com/api/v1',
  CLIMATIQ: 'https://beta3.api.climatiq.io',
  CARBON_FOOTPRINT: 'https://api.carbonfootprint.com/v1',
} as const;

// ===================================================================
// PERFORMANCE THRESHOLDS
// ===================================================================

export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_MS: 16, // 60fps target
  SLOW_OPERATION_MS: 100, // Warn threshold
  MEMORY_WARNING_MB: 50, // Memory usage warning
  NETWORK_TIMEOUT_MS: 5000, // Network timeout
  CACHE_SIZE_LIMIT_MB: 50, // Cache size limit
} as const;

// ===================================================================
// FORM VALIDATION
// ===================================================================

export const VALIDATION_LIMITS = {
  DISTANCE_MAX_KM: 10000, // Maximum distance
  PASSENGERS_MIN: 1,
  PASSENGERS_MAX: 20,
  ENERGY_MAX_KWH: 10000, // Maximum energy consumption
  FOOD_MAX_KG: 100, // Maximum food amount
  DESCRIPTION_MIN_LENGTH: 3,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_DISTANCE: 'Please enter a valid distance',
  DISTANCE_TOO_HIGH: 'Distance seems unusually high. Please verify.',
  INVALID_PASSENGERS: `Number of passengers must be between ${VALIDATION_LIMITS.PASSENGERS_MIN} and ${VALIDATION_LIMITS.PASSENGERS_MAX}`,
  INVALID_ENERGY: 'Please enter a valid energy amount',
  INVALID_FOOD: 'Please enter a valid food amount',
  DESCRIPTION_REQUIRED: 'Please provide a brief description',
  DESCRIPTION_TOO_LONG: `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
} as const;

// ===================================================================
// UI CONSTANTS
// ===================================================================

import { lightTheme } from '../theme/theme';
/** @deprecated Use colors from theme instead: import { useTheme } from '../theme/ThemeProvider' */
export const COLORS = lightTheme.colors;

export const TRANSPORT_MODE_COLORS = {
  CAR: '#FF6B6B',
  BUS: '#4ECDC4',
  TRAIN: '#45B7D1',
  PLANE: '#96CEB4',
  BIKE: '#FFA726',
  WALK: '#66BB6A',
  SCOOTER: '#AB47BC',
  MOTORCYCLE: '#FF5722',
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  H1: 32,
  H2: 28,
  H3: 24,
  H4: 20,
  H5: 18,
  H6: 16,
} as const;

// ===================================================================
// BUSINESS LOGIC CONSTANTS
// ===================================================================

export const CARBON_CONVERSION = {
  TREES_PER_TON_CO2: 21.8, // Trees needed to absorb 1 ton CO2/year
  OFFSET_COST_PER_KG: 0.025, // USD per kg CO2
  KG_TO_TONS: 0.001, // Conversion factor
  TONS_TO_KG: 1000, // Conversion factor
} as const;

export const TIME_PERIODS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ACHIEVEMENT_THRESHOLDS = {
  FIRST_ACTIVITY: 1,
  CONSISTENT_TRACKER: 7, // 7 days
  ECO_WARRIOR: 30, // 30 days
  CARBON_SAVER: 100, // 100kg CO2 saved
  GREEN_CHAMPION: 1000, // 1 ton CO2 saved
} as const;

// ===================================================================
// STORAGE KEYS
// ===================================================================

export const STORAGE_KEYS = {
  USER_PREFERENCES: '@user_preferences',
  CARBON_ACTIVITIES: '@carbon_activities',
  OFFLINE_DATA: '@offline_data',
  CACHE_DATA: '@cache_data',
  ANALYTICS_DATA: '@analytics_data',
  SETTINGS: '@settings',
  ACHIEVEMENTS: '@achievements',
  LOGS: '@logs',
} as const;

// ===================================================================
// NETWORK & SECURITY
// ===================================================================

export const SECURITY_CONFIG = {
  TOKEN_EXPIRY_HOURS: 24,
  REFRESH_BUFFER_MINUTES: 5,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT_MINUTES: 30,
} as const;

export const NETWORK_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  READ_TIMEOUT: 30000, // 30 seconds
} as const;

// ===================================================================
// ERROR CODES
// ===================================================================

export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // API errors
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_SERVER_ERROR: 'API_SERVER_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',

  // Security errors
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

// ===================================================================
// TRANSPORT MODES CONFIGURATION
// ===================================================================

export const TRANSPORT_MODES = [
  {
    id: 'car',
    name: 'Car',
    icon: 'car-outline',
    color: TRANSPORT_MODE_COLORS.CAR,
    category: 'motorized',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.CAR_GASOLINE,
  },
  {
    id: 'bus',
    name: 'Bus',
    icon: 'bus-outline',
    color: TRANSPORT_MODE_COLORS.BUS,
    category: 'public',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.BUS,
  },
  {
    id: 'train',
    name: 'Train',
    icon: 'train-outline',
    color: TRANSPORT_MODE_COLORS.TRAIN,
    category: 'public',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.TRAIN,
  },
  {
    id: 'plane',
    name: 'Flight',
    icon: 'airplane-outline',
    color: TRANSPORT_MODE_COLORS.PLANE,
    category: 'aviation',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.AIRPLANE_DOMESTIC,
  },
  {
    id: 'bike',
    name: 'Bicycle',
    icon: 'bicycle-outline',
    color: TRANSPORT_MODE_COLORS.BIKE,
    category: 'sustainable',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.BICYCLE,
  },
  {
    id: 'walk',
    name: 'Walking',
    icon: 'walk-outline',
    color: TRANSPORT_MODE_COLORS.WALK,
    category: 'sustainable',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.WALKING,
  },
  {
    id: 'scooter',
    name: 'E-Scooter',
    icon: 'flash-outline',
    color: TRANSPORT_MODE_COLORS.SCOOTER,
    category: 'micro-mobility',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.SCOOTER,
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    icon: 'bicycle-outline',
    color: TRANSPORT_MODE_COLORS.MOTORCYCLE,
    category: 'motorized',
    emissionFactor: EMISSION_FACTORS.TRANSPORT.MOTORCYCLE,
  },
] as const;

export const FUEL_TYPES = [
  {
    id: 'gasoline',
    name: 'Gasoline',
    factor: EMISSION_FACTORS.TRANSPORT.CAR_GASOLINE,
  },
  {
    id: 'diesel',
    name: 'Diesel',
    factor: EMISSION_FACTORS.TRANSPORT.CAR_DIESEL,
  },
  {
    id: 'electric',
    name: 'Electric',
    factor: EMISSION_FACTORS.TRANSPORT.CAR_ELECTRIC,
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    factor: EMISSION_FACTORS.TRANSPORT.CAR_GASOLINE * 0.7,
  },
  {
    id: 'plugin-hybrid',
    name: 'Plug-in Hybrid',
    factor: EMISSION_FACTORS.TRANSPORT.CAR_GASOLINE * 0.5,
  },
  {
    id: 'natural-gas',
    name: 'Natural Gas',
    factor: EMISSION_FACTORS.ENERGY.NATURAL_GAS,
  },
] as const;

// ===================================================================
// TYPE EXPORTS
// ===================================================================

export type LogPrefix = keyof typeof LOG_PREFIXES;
export type LogLevel = keyof typeof LOG_LEVELS;
export type TransportModeId = (typeof TRANSPORT_MODES)[number]['id'];
export type FuelTypeId = (typeof FUEL_TYPES)[number]['id'];
export type ErrorCode = keyof typeof ERROR_CODES;
export type StorageKey = keyof typeof STORAGE_KEYS;

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export const getEmissionFactor = (category: string, type: string): number => {
  switch (category) {
    case 'transport':
      return (
        EMISSION_FACTORS.TRANSPORT[
          type as keyof typeof EMISSION_FACTORS.TRANSPORT
        ] ?? 0
      );
    case 'energy':
      return (
        EMISSION_FACTORS.ENERGY[type as keyof typeof EMISSION_FACTORS.ENERGY] ??
        0
      );
    case 'food':
      return (
        EMISSION_FACTORS.FOOD[type as keyof typeof EMISSION_FACTORS.FOOD] ?? 0
      );
    default:
      return 0;
  }
};

export const getTransportModeConfig = (modeId: string) =>
  TRANSPORT_MODES.find(mode => mode.id === modeId);

export const getFuelTypeConfig = (fuelId: string) =>
  FUEL_TYPES.find(fuel => fuel.id === fuelId);

export const calculateTreesEquivalent = (carbonKg: number): number =>
  Math.ceil(carbonKg / CARBON_CONVERSION.TREES_PER_TON_CO2);

export const calculateOffsetCost = (carbonKg: number): number =>
  Number((carbonKg * CARBON_CONVERSION.OFFSET_COST_PER_KG).toFixed(2));

export default {
  LOG_PREFIXES,
  LOG_LEVELS,
  EMISSION_FACTORS,
  API_CONFIG,
  PERFORMANCE_THRESHOLDS,
  VALIDATION_LIMITS,
  VALIDATION_MESSAGES,
  COLORS,
  TRANSPORT_MODE_COLORS,
  TRANSPORT_MODES,
  FUEL_TYPES,
  CARBON_CONVERSION,
  STORAGE_KEYS,
  ERROR_CODES,
  getEmissionFactor,
  getTransportModeConfig,
  getFuelTypeConfig,
  calculateTreesEquivalent,
  calculateOffsetCost,
};
