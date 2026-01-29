/**
 * Grid Carbon Service
 * Provides real-time grid carbon intensity data for smart energy decisions
 *
 * Data Sources:
 * - WattTime API (requires account): https://watttime.org/api-documentation/
 * - ElectricityMaps API: https://static.electricitymaps.com/api/docs/index.html
 *
 * This enables features like:
 * - "Grid Whisperer" badge for optimal charging times
 * - Real-time carbon intensity in ML predictions
 * - Smart device scheduling integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loggingService } from '../LoggingService';
import { Config } from 'react-native-config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface GridCarbonIntensity {
  zone: string;
  zoneName: string;
  carbonIntensity: number; // gCO2eq/kWh
  fossilFuelPercentage: number;
  renewablePercentage: number;
  timestamp: string;
  source: 'watttime' | 'electricitymaps' | 'fallback';
}

export interface GridForecast {
  zone: string;
  forecasts: GridForecastPoint[];
  generatedAt: string;
}

export interface GridForecastPoint {
  datetime: string;
  carbonIntensity: number; // gCO2eq/kWh
  fossilFuelPercentage: number;
  isOptimalWindow: boolean;
}

export interface OptimalWindow {
  start: string;
  end: string;
  avgCarbonIntensity: number;
  savings: {
    vsNow: number; // % reduction vs current
    vsAverage: number; // % reduction vs day average
  };
  recommendation: string;
}

export interface GridHistory {
  zone: string;
  data: GridHistoryPoint[];
  stats: {
    min: number;
    max: number;
    average: number;
    stdDev: number;
  };
}

export interface GridHistoryPoint {
  datetime: string;
  carbonIntensity: number;
}

export interface PowerBreakdown {
  zone: string;
  powerProductionBreakdown: {
    nuclear: number;
    hydro: number;
    wind: number;
    solar: number;
    geothermal: number;
    biomass: number;
    gas: number;
    coal: number;
    oil: number;
    unknown: number;
  };
  renewablePercentage: number;
  fossilFuelPercentage: number;
  lowCarbonPercentage: number;
}

// Zone mapping for common regions
export interface GridZone {
  code: string;
  name: string;
  country: string;
  region?: string;
}

// =============================================================================
// Constants
// =============================================================================

// Common grid zones (subset - ElectricityMaps has 150+ zones)
const GRID_ZONES: GridZone[] = [
  // United States
  {
    code: 'US-CAL-CISO',
    name: 'California ISO',
    country: 'USA',
    region: 'California',
  },
  { code: 'US-TEX-ERCO', name: 'Texas ERCOT', country: 'USA', region: 'Texas' },
  {
    code: 'US-NY-NYIS',
    name: 'New York ISO',
    country: 'USA',
    region: 'New York',
  },
  {
    code: 'US-NE-ISNE',
    name: 'New England ISO',
    country: 'USA',
    region: 'New England',
  },
  {
    code: 'US-MIDA-PJM',
    name: 'PJM Interconnection',
    country: 'USA',
    region: 'Mid-Atlantic',
  },
  {
    code: 'US-NW-PACW',
    name: 'Pacific Northwest',
    country: 'USA',
    region: 'Pacific Northwest',
  },
  {
    code: 'US-SW-AZPS',
    name: 'Arizona Public Service',
    country: 'USA',
    region: 'Arizona',
  },
  {
    code: 'US-MIDW-MISO',
    name: 'Midcontinent ISO',
    country: 'USA',
    region: 'Midwest',
  },

  // Europe
  { code: 'DE', name: 'Germany', country: 'DEU' },
  { code: 'FR', name: 'France', country: 'FRA' },
  { code: 'GB', name: 'Great Britain', country: 'GBR' },
  { code: 'ES', name: 'Spain', country: 'ESP' },
  { code: 'IT-NO', name: 'Northern Italy', country: 'ITA', region: 'North' },
  { code: 'NL', name: 'Netherlands', country: 'NLD' },
  { code: 'SE', name: 'Sweden', country: 'SWE' },
  { code: 'NO-NO1', name: 'Norway South', country: 'NOR', region: 'South' },
  { code: 'DK-DK1', name: 'Denmark West', country: 'DNK', region: 'West' },
  { code: 'PL', name: 'Poland', country: 'POL' },

  // Asia Pacific
  { code: 'JP-TK', name: 'Japan Tokyo', country: 'JPN', region: 'Tokyo' },
  { code: 'AU-NSW', name: 'New South Wales', country: 'AUS', region: 'NSW' },
  { code: 'AU-VIC', name: 'Victoria', country: 'AUS', region: 'Victoria' },
  { code: 'AU-SA', name: 'South Australia', country: 'AUS', region: 'SA' },
  { code: 'IN-WE', name: 'India West', country: 'IND', region: 'West' },
  { code: 'KR', name: 'South Korea', country: 'KOR' },

  // Americas
  { code: 'CA-ON', name: 'Ontario', country: 'CAN', region: 'Ontario' },
  { code: 'CA-QC', name: 'Quebec', country: 'CAN', region: 'Quebec' },
  { code: 'CA-BC', name: 'British Columbia', country: 'CAN', region: 'BC' },
  {
    code: 'BR-CS',
    name: 'Brazil Central-South',
    country: 'BRA',
    region: 'Central-South',
  },
];

// Fallback intensity data by country (gCO2eq/kWh)
const FALLBACK_INTENSITY: Record<string, number> = {
  USA: 386,
  CHN: 540,
  IND: 633,
  GBR: 233,
  DEU: 385,
  FRA: 56,
  JPN: 469,
  CAN: 128,
  AUS: 656,
  BRA: 88,
  KOR: 415,
  SWE: 41,
  NOR: 28,
  NLD: 328,
  WORLD: 442,
};

// Cache settings
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for real-time data
const FORECAST_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for forecasts

// =============================================================================
// Grid Carbon Service
// =============================================================================

class GridCarbonService {
  private static instance: GridCarbonService;
  private readonly CACHE_PREFIX = 'grid_carbon_';
  private wattTimeToken: string | null = null;
  private wattTimeTokenExpiry: number = 0;

  private constructor() {}

  public static getInstance(): GridCarbonService {
    if (!GridCarbonService.instance) {
      GridCarbonService.instance = new GridCarbonService();
    }
    return GridCarbonService.instance;
  }

  // ===========================================================================
  // Zone Discovery
  // ===========================================================================

  /**
   * Get all available grid zones
   */
  getAvailableZones(): GridZone[] {
    return [...GRID_ZONES];
  }

  /**
   * Find zone by coordinates
   */
  async findZoneByLocation(lat: number, lng: number): Promise<string | null> {
    try {
      // Try ElectricityMaps first
      const apiKey = Config.ELECTRICITY_MAPS_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://api.electricitymap.org/v3/zones`,
          {
            headers: { 'auth-token': apiKey },
          },
        );

        if (response.ok) {
          // ElectricityMaps zone lookup would go here
          // For now, fall back to country-based lookup
        }
      }

      // Fallback: simple country-based zone mapping
      return this.estimateZoneFromCoordinates(lat, lng);
    } catch (error) {
      loggingService.error('Error finding grid zone', { error, lat, lng });
      return null;
    }
  }

  /**
   * Estimate grid zone from coordinates (fallback method)
   */
  private estimateZoneFromCoordinates(lat: number, lng: number): string | null {
    // Very simplified zone estimation based on coordinates
    // In production, would use proper geolocation lookup

    // US regions
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
      if (lng >= -125 && lng <= -114 && lat >= 32 && lat <= 42) {
        return 'US-CAL-CISO'; // California
      }
      if (lng >= -106 && lng <= -93 && lat >= 26 && lat <= 37) {
        return 'US-TEX-ERCO'; // Texas
      }
      if (lng >= -80 && lng <= -71 && lat >= 40 && lat <= 45) {
        return 'US-NY-NYIS'; // New York
      }
      return 'US-MIDA-PJM'; // Default to PJM for eastern US
    }

    // Europe
    if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 30) {
      if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) return 'DE';
      if (lat >= 42 && lat <= 51 && lng >= -5 && lng <= 8) return 'FR';
      if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) return 'GB';
      return 'DE'; // Default to Germany for central Europe
    }

    // Australia
    if (lat >= -45 && lat <= -10 && lng >= 110 && lng <= 155) {
      if (lng >= 150) return 'AU-NSW';
      if (lng >= 140) return 'AU-VIC';
      return 'AU-SA';
    }

    return null;
  }

  // ===========================================================================
  // Real-Time Carbon Intensity
  // ===========================================================================

  /**
   * Get current grid carbon intensity for a zone
   */
  async getCurrentIntensity(zone: string): Promise<GridCarbonIntensity> {
    const cacheKey = `${this.CACHE_PREFIX}intensity_${zone}`;

    // Check cache
    const cached = await this.getFromCache<GridCarbonIntensity>(cacheKey);
    if (cached) return cached;

    try {
      // Try ElectricityMaps first
      const result = await this.fetchFromElectricityMaps(zone);
      if (result) {
        await this.setCache(cacheKey, result, CACHE_DURATION);
        return result;
      }

      // Try WattTime as backup
      const wattTimeResult = await this.fetchFromWattTime(zone);
      if (wattTimeResult) {
        await this.setCache(cacheKey, wattTimeResult, CACHE_DURATION);
        return wattTimeResult;
      }

      // Use fallback
      return this.getFallbackIntensity(zone);
    } catch (error) {
      loggingService.error('Error fetching grid intensity', { error, zone });
      return this.getFallbackIntensity(zone);
    }
  }

  /**
   * Fetch from ElectricityMaps API
   */
  private async fetchFromElectricityMaps(
    zone: string,
  ): Promise<GridCarbonIntensity | null> {
    const apiKey = Config.ELECTRICITY_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`,
        {
          headers: { 'auth-token': apiKey },
        },
      );

      if (!response.ok) return null;

      const data = await response.json();

      // Also fetch power breakdown
      const breakdownResponse = await fetch(
        `https://api.electricitymap.org/v3/power-breakdown/latest?zone=${zone}`,
        {
          headers: { 'auth-token': apiKey },
        },
      );

      let fossilFuel = 50;
      let renewable = 30;

      if (breakdownResponse.ok) {
        const breakdown = await breakdownResponse.json();
        fossilFuel = breakdown.fossilFuelPercentage || 50;
        renewable = breakdown.renewablePercentage || 30;
      }

      return {
        zone,
        zoneName: this.getZoneName(zone),
        carbonIntensity: data.carbonIntensity,
        fossilFuelPercentage: fossilFuel,
        renewablePercentage: renewable,
        timestamp: data.datetime || new Date().toISOString(),
        source: 'electricitymaps',
      };
    } catch (error) {
      loggingService.warn('ElectricityMaps API error', { error, zone });
      return null;
    }
  }

  /**
   * Fetch from WattTime API
   */
  private async fetchFromWattTime(
    zone: string,
  ): Promise<GridCarbonIntensity | null> {
    const username = Config.WATTTIME_USERNAME;
    const password = Config.WATTTIME_PASSWORD;
    if (!username || !password) return null;

    try {
      // Authenticate if needed
      await this.authenticateWattTime(username, password);
      if (!this.wattTimeToken) return null;

      // Convert zone to WattTime region
      const region = this.convertToWattTimeRegion(zone);

      const response = await fetch(
        `https://api.watttime.org/v3/signal-index?region=${region}`,
        {
          headers: { Authorization: `Bearer ${this.wattTimeToken}` },
        },
      );

      if (!response.ok) return null;

      const data = await response.json();

      // WattTime returns MOER (marginal operating emissions rate) in lbs/MWh
      // Convert to gCO2/kWh
      const moerInGrams = (data.moer * 453.592) / 1000;

      return {
        zone,
        zoneName: this.getZoneName(zone),
        carbonIntensity: Math.round(moerInGrams),
        fossilFuelPercentage: 50, // Not provided by WattTime index
        renewablePercentage: 30,
        timestamp: data.point_time || new Date().toISOString(),
        source: 'watttime',
      };
    } catch (error) {
      loggingService.warn('WattTime API error', { error, zone });
      return null;
    }
  }

  /**
   * Authenticate with WattTime
   */
  private async authenticateWattTime(
    username: string,
    password: string,
  ): Promise<void> {
    if (this.wattTimeToken && Date.now() < this.wattTimeTokenExpiry) {
      return;
    }

    try {
      const credentials = Buffer.from(`${username}:${password}`).toString(
        'base64',
      );
      const response = await fetch('https://api.watttime.org/login', {
        headers: { Authorization: `Basic ${credentials}` },
      });

      if (response.ok) {
        const data = await response.json();
        this.wattTimeToken = data.token;
        this.wattTimeTokenExpiry = Date.now() + 29 * 60 * 1000; // 29 minutes
      }
    } catch (error) {
      loggingService.error('WattTime authentication failed', { error });
    }
  }

  /**
   * Get fallback intensity based on zone/country
   */
  private getFallbackIntensity(zone: string): GridCarbonIntensity {
    // Extract country from zone code
    let countryCode = zone.split('-')[0];
    if (countryCode.length === 2 && countryCode.startsWith('U')) {
      countryCode = 'USA';
    }

    const intensity =
      FALLBACK_INTENSITY[countryCode] || FALLBACK_INTENSITY.WORLD;

    return {
      zone,
      zoneName: this.getZoneName(zone),
      carbonIntensity: intensity,
      fossilFuelPercentage: 50,
      renewablePercentage: 30,
      timestamp: new Date().toISOString(),
      source: 'fallback',
    };
  }

  // ===========================================================================
  // Forecasts & Optimal Windows
  // ===========================================================================

  /**
   * Get carbon intensity forecast for the next 24 hours
   */
  async getForecast(zone: string, hours: number = 24): Promise<GridForecast> {
    const cacheKey = `${this.CACHE_PREFIX}forecast_${zone}`;

    const cached = await this.getFromCache<GridForecast>(cacheKey);
    if (cached) return cached;

    try {
      const apiKey = Config.ELECTRICITY_MAPS_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://api.electricitymap.org/v3/carbon-intensity/forecast?zone=${zone}`,
          {
            headers: { 'auth-token': apiKey },
          },
        );

        if (response.ok) {
          const data = await response.json();
          interface ForecastPointAPI {
            datetime: string;
            carbonIntensity: number;
          }
          const forecasts = data.forecast
            .slice(0, hours)
            .map((point: ForecastPointAPI) => ({
              datetime: point.datetime,
              carbonIntensity: point.carbonIntensity,
              fossilFuelPercentage: 50, // Not provided in forecast
              isOptimalWindow: false, // Will be calculated
            }));

          // Mark optimal windows
          this.markOptimalWindows(forecasts);

          const result: GridForecast = {
            zone,
            forecasts,
            generatedAt: new Date().toISOString(),
          };

          await this.setCache(cacheKey, result, FORECAST_CACHE_DURATION);
          return result;
        }
      }

      // Generate synthetic forecast if no API
      return this.generateSyntheticForecast(zone, hours);
    } catch (error) {
      loggingService.error('Error fetching grid forecast', { error, zone });
      return this.generateSyntheticForecast(zone, hours);
    }
  }

  /**
   * Get the optimal time window for high-energy activities
   */
  async getOptimalWindow(
    zone: string,
    durationHours: number = 2,
    withinHours: number = 24,
  ): Promise<OptimalWindow> {
    const forecast = await this.getForecast(zone, withinHours);
    const current = await this.getCurrentIntensity(zone);

    if (forecast.forecasts.length === 0) {
      return {
        start: new Date().toISOString(),
        end: new Date(Date.now() + durationHours * 3600000).toISOString(),
        avgCarbonIntensity: current.carbonIntensity,
        savings: { vsNow: 0, vsAverage: 0 },
        recommendation: 'No forecast data available - any time is fine',
      };
    }

    // Find the window with lowest average intensity
    let bestWindow = {
      startIndex: 0,
      avgIntensity: Infinity,
    };

    const windowSize = Math.min(durationHours, forecast.forecasts.length);
    const avgDay =
      forecast.forecasts.reduce((sum, f) => sum + f.carbonIntensity, 0) /
      forecast.forecasts.length;

    for (let i = 0; i <= forecast.forecasts.length - windowSize; i++) {
      const windowIntensity =
        forecast.forecasts
          .slice(i, i + windowSize)
          .reduce((sum, f) => sum + f.carbonIntensity, 0) / windowSize;

      if (windowIntensity < bestWindow.avgIntensity) {
        bestWindow = { startIndex: i, avgIntensity: windowIntensity };
      }
    }

    const startForecast = forecast.forecasts[bestWindow.startIndex];
    const endForecast =
      forecast.forecasts[bestWindow.startIndex + windowSize - 1];

    const vsNow =
      ((current.carbonIntensity - bestWindow.avgIntensity) /
        current.carbonIntensity) *
      100;
    const vsAverage = ((avgDay - bestWindow.avgIntensity) / avgDay) * 100;

    let recommendation: string;
    if (vsNow > 20) {
      recommendation = `Wait! Grid will be ${vsNow.toFixed(0)}% cleaner later`;
    } else if (vsNow > 10) {
      recommendation = `Grid will be slightly cleaner (${vsNow.toFixed(
        0,
      )}%) later`;
    } else if (vsNow < -10) {
      recommendation = 'Now is a good time - grid is relatively clean!';
    } else {
      recommendation = 'Grid intensity is stable - any time works';
    }

    return {
      start: startForecast.datetime,
      end: endForecast.datetime,
      avgCarbonIntensity: Math.round(bestWindow.avgIntensity),
      savings: {
        vsNow: Math.round(vsNow),
        vsAverage: Math.round(vsAverage),
      },
      recommendation,
    };
  }

  /**
   * Mark optimal windows in forecast
   */
  private markOptimalWindows(forecasts: GridForecastPoint[]): void {
    if (forecasts.length === 0) return;

    const avg =
      forecasts.reduce((sum, f) => sum + f.carbonIntensity, 0) /
      forecasts.length;
    const threshold = avg * 0.8; // 20% below average = optimal

    forecasts.forEach(f => {
      f.isOptimalWindow = f.carbonIntensity < threshold;
    });
  }

  /**
   * Generate synthetic forecast when no API available
   */
  private generateSyntheticForecast(zone: string, hours: number): GridForecast {
    const baseIntensity =
      FALLBACK_INTENSITY[zone.split('-')[0]] || FALLBACK_INTENSITY.WORLD;
    const forecasts: GridForecastPoint[] = [];

    const now = new Date();
    for (let i = 0; i < hours; i++) {
      const hour = (now.getHours() + i) % 24;

      // Simulate daily variation (higher during peak hours, lower at night)
      let multiplier = 1.0;
      if (hour >= 7 && hour <= 10) multiplier = 1.15; // Morning peak
      if (hour >= 17 && hour <= 21) multiplier = 1.25; // Evening peak
      if (hour >= 23 || hour <= 5) multiplier = 0.8; // Night valley
      if (hour >= 11 && hour <= 14) multiplier = 0.9; // Solar dip

      const intensity =
        baseIntensity * multiplier * (0.9 + Math.random() * 0.2);

      forecasts.push({
        datetime: new Date(now.getTime() + i * 3600000).toISOString(),
        carbonIntensity: Math.round(intensity),
        fossilFuelPercentage: 50,
        isOptimalWindow: false,
      });
    }

    this.markOptimalWindows(forecasts);

    return {
      zone,
      forecasts,
      generatedAt: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // Power Breakdown
  // ===========================================================================

  /**
   * Get current power generation breakdown
   */
  async getPowerBreakdown(zone: string): Promise<PowerBreakdown | null> {
    const cacheKey = `${this.CACHE_PREFIX}breakdown_${zone}`;

    const cached = await this.getFromCache<PowerBreakdown>(cacheKey);
    if (cached) return cached;

    try {
      const apiKey = Config.ELECTRICITY_MAPS_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://api.electricitymap.org/v3/power-breakdown/latest?zone=${zone}`,
        {
          headers: { 'auth-token': apiKey },
        },
      );

      if (!response.ok) return null;

      const data = await response.json();

      const result: PowerBreakdown = {
        zone,
        powerProductionBreakdown: {
          nuclear: data.powerProductionBreakdown?.nuclear || 0,
          hydro: data.powerProductionBreakdown?.hydro || 0,
          wind: data.powerProductionBreakdown?.wind || 0,
          solar: data.powerProductionBreakdown?.solar || 0,
          geothermal: data.powerProductionBreakdown?.geothermal || 0,
          biomass: data.powerProductionBreakdown?.biomass || 0,
          gas: data.powerProductionBreakdown?.gas || 0,
          coal: data.powerProductionBreakdown?.coal || 0,
          oil: data.powerProductionBreakdown?.oil || 0,
          unknown: data.powerProductionBreakdown?.unknown || 0,
        },
        renewablePercentage: data.renewablePercentage || 0,
        fossilFuelPercentage: data.fossilFuelPercentage || 0,
        lowCarbonPercentage: data.lowCarbonPercentage || 0,
      };

      await this.setCache(cacheKey, result, CACHE_DURATION);
      return result;
    } catch (error) {
      loggingService.error('Error fetching power breakdown', { error, zone });
      return null;
    }
  }

  // ===========================================================================
  // Achievement Integration
  // ===========================================================================

  /**
   * Track when user uses optimal charging window
   */
  async trackOptimalUsage(userId: string, _zone: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}optimal_usage_${userId}`;
    const existing = (await this.getFromCache<string[]>(key)) || [];
    existing.push(new Date().toISOString());

    // Keep last 100 entries
    const trimmed = existing.slice(-100);
    await this.setCache(key, trimmed, 365 * 24 * 60 * 60 * 1000); // 1 year
  }

  /**
   * Get user's optimal usage stats for badges
   */
  async getOptimalUsageStats(userId: string): Promise<{
    totalOptimalUses: number;
    streak: number;
    lastUse: string | null;
  }> {
    const key = `${this.CACHE_PREFIX}optimal_usage_${userId}`;
    const usages = (await this.getFromCache<string[]>(key)) || [];

    if (usages.length === 0) {
      return { totalOptimalUses: 0, streak: 0, lastUse: null };
    }

    // Calculate streak (consecutive days with at least one optimal use)
    let streak = 0;
    const usageDays = new Set(usages.map(u => new Date(u).toDateString()));

    const checkDate = new Date();
    while (usageDays.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      totalOptimalUses: usages.length,
      streak,
      lastUse: usages[usages.length - 1],
    };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get zone display name
   */
  private getZoneName(zoneCode: string): string {
    const zone = GRID_ZONES.find(z => z.code === zoneCode);
    return zone?.name || zoneCode;
  }

  /**
   * Convert zone to WattTime region format
   */
  private convertToWattTimeRegion(zone: string): string {
    // WattTime uses different region codes
    const mapping: Record<string, string> = {
      'US-CAL-CISO': 'CAISO_NORTH',
      'US-TEX-ERCO': 'ERCOT_NORTH',
      'US-NY-NYIS': 'NYISO_NYC',
      'US-NE-ISNE': 'ISONE_NEMA',
      'US-MIDA-PJM': 'PJM_PECO',
    };
    return mapping[zone] || zone;
  }

  // ===========================================================================
  // Cache Helpers
  // ===========================================================================

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }

  private async setCache<T>(
    key: string,
    data: T,
    durationMs: number,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          data,
          expiry: Date.now() + durationMs,
        }),
      );
    } catch (error) {
      loggingService.warn('Cache write failed', { key, error });
    }
  }

  /**
   * Clear all grid carbon cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const gridKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(gridKeys);
    } catch (error) {
      loggingService.error('Failed to clear grid cache', { error });
    }
  }
}

// Export singleton instance
export const gridCarbonService = GridCarbonService.getInstance();
export default GridCarbonService;
