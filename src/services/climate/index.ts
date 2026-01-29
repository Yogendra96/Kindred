/**
 * Climate Services Index
 * Central export point for all climate data services
 *
 * Available Services:
 * - ClimateTraceService: 745M+ global emission sources from Climate TRACE
 * - GlobalContextService: Country comparisons and global averages (OWID-based)
 * - GridCarbonService: Real-time grid carbon intensity (WattTime/ElectricityMaps)
 * - AirQualityService: Real-time air quality data (OpenAQ/IQAir)
 */

// =============================================================================
// Service Exports
// =============================================================================

export {
  climateTraceService,
  default as ClimateTraceService,
} from './ClimateTraceService';

export type {
  Sector,
  Subsector,
  GasType,
  EmissionSource,
  AssetSearchParams,
  EmissionsSummary,
  CountryEmissions,
  NearbyEmitter,
} from './ClimateTraceService';

export {
  globalContextService,
  default as GlobalContextService,
} from './GlobalContextService';

export type {
  CountryData,
  GlobalAverages,
  UserGlobalContext,
  HistoricalComparison,
} from './GlobalContextService';

export {
  gridCarbonService,
  default as GridCarbonService,
} from './GridCarbonService';

export type {
  GridCarbonIntensity,
  GridForecast,
  GridForecastPoint,
  OptimalWindow,
  GridHistory,
  GridHistoryPoint,
  PowerBreakdown,
  GridZone,
} from './GridCarbonService';

export {
  airQualityService,
  default as AirQualityService,
} from './AirQualityService';

export type {
  AirQualityData,
  AirQualityMeasurement,
  PollutantType,
  AQICategory,
  AQIRecommendation,
  NearbyStation,
  AirQualityForecast,
  AQIForecastPoint,
} from './AirQualityService';

// =============================================================================
// Unified Climate Data Interface
// =============================================================================

import { climateTraceService } from './ClimateTraceService';
import { globalContextService } from './GlobalContextService';
import { gridCarbonService } from './GridCarbonService';
import { airQualityService } from './AirQualityService';
import type { UserGlobalContext } from './GlobalContextService';
import type { GridCarbonIntensity } from './GridCarbonService';
import type { AirQualityData } from './AirQualityService';
import type { NearbyEmitter } from './ClimateTraceService';

/**
 * Combined climate context for a user's location
 */
export interface LocationClimateContext {
  // User's global context
  globalContext: UserGlobalContext;

  // Grid carbon intensity
  gridCarbon: GridCarbonIntensity;

  // Air quality
  airQuality: AirQualityData;

  // Nearby emission sources
  nearbyEmitters: NearbyEmitter[];

  // Metadata
  location: {
    lat: number;
    lng: number;
    countryCode: string;
  };
  timestamp: string;
}

/**
 * Unified Climate Data Service
 * Aggregates data from all climate services for comprehensive context
 */
class UnifiedClimateService {
  private static instance: UnifiedClimateService;

  private constructor() {}

  public static getInstance(): UnifiedClimateService {
    if (!UnifiedClimateService.instance) {
      UnifiedClimateService.instance = new UnifiedClimateService();
    }
    return UnifiedClimateService.instance;
  }

  /**
   * Get comprehensive climate context for a location
   * Fetches data from all services in parallel
   */
  async getLocationContext(
    lat: number,
    lng: number,
    countryCode: string,
    userFootprint: number,
  ): Promise<LocationClimateContext> {
    // Fetch all data in parallel
    const [globalContext, gridZone, airQuality, nearbyEmitters] =
      await Promise.all([
        globalContextService.getUserGlobalContext(userFootprint, countryCode),
        gridCarbonService.findZoneByLocation(lat, lng),
        airQualityService.getCurrentAirQuality(lat, lng),
        climateTraceService
          .getNearbyEmitters(lat, lng, 25, countryCode)
          .catch(() => []),
      ]);

    // Get grid carbon for the zone
    const zone = gridZone || countryCode;
    const gridCarbon = await gridCarbonService.getCurrentIntensity(zone);

    return {
      globalContext,
      gridCarbon,
      airQuality,
      nearbyEmitters,
      location: { lat, lng, countryCode },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get quick summary for notifications/widgets
   */
  async getQuickSummary(
    lat: number,
    lng: number,
    countryCode: string,
  ): Promise<{
    gridStatus: 'clean' | 'average' | 'dirty';
    airStatus: 'good' | 'moderate' | 'unhealthy';
    nearbyEmitterCount: number;
    recommendation: string;
  }> {
    const [gridZone, airQuality, nearbyEmitters] = await Promise.all([
      gridCarbonService.findZoneByLocation(lat, lng),
      airQualityService.getCurrentAirQuality(lat, lng),
      climateTraceService
        .getNearbyEmitters(lat, lng, 10, countryCode)
        .catch(() => []),
    ]);

    const zone = gridZone || countryCode;
    const grid = await gridCarbonService.getCurrentIntensity(zone);

    // Determine statuses
    const gridStatus: 'clean' | 'average' | 'dirty' =
      grid.carbonIntensity < 200
        ? 'clean'
        : grid.carbonIntensity < 400
        ? 'average'
        : 'dirty';

    const aqCategory = airQuality.aqi.category;
    const airStatus: 'good' | 'moderate' | 'unhealthy' =
      aqCategory === 'good'
        ? 'good'
        : ['moderate', 'unhealthy-sensitive'].includes(aqCategory)
        ? 'moderate'
        : 'unhealthy';

    // Generate recommendation
    let recommendation: string;
    if (gridStatus === 'clean' && airStatus === 'good') {
      recommendation = '🌿 Great day for outdoor activities and EV charging!';
    } else if (gridStatus === 'dirty' && airStatus !== 'unhealthy') {
      recommendation = '⚡ Grid is carbon-heavy - delay charging if possible';
    } else if (airStatus === 'unhealthy') {
      recommendation = '😷 Poor air quality - limit outdoor exposure';
    } else {
      recommendation = '📊 Moderate conditions - check before major activities';
    }

    return {
      gridStatus,
      airStatus,
      nearbyEmitterCount: nearbyEmitters.length,
      recommendation,
    };
  }

  /**
   * Get optimal action windows for the day
   */
  async getOptimalWindows(
    lat: number,
    lng: number,
  ): Promise<{
    charging: { start: string; end: string; savings: number } | null;
    outdoor: { start: string; end: string } | null;
  }> {
    const zone = await gridCarbonService.findZoneByLocation(lat, lng);
    if (!zone) {
      return { charging: null, outdoor: null };
    }

    const optimalWindow = await gridCarbonService.getOptimalWindow(zone, 2, 24);

    return {
      charging: {
        start: optimalWindow.start,
        end: optimalWindow.end,
        savings: optimalWindow.savings.vsAverage,
      },
      outdoor: null, // Would need forecast integration
    };
  }

  /**
   * Track user's climate-aware actions for achievements
   */
  async trackClimateAwareAction(
    userId: string,
    action: 'grid_check' | 'air_check' | 'emitter_explore' | 'optimal_charge',
  ): Promise<void> {
    switch (action) {
      case 'air_check':
        await airQualityService.trackAirQualityCheck(userId);
        break;
      case 'optimal_charge':
        await gridCarbonService.trackOptimalUsage(userId, 'unknown');
        break;
      case 'emitter_explore':
        // Would need source ID, handled by ClimateTraceService directly
        break;
    }
  }
}

// Export unified service
export const unifiedClimateService = UnifiedClimateService.getInstance();
export default UnifiedClimateService;
