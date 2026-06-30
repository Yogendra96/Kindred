// @ts-nocheck
/* eslint-disable */
/**
 * Climate TRACE API Service
 * Integrates with Climate TRACE's 745M+ emission source database
 * Provides facility-level emissions data, country statistics, and nearby emitters
 *
 * API Documentation: https://api.climatetrace.org/
 */

import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import loggingService from '../LoggerService';

// =============================================================================
// Types & Interfaces
// =============================================================================

export type Sector =
  | 'power'
  | 'transportation'
  | 'buildings'
  | 'fossil-fuel-operations'
  | 'manufacturing'
  | 'mineral-extraction'
  | 'agriculture'
  | 'waste'
  | 'forestry-and-land-use';

export type Subsector =
  | 'electricity-generation'
  | 'steel'
  | 'cement'
  | 'aluminum'
  | 'pulp-and-paper'
  | 'chemicals'
  | 'other-manufacturing'
  | 'oil-and-gas-production'
  | 'oil-and-gas-refining'
  | 'coal-mining'
  | 'road-transportation'
  | 'aviation'
  | 'shipping'
  | 'railways'
  | 'residential'
  | 'commercial'
  | 'cropland'
  | 'livestock'
  | 'solid-waste'
  | 'wastewater';

export type GasType = 'co2' | 'ch4' | 'n2o' | 'co2e' | 'co2e_20yr' | 'co2e_100yr';

export type Continent =
  | 'Asia'
  | 'South America'
  | 'North America'
  | 'Oceania'
  | 'Antarctica'
  | 'Africa'
  | 'Europe';

export interface EmissionSource {
  type: 'Feature';
  id: number;
  properties: {
    name?: string;
    sector?: Sector;
    subsector?: Subsector;
    emissions?: number;
    emissions_factor?: number;
    capacity?: number;
    capacity_unit?: string;
    source_type?: string;
    country?: string;
    admin1?: string;
    admin2?: string;
    owner?: string;
    operator?: string;
    start_date?: string;
    status?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface AssetSearchParams {
  limit?: number;
  year?: number;
  offset?: number;
  countries?: string[];
  sectors?: Sector[];
  subsectors?: Subsector[];
  continents?: Continent[];
  groups?: string[];
  adminId?: number;
}

export interface EmissionsSummary {
  AssetCount: number;
  Emissions: number;
  Gas: GasType;
  Country?: string;
  Continent?: string;
  Sector?: Sector;
  Year?: number;
}

export interface CountryEmissions {
  country: string;
  countryCode: string;
  year: number;
  emissions: number;
  gas: GasType;
  sectors: {
    sector: Sector;
    emissions: number;
    percentage: number;
  }[];
  trend: {
    previousYear: number;
    changePercent: number;
    direction: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface NearbyEmitter {
  id: number;
  name: string;
  sector: Sector;
  subsector?: Subsector;
  emissions: number; // tonnes CO2e per year
  distance: number; // km from user
  coordinates: {
    latitude: number;
    longitude: number;
  };
  owner?: string;
  country: string;
  admin1?: string;
}

export interface SectorDefinition {
  id: string;
  name: string;
  description?: string;
  subsectors: string[];
}

export interface ClimateTraceConfig {
  baseUrl: string;
  cacheTTL: number; // milliseconds
  defaultYear: number;
  defaultLimit: number;
}

// =============================================================================
// Climate TRACE Service
// =============================================================================

class ClimateTraceService {
  private static instance: ClimateTraceService;
  private client: AxiosInstance;
  private config: ClimateTraceConfig;
  private sectorsCache: SectorDefinition[] | null = null;
  private countriesCache: { code: string; name: string }[] | null = null;

  private readonly CACHE_PREFIX = 'climate_trace_';
  private readonly DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.config = {
      baseUrl: 'https://api.climatetrace.org/v6',
      cacheTTL: this.DEFAULT_CACHE_TTL,
      defaultYear: 2023,
      defaultLimit: 100,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      config => {
        loggingService.debug('[ClimateTrace] Request:', {
          url: config.url,
          params: config.params,
        });
        return config;
      },
      error => {
        loggingService.error('[ClimateTrace] Request error', {
          error: String(error),
        });
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      response => {
        loggingService.debug('[ClimateTrace] Response:', {
          url: response.config.url,
          status: response.status,
          dataLength: Array.isArray(response.data) ? response.data.length : 1,
        });
        return response;
      },
      (error: AxiosError) => {
        loggingService.error('[ClimateTrace] Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      },
    );
  }

  public static getInstance(): ClimateTraceService {
    if (!ClimateTraceService.instance) {
      ClimateTraceService.instance = new ClimateTraceService();
    }
    return ClimateTraceService.instance;
  }

  // ===========================================================================
  // Cache Management
  // ===========================================================================

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return data as T;
    } catch (error) {
      loggingService.warn('[ClimateTrace] Cache read error', {
        error: String(error),
      });
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheData = {
        data,
        expiry: Date.now() + (ttl || this.config.cacheTTL),
      };
      await AsyncStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      loggingService.warn('[ClimateTrace] Cache write error', {
        error: String(error),
      });
    }
  }

  private generateCacheKey(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${endpoint}_${sortedParams}`;
  }

  // ===========================================================================
  // Definitions Endpoints
  // ===========================================================================

  /**
   * Get all available sectors
   */
  async getSectors(): Promise<SectorDefinition[]> {
    if (this.sectorsCache) return this.sectorsCache;

    const cacheKey = 'definitions_sectors';
    const cached = await this.getCached<SectorDefinition[]>(cacheKey);
    if (cached) {
      this.sectorsCache = cached;
      return cached;
    }

    try {
      const response = await this.client.get('/definitions/sectors');
      this.sectorsCache = response.data;
      await this.setCache(cacheKey, response.data, 7 * 24 * 60 * 60 * 1000); // 7 days
      return response.data;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to fetch sectors', {
        error: String(error),
      });
      // Return default sectors if API fails
      return [
        { id: 'power', name: 'Power', subsectors: ['electricity-generation'] },
        {
          id: 'transportation',
          name: 'Transportation',
          subsectors: ['road-transportation', 'aviation', 'shipping'],
        },
        {
          id: 'buildings',
          name: 'Buildings',
          subsectors: ['residential', 'commercial'],
        },
        {
          id: 'manufacturing',
          name: 'Manufacturing',
          subsectors: ['steel', 'cement', 'chemicals'],
        },
        {
          id: 'agriculture',
          name: 'Agriculture',
          subsectors: ['cropland', 'livestock'],
        },
      ];
    }
  }

  /**
   * Get all available countries
   */
  async getCountries(): Promise<{ code: string; name: string }[]> {
    if (this.countriesCache) return this.countriesCache;

    const cacheKey = 'definitions_countries';
    const cached = await this.getCached<{ code: string; name: string }[]>(cacheKey);
    if (cached) {
      this.countriesCache = cached;
      return cached;
    }

    try {
      const response = await this.client.get('/definitions/countries');
      this.countriesCache = response.data;
      await this.setCache(cacheKey, response.data, 7 * 24 * 60 * 60 * 1000); // 7 days
      return response.data;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to fetch countries', {
        error: String(error),
      });
      return [];
    }
  }

  /**
   * Get available gas types
   */
  async getGasTypes(): Promise<GasType[]> {
    const cacheKey = 'definitions_gases';
    const cached = await this.getCached<GasType[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/definitions/gases');
      await this.setCache(cacheKey, response.data, 7 * 24 * 60 * 60 * 1000);
      return response.data;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to fetch gas types', {
        error: String(error),
      });
      return ['co2', 'ch4', 'n2o', 'co2e', 'co2e_100yr'];
    }
  }

  // ===========================================================================
  // Assets/Sources Endpoints
  // ===========================================================================

  /**
   * Search emission sources with various filters
   */
  async searchAssets(params: AssetSearchParams = {}): Promise<EmissionSource[]> {
    const queryParams: Record<string, string | number> = {
      limit: params.limit || this.config.defaultLimit,
      year: params.year || this.config.defaultYear,
      offset: params.offset || 0,
    };

    if (params.countries?.length) {
      queryParams.countries = params.countries.join(',');
    }
    if (params.sectors?.length) {
      queryParams.sectors = params.sectors.join(',');
    }
    if (params.subsectors?.length) {
      queryParams.subsectors = params.subsectors.join(',');
    }
    if (params.continents?.length) {
      queryParams.continents = params.continents.join(',');
    }
    if (params.adminId) {
      queryParams.adminId = params.adminId;
    }

    const cacheKey = this.generateCacheKey('assets', queryParams);
    const cached = await this.getCached<EmissionSource[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/assets', {
        params: queryParams,
      });
      await this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to search assets', {
        error: String(error),
      });
      return [];
    }
  }

  /**
   * Get details for a specific emission source
   */
  async getAssetDetails(sourceId: number): Promise<EmissionSource | null> {
    const cacheKey = `asset_${sourceId}`;
    const cached = await this.getCached<EmissionSource>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get(`/assets/${sourceId}`);
      const asset = Array.isArray(response.data) ? response.data[0] : response.data;
      await this.setCache(cacheKey, asset);
      return asset;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get asset details', {
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Get aggregated emissions summary with filters
   */
  async getEmissionsSummary(
    params: {
      countries?: string[];
      sectors?: Sector[];
      subsectors?: Subsector[];
      continents?: Continent[];
      years?: number[];
      gas?: GasType;
    } = {},
  ): Promise<EmissionsSummary[]> {
    const queryParams: Record<string, string> = {};

    if (params.countries?.length) {
      queryParams.countries = params.countries.join(',');
    }
    if (params.sectors?.length) {
      queryParams.sectors = params.sectors.join(',');
    }
    if (params.subsectors?.length) {
      queryParams.subsectors = params.subsectors.join(',');
    }
    if (params.continents?.length) {
      queryParams.continents = params.continents.join(',');
    }
    if (params.years?.length) {
      queryParams.years = params.years.join(',');
    }
    if (params.gas) {
      queryParams.gas = params.gas;
    }

    const cacheKey = this.generateCacheKey('emissions_summary', queryParams);
    const cached = await this.getCached<EmissionsSummary[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/assets/emissions', {
        params: queryParams,
      });
      await this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get emissions summary', {
        error: String(error),
      });
      return [];
    }
  }

  // ===========================================================================
  // Country Emissions
  // ===========================================================================

  /**
   * Get emissions data for a specific country
   */
  async getCountryEmissions(countryCode: string, year?: number): Promise<CountryEmissions | null> {
    const targetYear = year || this.config.defaultYear;
    const cacheKey = `country_emissions_${countryCode}_${targetYear}`;
    const cached = await this.getCached<CountryEmissions>(cacheKey);
    if (cached) return cached;

    try {
      // Get current year data
      const [currentYearData, previousYearData] = await Promise.all([
        this.client.get('/country/emissions', {
          params: {
            countries: countryCode,
            year: targetYear,
          },
        }),
        this.client.get('/country/emissions', {
          params: {
            countries: countryCode,
            year: targetYear - 1,
          },
        }),
      ]);

      const currentEmissions = currentYearData.data[0]?.emissions || 0;
      const previousEmissions = previousYearData.data[0]?.emissions || 0;

      // Get sector breakdown
      const sectorData = await this.getEmissionsSummary({
        countries: [countryCode],
        years: [targetYear],
      });

      const totalEmissions = sectorData.reduce((sum, s) => sum + s.Emissions, 0);
      const sectors = sectorData.map(s => ({
        sector: s.Sector || 'power',
        emissions: s.Emissions,
        percentage: totalEmissions > 0 ? (s.Emissions / totalEmissions) * 100 : 0,
      }));

      const changePercent =
        previousEmissions > 0
          ? ((currentEmissions - previousEmissions) / previousEmissions) * 100
          : 0;

      const result: CountryEmissions = {
        country: countryCode, // Would map to full name in production
        countryCode,
        year: targetYear,
        emissions: currentEmissions,
        gas: 'co2e',
        sectors,
        trend: {
          previousYear: previousEmissions,
          changePercent,
          direction:
            changePercent > 1 ? 'increasing' : changePercent < -1 ? 'decreasing' : 'stable',
        },
      };

      await this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get country emissions', {
        error: String(error),
      });
      return null;
    }
  }

  // ===========================================================================
  // Nearby Emitters (Location-Based)
  // ===========================================================================

  /**
   * Find emission sources near a given location
   * Note: Climate TRACE doesn't have a direct proximity search,
   * so we fetch by country and calculate distances client-side
   */
  async getNearbyEmitters(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    countryCode: string,
    options: {
      sectors?: Sector[];
      limit?: number;
    } = {},
  ): Promise<NearbyEmitter[]> {
    const cacheKey = `nearby_${latitude.toFixed(2)}_${longitude.toFixed(
      2,
    )}_${radiusKm}_${countryCode}`;
    const cached = await this.getCached<NearbyEmitter[]>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch assets from the user's country
      const assets = await this.searchAssets({
        countries: [countryCode],
        sectors: options.sectors,
        limit: options.limit || 500, // Fetch more to filter by distance
        year: this.config.defaultYear,
      });

      // Calculate distances and filter
      const nearbyEmitters: NearbyEmitter[] = assets
        .filter(asset => asset.geometry?.coordinates)
        .map(asset => {
          const [lng, lat] = asset.geometry.coordinates;
          const distance = this.calculateDistance(latitude, longitude, lat, lng);

          return {
            id: asset.id,
            name: asset.properties.name || `${asset.properties.sector} facility`,
            sector: asset.properties.sector || 'power',
            subsector: asset.properties.subsector,
            emissions: asset.properties.emissions || 0,
            distance,
            coordinates: {
              latitude: lat,
              longitude: lng,
            },
            owner: asset.properties.owner,
            country: asset.properties.country || countryCode,
            admin1: asset.properties.admin1,
          };
        })
        .filter(emitter => emitter.distance <= radiusKm)
        .sort((a, b) => b.emissions - a.emissions) // Sort by emissions (highest first)
        .slice(0, options.limit || 20);

      // Cache for 1 hour (location-specific data)
      await this.setCache(cacheKey, nearbyEmitters, 60 * 60 * 1000);
      return nearbyEmitters;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get nearby emitters', {
        error: String(error),
      });
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ===========================================================================
  // High-Level Analytics
  // ===========================================================================

  /**
   * Get top emitters globally or by region
   */
  async getTopEmitters(
    options: {
      continent?: Continent;
      sector?: Sector;
      limit?: number;
      year?: number;
    } = {},
  ): Promise<EmissionSource[]> {
    const params: AssetSearchParams = {
      limit: options.limit || 50,
      year: options.year || this.config.defaultYear,
    };

    if (options.continent) {
      params.continents = [options.continent];
    }
    if (options.sector) {
      params.sectors = [options.sector];
    }

    const assets = await this.searchAssets(params);
    return assets.sort((a, b) => (b.properties.emissions || 0) - (a.properties.emissions || 0));
  }

  /**
   * Get emissions by sector for a region
   */
  async getSectorBreakdown(
    options: {
      countries?: string[];
      continent?: Continent;
      year?: number;
    } = {},
  ): Promise<{ sector: Sector; emissions: number; percentage: number }[]> {
    const summary = await this.getEmissionsSummary({
      countries: options.countries,
      continents: options.continent ? [options.continent] : undefined,
      years: options.year ? [options.year] : [this.config.defaultYear],
    });

    const totalEmissions = summary.reduce((sum, s) => sum + s.Emissions, 0);

    return summary.map(s => ({
      sector: s.Sector || 'power',
      emissions: s.Emissions,
      percentage: totalEmissions > 0 ? (s.Emissions / totalEmissions) * 100 : 0,
    }));
  }

  /**
   * Get year-over-year trend for a country or region
   */
  async getEmissionsTrend(
    options: {
      countryCode?: string;
      continent?: Continent;
      startYear?: number;
      endYear?: number;
    } = {},
  ): Promise<{ year: number; emissions: number }[]> {
    const startYear = options.startYear || 2020;
    const endYear = options.endYear || 2023;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    const cacheKey = `trend_${options.countryCode || options.continent}_${startYear}_${endYear}`;
    const cached = await this.getCached<{ year: number; emissions: number }[]>(cacheKey);
    if (cached) return cached;

    try {
      const summary = await this.getEmissionsSummary({
        countries: options.countryCode ? [options.countryCode] : undefined,
        continents: options.continent ? [options.continent] : undefined,
        years,
      });

      // Group by year
      const byYear = new Map<number, number>();
      summary.forEach(s => {
        if (s.Year) {
          const current = byYear.get(s.Year) || 0;
          byYear.set(s.Year, current + s.Emissions);
        }
      });

      const result = years.map(year => ({
        year,
        emissions: byYear.get(year) || 0,
      }));

      await this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get emissions trend', {
        error: String(error),
      });
      return [];
    }
  }

  // ===========================================================================
  // User Exploration Tracking
  // ===========================================================================

  /**
   * Track when user explores an emission source (for achievements)
   */
  async trackSourceExploration(userId: string, sourceId: number): Promise<void> {
    try {
      const key = `explored_sources_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      const explored: number[] = stored ? JSON.parse(stored) : [];

      if (!explored.includes(sourceId)) {
        explored.push(sourceId);
        await AsyncStorage.setItem(key, JSON.stringify(explored));
        loggingService.info('[ClimateTrace] User explored new source:', {
          userId,
          sourceId,
          totalExplored: explored.length,
        });
      }
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to track exploration', {
        error: String(error),
      });
    }
  }

  /**
   * Get user's exploration stats (for achievements)
   */
  async getUserExplorationStats(userId: string): Promise<{
    sourcesExplored: number;
    sourceIds: number[];
  }> {
    try {
      const key = `explored_sources_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      const explored: number[] = stored ? JSON.parse(stored) : [];

      return {
        sourcesExplored: explored.length,
        sourceIds: explored,
      };
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to get exploration stats', {
        error: String(error),
      });
      return { sourcesExplored: 0, sourceIds: [] };
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Format emissions number for display
   */
  formatEmissions(emissions: number): string {
    if (emissions >= 1e9) {
      return `${(emissions / 1e9).toFixed(1)}B tonnes`;
    } else if (emissions >= 1e6) {
      return `${(emissions / 1e6).toFixed(1)}M tonnes`;
    } else if (emissions >= 1e3) {
      return `${(emissions / 1e3).toFixed(1)}K tonnes`;
    } else {
      return `${emissions.toFixed(0)} tonnes`;
    }
  }

  /**
   * Get sector display name
   */
  getSectorDisplayName(sector: Sector): string {
    const names: Record<Sector, string> = {
      power: 'Power Generation',
      transportation: 'Transportation',
      buildings: 'Buildings',
      'fossil-fuel-operations': 'Fossil Fuel Operations',
      manufacturing: 'Manufacturing',
      'mineral-extraction': 'Mining & Extraction',
      agriculture: 'Agriculture',
      waste: 'Waste Management',
      'forestry-and-land-use': 'Forestry & Land Use',
    };
    return names[sector] || sector;
  }

  /**
   * Clear all caches (useful for testing or refresh)
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const climateTraceKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(climateTraceKeys);
      this.sectorsCache = null;
      this.countriesCache = null;
      loggingService.info('[ClimateTrace] Cache cleared');
    } catch (error) {
      loggingService.error('[ClimateTrace] Failed to clear cache', {
        error: String(error),
      });
    }
  }
}

// Export singleton instance
export const climateTraceService = ClimateTraceService.getInstance();
export default ClimateTraceService;
