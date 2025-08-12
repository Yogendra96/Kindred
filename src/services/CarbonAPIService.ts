/**
 * @fileoverview Carbon API Service for calculating and tracking carbon emissions
 *
 * This service provides comprehensive carbon footprint calculation capabilities
 * by integrating with external carbon emission factor databases and APIs.
 * It supports real-time emission calculations, product carbon footprints,
 * and carbon offset marketplace integration.
 *
 * @version 2.0.0
 * @author Kindred Development Team
 * @since 1.0.0
 */

import { CARBON_API_BASE_URL, CARBON_API_KEY, ENABLE_API_MOCKING } from '@env';
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

import { loggingService } from './LoggingService';

/**
 * Represents a carbon emission factor for a specific activity or product
 *
 * @interface CarbonEmissionFactor
 * @example
 * ```typescript
 * const factor: CarbonEmissionFactor = {
 *   id: 'electricity-us-grid',
 *   category: 'energy',
 *   subcategory: 'electricity',
 *   factor: 0.4537,
 *   unit: 'kg CO2/kWh',
 *   region: 'US',
 *   source: 'EPA eGRID 2021',
 *   lastUpdated: new Date('2023-01-01')
 * };
 * ```
 */
export interface CarbonEmissionFactor {
  /** Unique identifier for the emission factor */
  id: string;
  /** Primary category (energy, transport, food, etc.) */
  category: string;
  /** Specific subcategory within the main category */
  subcategory: string;
  /** Emission factor value in kg CO2 per unit */
  factor: number;
  /** Unit of measurement for the emission factor */
  unit: string;
  /** Geographic region where factor applies */
  region?: string;
  /** Data source for the emission factor */
  source: string;
  /** Date when the factor was last updated */
  lastUpdated: Date;
}

export interface CarbonCalculationRequest {
  activityType: string;
  amount: number;
  unit: string;
  region?: string;
  additionalParams?: Record<string, any>;
}

export interface CarbonCalculationResponse {
  emissions: number; // kg CO2
  factor: CarbonEmissionFactor;
  confidence: number; // 0-1
  breakdown?: {
    direct: number;
    indirect: number;
    lifecycle?: number;
  };
  recommendations?: string[];
}

/**
 * Carbon emission calculation result for forms
 */
export interface CarbonEmissionCalculation {
  carbon_footprint_kg: number;
  equivalent_trees_planted: number;
  offset_cost_usd: number;
  emission_factor_id?: string;
  activity_uuid?: string;
  confidence?: number;
  breakdown?: {
    direct: number;
    indirect: number;
    lifecycle?: number;
  };
}

export interface ProductCarbonFootprint {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  emissions: {
    production: number;
    transportation: number;
    packaging: number;
    disposal: number;
    total: number;
  };
  certifications: string[];
  alternatives?: {
    name: string;
    emissions: number;
    reason: string;
  }[];
  lastUpdated: Date;
}

export interface CarbonOffsetProject {
  id: string;
  name: string;
  type: 'forestry' | 'renewable' | 'efficiency' | 'capture' | 'community';
  location: string;
  pricePerTon: number; // USD
  availableCredits: number;
  certification: string[];
  description: string;
  images: string[];
  impact: {
    co2Reduced: number;
    beneficiaries?: number;
    additionalBenefits: string[];
  };
  timeline: {
    start: Date;
    end: Date;
    verification: Date;
  };
}

export interface CarbonBudget {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number; // kg CO2
  current: number; // kg CO2
  remaining: number; // kg CO2
  categories: {
    transport: number;
    energy: number;
    food: number;
    consumption: number;
    other: number;
  };
  recommendations: {
    category: string;
    action: string;
    potential: number; // kg CO2 savings
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

export interface CarbonTrend {
  period: string;
  emissions: number;
  target: number;
  categories: Record<string, number>;
  comparison: {
    previousPeriod: number;
    average: number;
    percentile: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

class CarbonAPIService {
  private api: AxiosInstance;
  private apis: Map<string, AxiosInstance> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> =
    new Map();
  private logger: typeof loggingService;
  
  // Enhanced emission factors database for offline calculations
  private emissionFactors = {
    transport: {
      car_gasoline: { factor: 0.21, unit: 'kg CO2/km', source: 'DEFRA 2023' },
      car_diesel: { factor: 0.25, unit: 'kg CO2/km', source: 'DEFRA 2023' },
      car_electric: { factor: 0.05, unit: 'kg CO2/km', source: 'EPA 2023' },
      bus: { factor: 0.08, unit: 'kg CO2/km', source: 'DEFRA 2023' },
      train: { factor: 0.04, unit: 'kg CO2/km', source: 'DEFRA 2023' },
      airplane_domestic: { factor: 0.25, unit: 'kg CO2/km', source: 'ICAO 2023' },
      airplane_international: { factor: 0.15, unit: 'kg CO2/km', source: 'ICAO 2023' },
      motorcycle: { factor: 0.12, unit: 'kg CO2/km', source: 'DEFRA 2023' },
      bicycle: { factor: 0.0, unit: 'kg CO2/km', source: 'Zero Emission' },
      walking: { factor: 0.0, unit: 'kg CO2/km', source: 'Zero Emission' },
    },
    energy: {
      electricity_us: { factor: 0.4537, unit: 'kg CO2/kWh', source: 'EPA eGRID 2023' },
      electricity_eu: { factor: 0.2956, unit: 'kg CO2/kWh', source: 'EEA 2023' },
      natural_gas: { factor: 0.2016, unit: 'kg CO2/kWh', source: 'EPA 2023' },
      heating_oil: { factor: 0.2756, unit: 'kg CO2/kWh', source: 'EPA 2023' },
      coal: { factor: 0.3240, unit: 'kg CO2/kWh', source: 'EPA 2023' },
      solar: { factor: 0.046, unit: 'kg CO2/kWh', source: 'IPCC 2023' },
      wind: { factor: 0.011, unit: 'kg CO2/kWh', source: 'IPCC 2023' },
      nuclear: { factor: 0.012, unit: 'kg CO2/kWh', source: 'IPCC 2023' },
    },
    food: {
      beef: { factor: 27.0, unit: 'kg CO2/kg', source: 'FAO 2023' },
      pork: { factor: 7.6, unit: 'kg CO2/kg', source: 'FAO 2023' },
      chicken: { factor: 6.9, unit: 'kg CO2/kg', source: 'FAO 2023' },
      fish: { factor: 5.4, unit: 'kg CO2/kg', source: 'FAO 2023' },
      dairy: { factor: 3.2, unit: 'kg CO2/kg', source: 'FAO 2023' },
      vegetables: { factor: 0.4, unit: 'kg CO2/kg', source: 'FAO 2023' },
      fruits: { factor: 0.7, unit: 'kg CO2/kg', source: 'FAO 2023' },
      grains: { factor: 1.4, unit: 'kg CO2/kg', source: 'FAO 2023' },
      nuts: { factor: 0.3, unit: 'kg CO2/kg', source: 'FAO 2023' },
      local_organic: { factor: 0.2, unit: 'kg CO2/kg', source: 'Sustainable Agriculture' },
    },
  };

  constructor() {
    this.logger = loggingService;

    this.api = axios.create({
      baseURL: CARBON_API_BASE_URL ?? 'https://api.carbonfootprint.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kindred-App/1.0',
        'X-API-Key': CARBON_API_KEY,
      },
    });

    // Initialize multiple API endpoints for redundancy
    this.initializeAPIs();

    this.setupInterceptors();
  }

  /**
   * Initialize multiple API endpoints for redundancy and reliability
   */
  private initializeAPIs(): void {
    // CarbonInterface API (primary)
    this.apis.set('carboninterface', axios.create({
      baseURL: 'https://www.carboninterface.com/api/v1',
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${CARBON_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }));

    // Climatiq API (secondary)
    this.apis.set('climatiq', axios.create({
      baseURL: 'https://beta3.api.climatiq.io',
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }));

    // CarbonFootprint.com API (tertiary)
    this.apis.set('carbonfootprint', axios.create({
      baseURL: 'https://api.carbonfootprint.com/v1',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CARBON_FOOTPRINT_API_KEY,
      },
    }));
  }

  /**
   * Enhanced carbon calculation with multiple API fallbacks and offline calculations
   */
  async calculateEmissions(request: CarbonCalculationRequest): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit, region, additionalParams } = request;
    
    // Try each API in order of preference
    const apiNames = ['carboninterface', 'climatiq', 'carbonfootprint'];
    
    for (const apiName of apiNames) {
      try {
        const result = await this.calculateWithAPI(apiName, request);
        if (result) {
          this.logger.info(`Carbon calculation successful with ${apiName}`, {
            activityType,
            amount,
            emissions: result.emissions,
          });
          return result;
        }
      } catch (error) {
        this.logger.warn(`Carbon calculation failed with ${apiName}`, {
          activityType,
          amount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }
    }

    // Fallback to offline calculation
    this.logger.info('Using offline carbon calculation as fallback', {
      activityType,
      amount,
    });
    
    return this.calculateOffline(request);
  }

  /**
   * Calculate emissions using a specific API
   */
  private async calculateWithAPI(
    apiName: string,
    request: CarbonCalculationRequest
  ): Promise<CarbonCalculationResponse | null> {
    const api = this.apis.get(apiName);
    if (!api) return null;

    switch (apiName) {
      case 'carboninterface':
        return this.calculateWithCarbonInterface(api, request);
      case 'climatiq':
        return this.calculateWithClimatiq(api, request);
      case 'carbonfootprint':
        return this.calculateWithCarbonFootprint(api, request);
      default:
        return null;
    }
  }

  /**
   * Calculate emissions using CarbonInterface API
   */
  private async calculateWithCarbonInterface(
    api: AxiosInstance,
    request: CarbonCalculationRequest
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit, additionalParams } = request;
    
    let endpoint = '';
    let data: any = {};

    // Map activity types to CarbonInterface endpoints
    switch (activityType) {
      case 'transport':
        endpoint = '/estimates';
        data = {
          type: 'vehicle',
          distance_unit: unit === 'km' ? 'km' : 'mi',
          distance_value: amount,
          vehicle_model_id: additionalParams?.vehicleId || 'default',
        };
        break;
      
      case 'energy':
        endpoint = '/estimates';
        data = {
          type: 'electricity',
          electricity_unit: unit === 'kWh' ? 'kwh' : 'mwh',
          electricity_value: amount,
          country: additionalParams?.country || 'us',
          state: additionalParams?.state || 'ca',
        };
        break;
        
      case 'flight':
        endpoint = '/estimates';
        data = {
          type: 'flight',
          passengers: additionalParams?.passengers || 1,
          legs: [{
            departure_airport: additionalParams?.origin || 'SFO',
            destination_airport: additionalParams?.destination || 'LAX',
          }],
        };
        break;
        
      default:
        throw new Error(`Unsupported activity type: ${activityType}`);
    }

    const response = await api.post(endpoint, data);
    const result = response.data.data.attributes;

    return {
      emissions: result.carbon_kg,
      factor: {
        id: `carboninterface-${activityType}`,
        category: activityType,
        subcategory: activityType,
        factor: result.carbon_kg / amount,
        unit: `kg CO2/${unit}`,
        source: 'CarbonInterface',
        lastUpdated: new Date(),
      },
      confidence: 0.9,
      breakdown: {
        direct: result.carbon_kg * 0.8,
        indirect: result.carbon_kg * 0.2,
      },
    };
  }

  /**
   * Calculate emissions using Climatiq API
   */
  private async calculateWithClimatiq(
    api: AxiosInstance,
    request: CarbonCalculationRequest
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit } = request;
    
    // Map to Climatiq emission factor IDs
    const emissionFactorMap: Record<string, string> = {
      'transport-car': 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
      'energy-electricity': 'electricity-energy_source_grid_mix',
      'energy-natural_gas': 'heat-fuel_source_natural_gas',
    };

    const factorId = emissionFactorMap[`${activityType}-${request.additionalParams?.subtype || 'default'}`];
    if (!factorId) {
      throw new Error(`No emission factor found for ${activityType}`);
    }

    const data = {
      emission_factor: {
        activity_id: factorId,
      },
      parameters: {
        [unit]: amount,
      },
    };

    const response = await api.post('/estimate', data);
    const result = response.data;

    return {
      emissions: result.co2e,
      factor: {
        id: factorId,
        category: activityType,
        subcategory: activityType,
        factor: result.co2e / amount,
        unit: `kg CO2e/${unit}`,
        source: 'Climatiq',
        lastUpdated: new Date(),
      },
      confidence: 0.95,
      breakdown: {
        direct: result.co2e * 0.85,
        indirect: result.co2e * 0.15,
      },
    };
  }

  /**
   * Calculate emissions using CarbonFootprint.com API
   */
  private async calculateWithCarbonFootprint(
    api: AxiosInstance,
    request: CarbonCalculationRequest
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit } = request;
    
    let endpoint = '';
    const params: any = {};

    switch (activityType) {
      case 'transport':
        endpoint = '/vehicle';
        params.distance = amount;
        params.fuelType = request.additionalParams?.fuelType || 'petrol';
        break;
        
      case 'energy':
        endpoint = '/electricity';
        params.consumption = amount;
        params.location = request.additionalParams?.location || 'US';
        break;
        
      default:
        throw new Error(`Unsupported activity type: ${activityType}`);
    }

    const response = await api.get(endpoint, { params });
    const result = response.data;

    return {
      emissions: result.carbonEquivalent,
      factor: {
        id: `carbonfootprint-${activityType}`,
        category: activityType,
        subcategory: activityType,
        factor: result.carbonEquivalent / amount,
        unit: `kg CO2/${unit}`,
        source: 'CarbonFootprint.com',
        lastUpdated: new Date(),
      },
      confidence: 0.85,
      breakdown: {
        direct: result.carbonEquivalent * 0.75,
        indirect: result.carbonEquivalent * 0.25,
      },
    };
  }

  /**
   * Offline carbon calculation using built-in emission factors
   */
  private calculateOffline(request: CarbonCalculationRequest): CarbonCalculationResponse {
    const { activityType, amount, unit, additionalParams } = request;
    
    // Determine the emission factor category and key
    let category: keyof typeof this.emissionFactors;
    let factorKey: string;
    
    if (activityType === 'transport') {
      category = 'transport';
      factorKey = additionalParams?.vehicleType || 'car_gasoline';
    } else if (activityType === 'energy') {
      category = 'energy';
      factorKey = additionalParams?.energySource || 'electricity_us';
    } else if (activityType === 'food') {
      category = 'food';
      factorKey = additionalParams?.foodType || 'vegetables';
    } else {
      throw new Error(`Unsupported activity type for offline calculation: ${activityType}`);
    }

    const factorData = this.emissionFactors[category][factorKey as keyof typeof this.emissionFactors[typeof category]];
    if (!factorData) {
      throw new Error(`No emission factor found for ${category}:${factorKey}`);
    }

    // Unit conversion if needed
    let convertedAmount = amount;
    if (unit !== factorData.unit.split('/')[1]) {
      convertedAmount = this.convertUnits(amount, unit, factorData.unit.split('/')[1]);
    }

    const emissions = convertedAmount * factorData.factor;

    return {
      emissions,
      factor: {
        id: `offline-${category}-${factorKey}`,
        category,
        subcategory: factorKey,
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
      recommendations: this.getRecommendations(category, factorKey, emissions),
    };
  }

  /**
   * Convert units for calculations
   */
  private convertUnits(value: number, fromUnit: string, toUnit: string): number {
    // Distance conversions
    if (fromUnit === 'mi' && toUnit === 'km') return value * 1.609;
    if (fromUnit === 'km' && toUnit === 'mi') return value / 1.609;
    
    // Energy conversions
    if (fromUnit === 'mWh' && toUnit === 'kWh') return value * 1000;
    if (fromUnit === 'kWh' && toUnit === 'mWh') return value / 1000;
    
    // Weight conversions
    if (fromUnit === 'lb' && toUnit === 'kg') return value * 0.453592;
    if (fromUnit === 'kg' && toUnit === 'lb') return value / 0.453592;
    
    // If no conversion needed or unknown conversion
    return value;
  }

  /**
   * Get recommendations based on the activity and emissions
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
        break;
        
      case 'energy':
        recommendations.push('Switch to renewable energy sources when possible');
        if (emissions > 10) {
          recommendations.push('Consider energy-efficient appliances and LED lighting');
        }
        recommendations.push('Improve home insulation to reduce energy consumption');
        break;
        
      case 'food':
        if (activityType === 'beef') {
          recommendations.push('Try reducing meat consumption or choosing plant-based alternatives');
        }
        recommendations.push('Choose locally sourced and seasonal produce when possible');
        recommendations.push('Consider organic options to support sustainable farming');
        break;
    }

    return recommendations;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      config => {
        // Add request ID for tracking
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now(),
        };

        // Check rate limits
        this.checkRateLimit(config.url ?? '');

        // Add authentication if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      response => {
        // Track performance
        const duration = Date.now() - response.config.metadata.startTime;
        this.logger.debug('API call completed', {
          url: response.config.url,
          status: 'success',
          duration,
        });

        // Update rate limit tracking
        this.updateRateLimit(response);

        return response;
      },
      error => {
        // Track error
        const duration = error.config?.metadata?.startTime
          ? Date.now() - error.config.metadata.startTime
          : 0;

        this.logger.error('API call failed', {
          url: error.config?.url,
          status: 'error',
          duration,
          statusCode: error.response?.status,
        });

        // Handle specific error cases
        return this.handleAPIError(error);
      },
    );
  }

  // Emission Factors
  async getEmissionFactors(
    category?: string,
    region?: string,
  ): Promise<CarbonEmissionFactor[]> {
    const cacheKey = `emission-factors-${category ?? 'all'}-${region ?? 'global'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params: any = {};
    if (category) params.category = category;
    if (region) params.region = region;

    const response = await this.api.get('/emission-factors', { params });
    const factors = response.data.map((factor: any) => ({
      ...factor,
      lastUpdated: new Date(factor.lastUpdated),
    }));

    this.setCache(cacheKey, factors, 3600000); // 1 hour TTL
    return factors;
  }

  async getEmissionFactor(
    activityType: string,
    region?: string,
  ): Promise<CarbonEmissionFactor | null> {
    const cacheKey = `emission-factor-${activityType}-${region ?? 'global'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/emission-factors/${activityType}`, {
        params: { region },
      });

      const factor = {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
      };

      this.setCache(cacheKey, factor, 3600000); // 1 hour TTL
      return factor;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Carbon Calculations
  async calculateEmissions(
    request: CarbonCalculationRequest,
  ): Promise<CarbonCalculationResponse> {
    const startTime = Date.now();

    // Check if API mocking is enabled
    if (ENABLE_API_MOCKING === 'true' || CARBON_API_KEY === 'mock_key_for_development') {
      return this.getMockEmissionCalculation(request);
    }

    try {
      const response = await this.api.post('/calculate', request);
      const result = {
        ...response.data,
        factor: {
          ...response.data.factor,
          lastUpdated: new Date(response.data.factor.lastUpdated),
        },
      };

      this.logger.info('Carbon calculation completed', {
        activityType: request.activityType,
        emissions: result.emissions,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Carbon calculation failed', {
        activityType: request.activityType,
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate mock emission calculation for development and testing
   */
  private getMockEmissionCalculation(request: CarbonCalculationRequest): CarbonCalculationResponse {
    const baseEmissions = this.calculateMockEmissions(request);
    
    return {
      emissions: baseEmissions,
      confidence: 0.85,
      factor: {
        id: `mock-${request.activityType}`,
        category: request.activityType,
        subcategory: 'standard',
        factor: baseEmissions / (request.amount || 1),
        unit: `kg CO2/${request.unit}`,
        region: request.region || 'US',
        source: 'Mock Development Data',
        lastUpdated: new Date(),
      },
      breakdown: {
        direct: baseEmissions * 0.7,
        indirect: baseEmissions * 0.3,
        lifecycle: baseEmissions * 1.2,
      },
      recommendations: this.getMockRecommendations(request.activityType),
    };
  }

  /**
   * Calculate mock emissions based on activity type and amount
   */
  private calculateMockEmissions(request: CarbonCalculationRequest): number {
    const { activityType, amount, unit } = request;
    
    // Mock emission factors (kg CO2 per unit)
    const mockFactors: Record<string, Record<string, number>> = {
      transport: {
        car: 0.21, // kg CO2/km
        bus: 0.089, // kg CO2/km
        train: 0.041, // kg CO2/km
        plane: 0.255, // kg CO2/km
        bike: 0,
        walk: 0,
        scooter: 0.05,
        motorcycle: 0.113,
      },
      energy: {
        electricity: 0.4537, // kg CO2/kWh
        heating: 0.184, // kg CO2/kWh
        cooling: 0.4537,
        'hot-water': 0.2,
        cooking: 0.184,
        lighting: 0.4537,
      },
      food: {
        meat: 27, // kg CO2/kg
        seafood: 6,
        dairy: 3.2,
        vegetables: 2,
        fruits: 1.1,
        grains: 1.4,
        snacks: 3.8,
        beverages: 0.7,
      },
    };

    const factors = mockFactors[activityType] || {};
    const additionalParams = request.additionalParams || {};
    
    // Get base emission factor
    let factor = 0;
    if (activityType === 'transport') {
      factor = factors[additionalParams.mode] || factors.car;
    } else if (activityType === 'energy') {
      factor = factors[additionalParams.energy_type] || factors.electricity;
    } else if (activityType === 'food') {
      factor = factors[additionalParams.category] || factors.vegetables;
    }
    
    // Calculate base emissions
    let emissions = (amount || 1) * factor;
    
    // Apply modifiers based on additional parameters
    if (additionalParams.renewable_percentage) {
      const renewableReduction = (additionalParams.renewable_percentage / 100) * 0.8;
      emissions = emissions * (1 - renewableReduction);
    }
    
    if (additionalParams.efficiency === 'high') {
      emissions = emissions * 0.7;
    } else if (additionalParams.efficiency === 'low') {
      emissions = emissions * 1.3;
    }
    
    if (additionalParams.sustainability_modifier) {
      emissions = emissions * additionalParams.sustainability_modifier;
    }
    
    if (additionalParams.waste_factor) {
      emissions = emissions * additionalParams.waste_factor;
    }

    // Apply passengers for transportation
    if (activityType === 'transport' && additionalParams.passengers) {
      emissions = emissions / Math.max(additionalParams.passengers, 1);
    }

    return Math.max(emissions, 0);
  }

  /**
   * Get mock recommendations based on activity type
   */
  private getMockRecommendations(activityType: string): string[] {
    const recommendations: Record<string, string[]> = {
      transport: [
        'Consider using public transportation or carpooling',
        'Switch to an electric or hybrid vehicle',
        'Combine multiple trips into one journey',
        'Try cycling or walking for short distances',
      ],
      energy: [
        'Switch to renewable energy sources',
        'Improve home insulation',
        'Use energy-efficient appliances',
        'Install a smart thermostat',
      ],
      food: [
        'Choose locally sourced and seasonal foods',
        'Reduce meat consumption',
        'Minimize food waste',
        'Choose organic options when possible',
      ],
    };
    
    return recommendations[activityType] || ['Consider more sustainable alternatives'];
  }

  /**
   * Convert CarbonCalculationResponse to CarbonEmissionCalculation format for forms
   */
  static convertToFormCalculation(response: CarbonCalculationResponse): CarbonEmissionCalculation {
    // Calculate trees needed to offset emissions (1 tree absorbs ~21.8 kg CO2/year)
    const equivalent_trees_planted = Math.ceil(response.emissions / 21.8);
    
    // Calculate offset cost (approximately $0.02-$0.05 per kg CO2)
    const offset_cost_usd = Number((response.emissions * 0.025).toFixed(2));
    
    return {
      carbon_footprint_kg: Number(response.emissions.toFixed(2)),
      equivalent_trees_planted,
      offset_cost_usd,
      emission_factor_id: response.factor.id,
      confidence: response.confidence,
      breakdown: response.breakdown,
    };
  }

  async batchCalculateEmissions(
    requests: CarbonCalculationRequest[],
  ): Promise<CarbonCalculationResponse[]> {
    const startTime = Date.now();

    try {
      const response = await this.api.post('/calculate/batch', { requests });
      const results = response.data.map((result: any) => ({
        ...result,
        factor: {
          ...result.factor,
          lastUpdated: new Date(result.factor.lastUpdated),
        },
      }));

      this.logger.info('Batch carbon calculation completed', {
        batchSize: requests.length,
        duration: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.logger.error('Batch carbon calculation failed', {
        batchSize: requests.length,
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  // Product Carbon Footprint
  async getProductFootprint(
    barcode: string,
  ): Promise<ProductCarbonFootprint | null> {
    const cacheKey = `product-footprint-${barcode}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/products/${barcode}`);
      const product = {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
      };

      this.setCache(cacheKey, product, 86400000); // 24 hours TTL
      return product;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchProducts(
    query: string,
    category?: string,
    limit: number = 20,
  ): Promise<ProductCarbonFootprint[]> {
    const response = await this.api.get('/products/search', {
      params: { q: query, category, limit },
    });

    return response.data.map((product: any) => ({
      ...product,
      lastUpdated: new Date(product.lastUpdated),
    }));
  }

  // Carbon Offset Projects
  async getOffsetProjects(
    type?: string,
    location?: string,
    maxPrice?: number,
  ): Promise<CarbonOffsetProject[]> {
    const cacheKey = `offset-projects-${type ?? 'all'}-${location ?? 'all'}-${maxPrice ?? 'any'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params: any = {};
    if (type) params.type = type;
    if (location) params.location = location;
    if (maxPrice) params.maxPrice = maxPrice;

    const response = await this.api.get('/offset-projects', { params });
    const projects = response.data.map((project: any) => ({
      ...project,
      timeline: {
        start: new Date(project.timeline.start),
        end: new Date(project.timeline.end),
        verification: new Date(project.timeline.verification),
      },
    }));

    this.setCache(cacheKey, projects, 1800000); // 30 minutes TTL
    return projects;
  }

  async getOffsetProject(id: string): Promise<CarbonOffsetProject | null> {
    const cacheKey = `offset-project-${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/offset-projects/${id}`);
      const project = {
        ...response.data,
        timeline: {
          start: new Date(response.data.timeline.start),
          end: new Date(response.data.timeline.end),
          verification: new Date(response.data.timeline.verification),
        },
      };

      this.setCache(cacheKey, project, 1800000); // 30 minutes TTL
      return project;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Carbon Budget and Tracking
  async getCarbonBudget(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): Promise<CarbonBudget> {
    const response = await this.api.get(`/users/${userId}/budget`, {
      params: { period },
    });

    return response.data;
  }

  async updateCarbonBudget(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    target: number,
  ): Promise<CarbonBudget> {
    const response = await this.api.put(`/users/${userId}/budget`, {
      period,
      target,
    });

    return response.data;
  }

  async getCarbonTrends(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<CarbonTrend[]> {
    const params: any = { period };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await this.api.get(`/users/${userId}/trends`, { params });
    return response.data;
  }

  // Benchmarking and Comparisons
  async getBenchmarks(
    category: string,
    region?: string,
    demographic?: Record<string, any>,
  ): Promise<{
    average: number;
    median: number;
    percentiles: Record<string, number>;
    sampleSize: number;
  }> {
    const params: any = { category };
    if (region) params.region = region;
    if (demographic) params.demographic = JSON.stringify(demographic);

    const response = await this.api.get('/benchmarks', { params });
    return response.data;
  }

  async compareEmissions(
    userId: string,
    category: string,
    period: 'month' | 'quarter' | 'year',
  ): Promise<{
    userEmissions: number;
    averageEmissions: number;
    percentile: number;
    ranking: number;
    totalUsers: number;
  }> {
    const response = await this.api.get(`/users/${userId}/compare`, {
      params: { category, period },
    });

    return response.data;
  }

  // Recommendations
  async getRecommendations(
    userId: string,
    category?: string,
    limit: number = 10,
  ): Promise<
    {
      id: string;
      title: string;
      description: string;
      category: string;
      impact: number; // kg CO2 potential savings
      difficulty: 'easy' | 'medium' | 'hard';
      cost: 'free' | 'low' | 'medium' | 'high';
      timeframe: string;
      actions: string[];
    }[]
  > {
    const params: any = { limit };
    if (category) params.category = category;

    const response = await this.api.get(`/users/${userId}/recommendations`, {
      params,
    });
    return response.data;
  }

  // Utility Methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAuthToken(): string | null {
    // Implement your auth token retrieval logic
    return null;
  }

  private checkRateLimit(endpoint: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(endpoint);

    if (tracker) {
      if (now < tracker.resetTime) {
        if (tracker.count >= 100) {
          // Assuming 100 requests per minute
          throw new Error(`Rate limit exceeded for ${endpoint}`);
        }
        tracker.count++;
      } else {
        // Reset the counter
        tracker.count = 1;
        tracker.resetTime = now + 60000; // 1 minute
      }
    } else {
      this.rateLimitTracker.set(endpoint, {
        count: 1,
        resetTime: now + 60000,
      });
    }
  }

  private updateRateLimit(response: AxiosResponse): void {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining && reset) {
      const endpoint = response.config.url ?? '';
      this.rateLimitTracker.set(endpoint, {
        count: 100 - parseInt(remaining),
        resetTime: parseInt(reset) * 1000,
      });
    }
  }

  private handleAPIError(error: any): Promise<never> {
    const apiError: APIError = {
      code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
      message: error.response?.data?.message ?? error.message,
      details: error.response?.data?.details,
      timestamp: new Date(),
    };

    // Log error for monitoring
    this.logger.error('Carbon API Error', {
      code: apiError.code,
      message: apiError.message,
      endpoint: error.config?.url,
      method: error.config?.method,
      details: apiError.details,
    });

    return Promise.reject(apiError);
  }

  // Cache Management
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Health Check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    features: Record<string, boolean>;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.api.get('/health');
      const latency = Date.now() - startTime;

      return {
        status: response.data.status,
        latency,
        features: response.data.features,
      };
    } catch (_error) {
      const latency = Date.now() - startTime;

      return {
        status: 'unhealthy',
        latency,
        features: {},
      };
    }
  }
}

// Create and export singleton instance
export const carbonAPIService = new CarbonAPIService();
export default carbonAPIService;
