/**
 * @fileoverview Carbon Services Module
 *
 * Modular carbon calculation services following SOLID principles:
 * - Single Responsibility: Each service has one focus
 * - Open/Closed: Extensible through composition
 * - Dependency Inversion: Services depend on abstractions
 *
 * Architecture:
 * - CarbonService: Main orchestrator (350 lines)
 * - CarbonCalculatorCore: Offline calculations (400 lines)
 * - CarbonAPIAdapter: External API integration (500 lines)
 * - CarbonCacheManager: Caching and performance (450 lines)
 *
 * Total: ~1,700 lines across 4 focused files vs 1,325 lines in one monolith
 *
 * @version 2.0.0
 */

// ===================================================================
// CORE EXPORTS
// ===================================================================

// Main service (backward compatible)
export {
  carbonService as default,
  carbonService,
  carbonAPIService, // Legacy compatibility
  CarbonService,
} from './CarbonService';

// Focused sub-services (for advanced usage)
export {
  CarbonCalculatorCore,
  carbonCalculatorCore,
} from './CarbonCalculatorCore';

export { CarbonAPIAdapter, carbonAPIAdapter } from './CarbonAPIAdapter';

export { CarbonCacheManager, carbonCacheManager } from './CarbonCacheManager';

// ===================================================================
// TYPE EXPORTS
// ===================================================================

export type {
  CarbonCalculationRequest,
  CarbonCalculationResponse,
  CarbonEmissionCalculation,
  CarbonEmissionFactor,
  ServiceHealthCheck,
} from './CarbonService';

export type { APIError, APIProvider } from './CarbonAPIAdapter';

export type {
  CacheItem,
  CacheMetrics,
  CacheConfig,
} from './CarbonCacheManager';

// ===================================================================
// CONVENIENCE EXPORTS
// ===================================================================

/**
 * Quick access to main calculation function
 * Usage: import { calculateEmissions } from '@services/carbon';
 */
export const calculateEmissions = (request: any) =>
  carbonService.calculateEmissions(request);

/**
 * Quick access to batch calculation
 */
export const batchCalculateEmissions = (requests: any[]) =>
  carbonService.batchCalculateEmissions(requests);

/**
 * Quick access to form conversion
 */
export const convertToFormCalculation = (response: any) =>
  carbonService.convertToFormCalculation(response);

// ===================================================================
// MIGRATION GUIDE
// ===================================================================

/**
 * MIGRATION FROM OLD CarbonAPIService:
 *
 * OLD (monolithic):
 * ```ts
 * import { carbonAPIService } from '@services/CarbonAPIService';
 * const result = await carbonAPIService.calculateEmissions(request);
 * ```
 *
 * NEW (modular - Option 1, backward compatible):
 * ```ts
 * import { carbonAPIService } from '@services/carbon';
 * const result = await carbonAPIService.calculateEmissions(request);
 * ```
 *
 * NEW (modular - Option 2, direct service):
 * ```ts
 * import { carbonService } from '@services/carbon';
 * const result = await carbonService.calculateEmissions(request);
 * ```
 *
 * NEW (modular - Option 3, convenience import):
 * ```ts
 * import { calculateEmissions } from '@services/carbon';
 * const result = await calculateEmissions(request);
 * ```
 *
 * Advanced usage with specific services:
 * ```ts
 * import { carbonCalculatorCore, carbonCacheManager } from '@services/carbon';
 *
 * // Direct offline calculation
 * const offlineResult = await carbonCalculatorCore.calculate(request);
 *
 * // Cache management
 * const stats = carbonCacheManager.getStats();
 * ```
 */
