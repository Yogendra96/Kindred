/**
 * @fileoverview Carbon Service - Main Orchestrator
 * 
 * Main service that orchestrates carbon calculations using focused
 * sub-services following the composition pattern and SRP principles.
 * 
 * Replaces the monolithic CarbonAPIService with a clean, modular architecture.
 * 
 * @version 2.0.0
 */

import { ENABLE_API_MOCKING, CARBON_API_KEY } from '@env';

import { createLogger, PerformanceLogger } from '../../utils/loggingUtils';
import { API_CONFIG } from '../../utils/constants';

import { CarbonCalculatorCore } from './CarbonCalculatorCore';
import { CarbonAPIAdapter } from './CarbonAPIAdapter';
import { CarbonCacheManager } from './CarbonCacheManager';

import type {
  CarbonCalculationRequest,
  CarbonCalculationResponse,
  CarbonEmissionCalculation,
  CarbonEmissionFactor,
} from './CarbonCalculatorCore';

// ===================================================================
// TYPES
// ===================================================================

export interface CarbonServiceConfig {
  enableAPIFallback: boolean;
  enableCaching: boolean;
  enableMocking: boolean;
  cacheConfig?: {
    maxSize?: number;
    defaultTTL?: number;
  };
}

export interface ServiceHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    calculator: 'healthy' | 'unhealthy';
    apiAdapter: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
  metrics: {
    cacheHitRate: number;
    averageResponseTime: number;
    totalCalculations: number;
    apiCallsSaved: number;
  };
}

// ===================================================================
// CARBON SERVICE - MAIN ORCHESTRATOR
// ===================================================================

/**
 * Main Carbon Service that orchestrates calculations using focused sub-services
 * 
 * Architecture:
 * - CarbonCalculatorCore: Offline calculations
 * - CarbonAPIAdapter: External API calls
 * - CarbonCacheManager: Caching and performance
 * 
 * This service follows the orchestrator pattern and handles:
 * - API vs offline calculation decisions
 * - Cache management
 * - Error handling and fallbacks
 * - Performance monitoring
 */
export class CarbonService {
  private logger = createLogger({ prefix: 'CARBON_API' });
  private performanceLogger = new PerformanceLogger('CARBON_API');
  
  // Focused sub-services
  private calculator: CarbonCalculatorCore;
  private apiAdapter: CarbonAPIAdapter;
  private cacheManager: CarbonCacheManager;
  
  private config: CarbonServiceConfig;
  private metrics = {
    totalCalculations: 0,
    apiCalls: 0,
    cacheHits: 0,
    offlineCalculations: 0,
  };

  constructor(config: Partial<CarbonServiceConfig> = {}) {
    this.config = {
      enableAPIFallback: config.enableAPIFallback ?? true,
      enableCaching: config.enableCaching ?? true,
      enableMocking: config.enableMocking ?? ENABLE_API_MOCKING === 'true',
      cacheConfig: config.cacheConfig ?? {
        maxSize: 50 * 1024 * 1024, // 50MB
        defaultTTL: API_CONFIG.CACHE_TTL_MEDIUM,
      },
    };

    this.logger.info('Initializing Carbon Service', {
      enableAPIFallback: this.config.enableAPIFallback,
      enableCaching: this.config.enableCaching,
      enableMocking: this.config.enableMocking,
      hasAPIKey: !!CARBON_API_KEY,
    });

    // Initialize focused sub-services
    this.calculator = new CarbonCalculatorCore();
    this.apiAdapter = new CarbonAPIAdapter();
    this.cacheManager = new CarbonCacheManager(this.config.cacheConfig);

    this.logger.success('Carbon Service initialized successfully');
  }

  // ===================================================================
  // PUBLIC API
  // ===================================================================

  /**
   * Calculate carbon emissions with intelligent fallback strategy
   */
  async calculateEmissions(request: CarbonCalculationRequest): Promise<CarbonCalculationResponse> {
    this.metrics.totalCalculations++;
    
    return this.performanceLogger.measureAsync(
      'calculate_emissions',
      async () => {
        this.logger.info('Carbon calculation requested', {
          activityType: request.activityType,
          amount: request.amount,
          unit: request.unit,
          calculationId: this.metrics.totalCalculations,
        });

        // Step 1: Check cache first (if enabled)
        if (this.config.enableCaching) {
          const cached = this.cacheManager.getCachedCalculation(request);
          if (cached) {
            this.metrics.cacheHits++;
            this.logger.success('Returning cached result', {
              activityType: request.activityType,
              emissions: cached.emissions,
              source: 'cache',
            });
            return cached;
          }
        }

        let result: CarbonCalculationResponse;

        // Step 2: Try API calculation (if not mocking and API is available)
        if (!this.config.enableMocking && this.config.enableAPIFallback) {
          try {
            const apiResult = await this.apiAdapter.calculateEmissions(request);
            if (apiResult) {
              this.metrics.apiCalls++;
              result = apiResult;
              
              this.logger.success('API calculation successful', {
                activityType: request.activityType,
                emissions: result.emissions,
                source: 'api',
              });

              // Cache the API result
              if (this.config.enableCaching) {
                this.cacheManager.cacheCalculation(request, result);
              }

              return result;
            }
          } catch (error) {
            this.logger.warn('API calculation failed, falling back to offline', {
              activityType: request.activityType,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Step 3: Fallback to offline calculation
        this.metrics.offlineCalculations++;
        result = await this.calculator.calculate(request);
        
        this.logger.success('Offline calculation successful', {
          activityType: request.activityType,
          emissions: result.emissions,
          source: 'offline',
        });

        // Cache the offline result (with shorter TTL)
        if (this.config.enableCaching) {
          this.cacheManager.cacheCalculation(request, result, API_CONFIG.CACHE_TTL_SHORT);
        }

        return result;
      },
      { activityType: request.activityType }
    );
  }

  /**
   * Batch calculate multiple emissions
   */
  async batchCalculateEmissions(requests: CarbonCalculationRequest[]): Promise<CarbonCalculationResponse[]> {
    this.logger.info('Batch calculation requested', {
      batchSize: requests.length,
    });

    return this.performanceLogger.measureAsync(
      'batch_calculate_emissions',
      async () => {
        // Process requests in parallel
        const results = await Promise.all(
          requests.map(request => this.calculateEmissions(request))
        );

        this.logger.success('Batch calculation completed', {
          batchSize: requests.length,
          totalEmissions: results.reduce((sum, r) => sum + r.emissions, 0),
        });

        return results;
      },
      { batchSize: requests.length }
    );
  }

  /**
   * Get emission factors with caching
   */
  async getEmissionFactors(
    category?: string,
    region?: string
  ): Promise<CarbonEmissionFactor[]> {
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cacheManager.getCachedEmissionFactors(category, region);
      if (cached) {
        return cached;
      }
    }

    try {
      // Try API first
      if (this.config.enableAPIFallback && !this.config.enableMocking) {
        const factors = await this.apiAdapter.getEmissionFactors(category, region);
        
        // Cache the results
        if (this.config.enableCaching) {
          this.cacheManager.cacheEmissionFactors(factors, category, region);
        }
        
        return factors;
      }
    } catch (error) {
      this.logger.warn('Failed to fetch emission factors from API', {
        category,
        region,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Fallback to built-in factors (would need to implement this)
    return [];
  }

  /**
   * Convert calculation response to form-friendly format
   */
  convertToFormCalculation(response: CarbonCalculationResponse): CarbonEmissionCalculation {
    return CarbonCalculatorCore.convertToFormCalculation(response);
  }

  /**
   * Get service health status
   */
  async getHealthCheck(): Promise<ServiceHealthCheck> {
    const cacheMetrics = this.cacheManager.getMetrics();
    
    // Check API adapter health
    const apiHealth = await this.apiAdapter.healthCheck();
    const apiStatuses = Object.values(apiHealth).map(h => h.status);
    const apiOverallStatus = apiStatuses.includes('healthy') 
      ? 'healthy' 
      : apiStatuses.includes('degraded') 
        ? 'degraded' 
        : 'unhealthy';

    // Calculate metrics
    const totalRequests = this.metrics.totalCalculations;
    const apiCallsSaved = this.metrics.cacheHits;
    const averageResponseTime = 50; // Would need to track this properly

    const services = {
      calculator: 'healthy' as const,
      apiAdapter: apiOverallStatus,
      cache: 'healthy' as const,
    };

    const overallStatus = Object.values(services).includes('unhealthy')
      ? 'unhealthy'
      : Object.values(services).includes('degraded')
        ? 'degraded'
        : 'healthy';

    return {
      status: overallStatus,
      services,
      metrics: {
        cacheHitRate: cacheMetrics.hitRate,
        averageResponseTime,
        totalCalculations: totalRequests,
        apiCallsSaved,
      },
    };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    calculations: typeof this.metrics;
    cache: ReturnType<CarbonCacheManager['getStats']>;
  } {
    return {
      calculations: { ...this.metrics },
      cache: this.cacheManager.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.logger.info('All caches cleared');
  }

  /**
   * Reset service metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalculations: 0,
      apiCalls: 0,
      cacheHits: 0,
      offlineCalculations: 0,
    };
    this.logger.info('Service metrics reset');
  }

  /**
   * Cleanup service resources
   */
  destroy(): void {
    this.cacheManager.destroy();
    this.logger.info('Carbon Service destroyed');
  }
}

// ===================================================================
// SINGLETON EXPORT (for backward compatibility)
// ===================================================================

export const carbonService = new CarbonService();

// Export legacy interface for backward compatibility
export const carbonAPIService = {
  // Main calculation method
  calculateEmissions: (request: CarbonCalculationRequest) => 
    carbonService.calculateEmissions(request),
    
  // Batch calculation
  batchCalculateEmissions: (requests: CarbonCalculationRequest[]) =>
    carbonService.batchCalculateEmissions(requests),
    
  // Form calculation conversion
  convertToFormCalculation: (response: CarbonCalculationResponse) =>
    carbonService.convertToFormCalculation(response),
    
  // Emission factors
  getEmissionFactors: (category?: string, region?: string) =>
    carbonService.getEmissionFactors(category, region),
    
  // Health and stats
  healthCheck: () => carbonService.getHealthCheck(),
  clearCache: () => carbonService.clearCache(),
  
  // Static method for form conversion
  static: {
    convertToFormCalculation: CarbonCalculatorCore.convertToFormCalculation,
  },
};

// ===================================================================
// EXPORTS
// ===================================================================

export default carbonService;

// Export types for consumers
export type {
  CarbonCalculationRequest,
  CarbonCalculationResponse,
  CarbonEmissionCalculation,
  CarbonEmissionFactor,
  ServiceHealthCheck,
};