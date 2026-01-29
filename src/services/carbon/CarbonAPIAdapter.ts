/**
 * @fileoverview Carbon API Adapter Service
 *
 * Focused service responsible for external API integrations
 * with multiple carbon calculation providers and fallback logic.
 *
 * Follows SRP - single responsibility for API communication.
 *
 * @version 2.0.0
 */

import { CARBON_API_BASE_URL, CARBON_API_KEY } from '@env';
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

import { API_CONFIG, API_ENDPOINTS, LOG_PREFIXES } from '../../utils/constants';
import {
  createLogger,
  PerformanceLogger,
  logAPIRequest,
  logAPIResponse,
  logAPIError,
} from '../../utils/loggingUtils';

import type {
  CarbonCalculationRequest,
  CarbonCalculationResponse,
  CarbonEmissionFactor,
} from './CarbonCalculatorCore';

// ===================================================================
// TYPES
// ===================================================================

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  provider: string;
}

export interface APIProvider {
  name: string;
  baseURL: string;
  priority: number;
  timeout: number;
  rateLimit: number;
}

// ===================================================================
// CARBON API ADAPTER
// ===================================================================

/**
 * External API adapter for carbon calculation services
 * Handles multiple providers with fallback and retry logic
 */
export class CarbonAPIAdapter {
  private logger = createLogger({ prefix: 'CARBON_API' });
  private performanceLogger = new PerformanceLogger('CARBON_API');
  private apis: Map<string, AxiosInstance> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> =
    new Map();

  // API provider configuration
  private providers: APIProvider[] = [
    {
      name: 'carboninterface',
      baseURL: API_ENDPOINTS.CARBON_INTERFACE,
      priority: 1,
      timeout: 15000,
      rateLimit: 100,
    },
    {
      name: 'climatiq',
      baseURL: API_ENDPOINTS.CLIMATIQ,
      priority: 2,
      timeout: 15000,
      rateLimit: 1000,
    },
    {
      name: 'carbonfootprint',
      baseURL: API_ENDPOINTS.CARBON_FOOTPRINT,
      priority: 3,
      timeout: 15000,
      rateLimit: 60,
    },
  ];

  constructor() {
    this.logger.info('Initializing Carbon API Adapter', {
      providersCount: this.providers.length,
      primaryProvider: this.providers[0]?.name,
    });

    this.initializeAPIs();
  }

  /**
   * Calculate emissions using external APIs with fallback
   */
  async calculateEmissions(
    request: CarbonCalculationRequest,
  ): Promise<CarbonCalculationResponse | null> {
    const requestId = this.generateRequestId();

    this.logger.info('Starting external API calculation', {
      requestId,
      activityType: request.activityType,
      amount: request.amount,
    });

    // Try each provider in order of priority
    const sortedProviders = [...this.providers].sort(
      (a, b) => a.priority - b.priority,
    );

    for (const provider of sortedProviders) {
      try {
        this.logger.debug(`Attempting API call with ${provider.name}`, {
          requestId,
        });

        const result = await this.performanceLogger.measureAsync(
          `api_call_${provider.name}`,
          () => this.calculateWithProvider(provider.name, request, requestId),
        );

        if (result) {
          this.logger.success(
            `API calculation successful with ${provider.name}`,
            {
              requestId,
              activityType: request.activityType,
              emissions: result.emissions,
              provider: provider.name,
            },
          );
          return result;
        }
      } catch (error) {
        this.logger.error(
          `API call failed with ${provider.name}`,
          {
            requestId,
            provider: provider.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          error as Error,
        );

        // Continue to next provider
        continue;
      }
    }

    this.logger.warn('All API providers failed', { requestId });
    return null;
  }

  /**
   * Get emission factors from external API
   */
  async getEmissionFactors(
    category?: string,
    region?: string,
  ): Promise<CarbonEmissionFactor[]> {
    const requestId = this.generateRequestId();

    for (const provider of this.providers) {
      try {
        const api = this.apis.get(provider.name);
        if (!api) continue;

        const params: any = {};
        if (category) params.category = category;
        if (region) params.region = region;

        logAPIRequest(this.logger, 'GET', '/emission-factors', requestId, {
          provider: provider.name,
        });

        const startTime = performance.now();
        const response = await api.get('/emission-factors', { params });
        const duration = performance.now() - startTime;

        logAPIResponse(
          this.logger,
          'GET',
          '/emission-factors',
          response.status,
          duration,
          requestId,
        );

        const factors = response.data.map((factor: any) => ({
          ...factor,
          lastUpdated: new Date(factor.lastUpdated),
        }));

        return factors;
      } catch (error) {
        logAPIError(
          this.logger,
          'GET',
          '/emission-factors',
          error as Error,
          requestId,
        );
        continue;
      }
    }

    throw new Error('Failed to fetch emission factors from all providers');
  }

  /**
   * Health check for all API providers
   */
  async healthCheck(): Promise<
    Record<
      string,
      {
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency: number;
        error?: string;
      }
    >
  > {
    const results: Record<string, any> = {};

    await Promise.all(
      this.providers.map(async provider => {
        const startTime = performance.now();

        try {
          const api = this.apis.get(provider.name);
          if (!api) {
            results[provider.name] = {
              status: 'unhealthy',
              latency: 0,
              error: 'API instance not found',
            };
            return;
          }

          await api.get('/health');
          const latency = performance.now() - startTime;

          results[provider.name] = {
            status: latency < 1000 ? 'healthy' : 'degraded',
            latency,
          };
        } catch (error) {
          const latency = performance.now() - startTime;
          results[provider.name] = {
            status: 'unhealthy',
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );

    return results;
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  /**
   * Initialize API clients for all providers
   */
  private initializeAPIs(): void {
    for (const provider of this.providers) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Kindred-App/2.0',
      };

      // Add provider-specific authentication
      switch (provider.name) {
        case 'carboninterface':
          headers['Authorization'] = `Bearer ${CARBON_API_KEY}`;
          break;
        case 'climatiq':
          headers['Authorization'] = `Bearer ${process.env.CLIMATIQ_API_KEY}`;
          break;
        case 'carbonfootprint':
          headers['X-API-Key'] = process.env.CARBON_FOOTPRINT_API_KEY || '';
          break;
      }

      const api = axios.create({
        baseURL: provider.baseURL,
        timeout: provider.timeout,
        headers,
      });

      // Add request/response interceptors
      this.setupInterceptors(api, provider.name);

      this.apis.set(provider.name, api);

      this.logger.debug(`Initialized API client for ${provider.name}`, {
        baseURL: provider.baseURL,
        timeout: provider.timeout,
      });
    }
  }

  /**
   * Calculate emissions using specific provider
   */
  private async calculateWithProvider(
    providerName: string,
    request: CarbonCalculationRequest,
    requestId: string,
  ): Promise<CarbonCalculationResponse | null> {
    const api = this.apis.get(providerName);
    if (!api) return null;

    // Check rate limits
    this.checkRateLimit(providerName);

    switch (providerName) {
      case 'carboninterface':
        return this.calculateWithCarbonInterface(api, request, requestId);
      case 'climatiq':
        return this.calculateWithClimatiq(api, request, requestId);
      case 'carbonfootprint':
        return this.calculateWithCarbonFootprint(api, request, requestId);
      default:
        return null;
    }
  }

  /**
   * Carbon Interface API implementation
   */
  private async calculateWithCarbonInterface(
    api: AxiosInstance,
    request: CarbonCalculationRequest,
    requestId: string,
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit, additionalParams = {} } = request;

    const endpoint = '/estimates';
    let data: any = {};

    switch (activityType) {
      case 'transport':
        data = {
          type: 'vehicle',
          distance_unit: unit === 'km' ? 'km' : 'mi',
          distance_value: amount,
          vehicle_model_id: additionalParams.vehicleType || 'default',
        };
        break;

      case 'energy':
        data = {
          type: 'electricity',
          electricity_unit: unit === 'kWh' ? 'kwh' : 'mwh',
          electricity_value: amount,
          country: additionalParams.country || 'us',
          state: additionalParams.state || 'ca',
        };
        break;

      case 'food':
        // CarbonInterface doesn't support food calculations
        throw new Error('Food calculations not supported by CarbonInterface');

      default:
        throw new Error(`Unsupported activity type: ${activityType}`);
    }

    logAPIRequest(this.logger, 'POST', endpoint, requestId, {
      provider: 'carboninterface',
    });

    const startTime = performance.now();
    const response = await api.post(endpoint, data);
    const duration = performance.now() - startTime;

    logAPIResponse(
      this.logger,
      'POST',
      endpoint,
      response.status,
      duration,
      requestId,
    );

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
      recommendations: [],
    };
  }

  /**
   * Climatiq API implementation
   */
  private async calculateWithClimatiq(
    api: AxiosInstance,
    request: CarbonCalculationRequest,
    requestId: string,
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount, unit } = request;

    // Map to Climatiq emission factor IDs
    const emissionFactorMap: Record<string, string> = {
      'transport-car':
        'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
      'energy-electricity': 'electricity-energy_source_grid_mix',
      'food-beef': 'consumer_goods-type_food_products-food_type_beef',
    };

    const factorKey = `${activityType}-${
      request.additionalParams?.subtype || 'default'
    }`;
    const factorId = emissionFactorMap[factorKey];

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

    logAPIRequest(this.logger, 'POST', '/estimate', requestId, {
      provider: 'climatiq',
    });

    const startTime = performance.now();
    const response = await api.post('/estimate', data);
    const duration = performance.now() - startTime;

    logAPIResponse(
      this.logger,
      'POST',
      '/estimate',
      response.status,
      duration,
      requestId,
    );

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
      recommendations: [],
    };
  }

  /**
   * CarbonFootprint.com API implementation
   */
  private async calculateWithCarbonFootprint(
    api: AxiosInstance,
    request: CarbonCalculationRequest,
    requestId: string,
  ): Promise<CarbonCalculationResponse> {
    const { activityType, amount } = request;

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

    logAPIRequest(this.logger, 'GET', endpoint, requestId, {
      provider: 'carbonfootprint',
    });

    const startTime = performance.now();
    const response = await api.get(endpoint, { params });
    const duration = performance.now() - startTime;

    logAPIResponse(
      this.logger,
      'GET',
      endpoint,
      response.status,
      duration,
      requestId,
    );

    const result = response.data;

    return {
      emissions: result.carbonEquivalent,
      factor: {
        id: `carbonfootprint-${activityType}`,
        category: activityType,
        subcategory: activityType,
        factor: result.carbonEquivalent / amount,
        unit: `kg CO2/${request.unit}`,
        source: 'CarbonFootprint.com',
        lastUpdated: new Date(),
      },
      confidence: 0.85,
      breakdown: {
        direct: result.carbonEquivalent * 0.75,
        indirect: result.carbonEquivalent * 0.25,
      },
      recommendations: [],
    };
  }

  /**
   * Setup request/response interceptors for API client
   */
  private setupInterceptors(api: AxiosInstance, providerName: string): void {
    // Request interceptor
    api.interceptors.request.use(
      config => {
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now(),
          provider: providerName,
        };
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor
    api.interceptors.response.use(
      response => {
        const duration = Date.now() - response.config.metadata.startTime;
        this.updateRateLimit(providerName, response);
        return response;
      },
      error => {
        const apiError: APIError = {
          code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
          message: error.response?.data?.message ?? error.message,
          details: error.response?.data?.details,
          timestamp: new Date(),
          provider: providerName,
        };

        return Promise.reject(apiError);
      },
    );
  }

  /**
   * Check rate limits for provider
   */
  private checkRateLimit(providerName: string): void {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) return;

    const now = Date.now();
    const tracker = this.rateLimitTracker.get(providerName);

    if (tracker) {
      if (now < tracker.resetTime) {
        if (tracker.count >= provider.rateLimit) {
          throw new Error(`Rate limit exceeded for ${providerName}`);
        }
        tracker.count++;
      } else {
        // Reset the counter
        tracker.count = 1;
        tracker.resetTime = now + 60000; // 1 minute
      }
    } else {
      this.rateLimitTracker.set(providerName, {
        count: 1,
        resetTime: now + 60000,
      });
    }
  }

  /**
   * Update rate limit tracking from API response headers
   */
  private updateRateLimit(providerName: string, response: AxiosResponse): void {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    const provider = this.providers.find(p => p.name === providerName);

    if (remaining && reset && provider) {
      this.rateLimitTracker.set(providerName, {
        count: provider.rateLimit - parseInt(remaining),
        resetTime: parseInt(reset) * 1000,
      });
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export const carbonAPIAdapter = new CarbonAPIAdapter();
export default carbonAPIAdapter;
