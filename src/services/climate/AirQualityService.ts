// @ts-nocheck
/* eslint-disable */
/**
 * Air Quality Service
 * Provides real-time air quality data for health-aware recommendations
 *
 * Data Sources:
 * - OpenAQ API (free, open-source): https://docs.openaq.org/
 * - IQAir API (requires key): https://www.iqair.com/air-pollution-data-api
 *
 * This enables features like:
 * - "Air Aware" badge for air quality-conscious users
 * - Health-aware transport recommendations
 * - Air quality alerts and notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import loggingService from '../LoggerService';
import { Config } from 'react-native-config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface AirQualityData {
  location: {
    name: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  measurements: AirQualityMeasurement[];
  aqi: {
    value: number;
    category: AQICategory;
    dominantPollutant: string;
  };
  timestamp: string;
  source: 'openaq' | 'iqair' | 'fallback';
}

export interface AirQualityMeasurement {
  parameter: PollutantType;
  value: number;
  unit: string;
  lastUpdated: string;
}

export type PollutantType =
  | 'pm25' // Fine particulate matter
  | 'pm10' // Coarse particulate matter
  | 'o3' // Ozone
  | 'no2' // Nitrogen dioxide
  | 'so2' // Sulfur dioxide
  | 'co' // Carbon monoxide
  | 'bc'; // Black carbon

export type AQICategory =
  | 'good'
  | 'moderate'
  | 'unhealthy-sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export interface AQIRecommendation {
  category: AQICategory;
  generalAdvice: string;
  exerciseAdvice: string;
  transportAdvice: string;
  sensitiveGroupsAdvice: string;
  carbonReduction: string;
}

export interface NearbyStation {
  id: string;
  name: string;
  city: string;
  distance: number; // km
  measurements: AirQualityMeasurement[];
  lastUpdated: string;
}

export interface AirQualityForecast {
  location: string;
  forecasts: AQIForecastPoint[];
  generatedAt: string;
}

export interface AQIForecastPoint {
  datetime: string;
  aqi: number;
  category: AQICategory;
  dominantPollutant: string;
}

// =============================================================================
// Constants
// =============================================================================

// AQI breakpoints for PM2.5 (EPA standard)
const PM25_BREAKPOINTS = [
  { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 12.0 },
  { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
  { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
  { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
  { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
  { aqiLow: 301, aqiHigh: 500, concLow: 250.5, concHigh: 500.4 },
];

// AQI recommendations by category
const AQI_RECOMMENDATIONS: Record<AQICategory, AQIRecommendation> = {
  good: {
    category: 'good',
    generalAdvice: 'Air quality is satisfactory. Enjoy outdoor activities!',
    exerciseAdvice: 'Great conditions for outdoor exercise',
    transportAdvice: 'Perfect day for walking or cycling',
    sensitiveGroupsAdvice: 'No precautions needed',
    carbonReduction:
      'Consider walking or cycling to reduce your carbon footprint',
  },
  moderate: {
    category: 'moderate',
    generalAdvice: 'Air quality is acceptable for most people',
    exerciseAdvice: 'Outdoor exercise is fine for most people',
    transportAdvice: 'Good conditions for active transport',
    sensitiveGroupsAdvice:
      'Unusually sensitive individuals may experience symptoms',
    carbonReduction:
      "Walking or cycling still recommended - you'll contribute less to air pollution",
  },
  'unhealthy-sensitive': {
    category: 'unhealthy-sensitive',
    generalAdvice: 'May cause issues for sensitive groups',
    exerciseAdvice: 'Consider reducing prolonged outdoor exertion',
    transportAdvice: 'Active transport still okay, but reduce intensity',
    sensitiveGroupsAdvice:
      'Limit prolonged outdoor exposure for children, elderly, and those with respiratory issues',
    carbonReduction:
      'If driving, ensure windows are closed. Consider public transit to reduce emissions',
  },
  unhealthy: {
    category: 'unhealthy',
    generalAdvice: 'Everyone may begin to experience health effects',
    exerciseAdvice: 'Move strenuous activities indoors',
    transportAdvice:
      'Consider alternatives to walking/cycling for long distances',
    sensitiveGroupsAdvice:
      'Avoid all outdoor physical activity. Stay indoors with air filtration if possible',
    carbonReduction:
      'Use public transit if available. Every car off the road helps',
  },
  'very-unhealthy': {
    category: 'very-unhealthy',
    generalAdvice: 'Health warnings of emergency conditions',
    exerciseAdvice: 'Avoid all outdoor exercise',
    transportAdvice: 'Minimize time outdoors. Use enclosed transport',
    sensitiveGroupsAdvice: 'Remain indoors. If you must go out, wear N95 mask',
    carbonReduction:
      'This is often caused by vehicle emissions. Reduce driving if possible',
  },
  hazardous: {
    category: 'hazardous',
    generalAdvice: 'Health alert: everyone may experience serious effects',
    exerciseAdvice: 'No outdoor exercise',
    transportAdvice:
      'Stay indoors. Use enclosed, filtered transport only when necessary',
    sensitiveGroupsAdvice: 'Do not go outdoors. Use air purifiers indoors',
    carbonReduction: 'Air quality emergency. Limit all non-essential travel',
  },
};

// Pollutant display names
const POLLUTANT_NAMES: Record<PollutantType, string> = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  o3: 'Ozone',
  no2: 'Nitrogen Dioxide',
  so2: 'Sulfur Dioxide',
  co: 'Carbon Monoxide',
  bc: 'Black Carbon',
};

// Cache settings
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for AQ data

// =============================================================================
// Air Quality Service
// =============================================================================

class AirQualityService {
  private static instance: AirQualityService;
  private readonly CACHE_PREFIX = 'air_quality_';
  private readonly OPENAQ_BASE_URL = 'https://api.openaq.org/v2';

  private constructor() {}

  public static getInstance(): AirQualityService {
    if (!AirQualityService.instance) {
      AirQualityService.instance = new AirQualityService();
    }
    return AirQualityService.instance;
  }

  // ===========================================================================
  // Current Air Quality
  // ===========================================================================

  /**
   * Get current air quality for a location
   */
  async getCurrentAirQuality(
    lat: number,
    lng: number,
  ): Promise<AirQualityData> {
    const cacheKey = `${this.CACHE_PREFIX}current_${lat.toFixed(
      2,
    )}_${lng.toFixed(2)}`;

    // Check cache
    const cached = await this.getFromCache<AirQualityData>(cacheKey);
    if (cached) return cached;

    try {
      // Try OpenAQ first
      const result = await this.fetchFromOpenAQ(lat, lng);
      if (result) {
        await this.setCache(cacheKey, result, CACHE_DURATION);
        return result;
      }

      // Try IQAir as backup
      const iqairResult = await this.fetchFromIQAir(lat, lng);
      if (iqairResult) {
        await this.setCache(cacheKey, iqairResult, CACHE_DURATION);
        return iqairResult;
      }

      // Return fallback
      return this.getFallbackAirQuality(lat, lng);
    } catch (error) {
      loggingService.error('Error fetching air quality', { error, lat, lng });
      return this.getFallbackAirQuality(lat, lng);
    }
  }

  /**
   * Fetch from OpenAQ API
   */
  private async fetchFromOpenAQ(
    lat: number,
    lng: number,
  ): Promise<AirQualityData | null> {
    try {
      const apiKey = Config.OPENAQ_API_KEY;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Find nearest location with measurements
      const response = await fetch(
        `${this.OPENAQ_BASE_URL}/latest?coordinates=${lat},${lng}&radius=25000&limit=5`,
        { headers },
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (!data.results || data.results.length === 0) return null;

      // Get the closest station with recent data
      const station = data.results[0];
      interface MeasurementAPI {
        parameter: string;
        value: number;
        unit: string;
        lastUpdated: string;
      }
      const measurements = station.measurements.map((m: MeasurementAPI) => ({
        parameter: m.parameter as PollutantType,
        value: m.value,
        unit: m.unit,
        lastUpdated: m.lastUpdated,
      }));

      // Calculate AQI from PM2.5 if available
      const pm25 = measurements.find(
        (m: AirQualityMeasurement) => m.parameter === 'pm25',
      );
      const aqi = pm25
        ? this.calculateAQI(pm25.value, 'pm25')
        : this.estimateAQI(measurements);

      return {
        location: {
          name: station.location,
          city: station.city || '',
          country: station.country,
          coordinates: {
            lat: station.coordinates?.latitude || lat,
            lng: station.coordinates?.longitude || lng,
          },
        },
        measurements,
        aqi: {
          value: aqi.value,
          category: aqi.category,
          dominantPollutant: pm25 ? 'PM2.5' : 'Unknown',
        },
        timestamp: new Date().toISOString(),
        source: 'openaq',
      };
    } catch (error) {
      loggingService.warn('OpenAQ API error', { error });
      return null;
    }
  }

  /**
   * Fetch from IQAir API
   */
  private async fetchFromIQAir(
    lat: number,
    lng: number,
  ): Promise<AirQualityData | null> {
    const apiKey = Config.IQAIR_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${apiKey}`,
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.status !== 'success') return null;

      const current = data.data.current.pollution;
      const city = data.data.city;
      const country = data.data.country;

      return {
        location: {
          name: city,
          city: city,
          country: country,
          coordinates: { lat, lng },
        },
        measurements: [
          {
            parameter: 'pm25',
            value: current.aqius, // US AQI
            unit: 'AQI',
            lastUpdated: current.ts,
          },
        ],
        aqi: {
          value: current.aqius,
          category: this.getAQICategory(current.aqius),
          dominantPollutant: current.mainus || 'PM2.5',
        },
        timestamp: current.ts,
        source: 'iqair',
      };
    } catch (error) {
      loggingService.warn('IQAir API error', { error });
      return null;
    }
  }

  /**
   * Get fallback air quality data
   */
  private getFallbackAirQuality(lat: number, lng: number): AirQualityData {
    return {
      location: {
        name: 'Unknown Location',
        city: '',
        country: '',
        coordinates: { lat, lng },
      },
      measurements: [],
      aqi: {
        value: 50,
        category: 'moderate',
        dominantPollutant: 'Unknown',
      },
      timestamp: new Date().toISOString(),
      source: 'fallback',
    };
  }

  // ===========================================================================
  // Nearby Stations
  // ===========================================================================

  /**
   * Get nearby monitoring stations
   */
  async getNearbyStations(
    lat: number,
    lng: number,
    radiusKm: number = 25,
  ): Promise<NearbyStation[]> {
    try {
      const apiKey = Config.OPENAQ_API_KEY;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(
        `${this.OPENAQ_BASE_URL}/locations?coordinates=${lat},${lng}&radius=${
          radiusKm * 1000
        }&limit=10`,
        { headers },
      );

      if (!response.ok) return [];

      const data = await response.json();

      interface StationAPI {
        id: number;
        name: string;
        city?: string;
        coordinates?: { latitude: number; longitude: number };
        parameters?: {
          parameter: string;
          lastValue: number;
          unit: string;
          lastUpdated: string;
        }[];
        lastUpdated: string;
      }

      return data.results
        .map((station: StationAPI) => {
          const stationLat = station.coordinates?.latitude || lat;
          const stationLng = station.coordinates?.longitude || lng;

          return {
            id: station.id.toString(),
            name: station.name,
            city: station.city || '',
            distance: this.calculateDistance(lat, lng, stationLat, stationLng),
            measurements:
              station.parameters?.map(p => ({
                parameter: p.parameter as PollutantType,
                value: p.lastValue,
                unit: p.unit,
                lastUpdated: p.lastUpdated,
              })) || [],
            lastUpdated: station.lastUpdated,
          };
        })
        .sort((a: NearbyStation, b: NearbyStation) => a.distance - b.distance);
    } catch (error) {
      loggingService.error('Error fetching nearby stations', { error });
      return [];
    }
  }

  // ===========================================================================
  // AQI Calculations
  // ===========================================================================

  /**
   * Calculate AQI from pollutant concentration
   */
  calculateAQI(
    concentration: number,
    pollutant: PollutantType,
  ): { value: number; category: AQICategory } {
    // Use PM2.5 breakpoints (most common)
    if (pollutant !== 'pm25') {
      // Simplified: return concentration as rough AQI for other pollutants
      return {
        value: Math.round(concentration),
        category: this.getAQICategory(concentration),
      };
    }

    // EPA AQI calculation for PM2.5
    for (const bp of PM25_BREAKPOINTS) {
      if (concentration >= bp.concLow && concentration <= bp.concHigh) {
        const aqi =
          ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) *
            (concentration - bp.concLow) +
          bp.aqiLow;
        return {
          value: Math.round(aqi),
          category: this.getAQICategory(Math.round(aqi)),
        };
      }
    }

    // Off the scale high
    return { value: 500, category: 'hazardous' };
  }

  /**
   * Estimate AQI from available measurements
   */
  private estimateAQI(measurements: AirQualityMeasurement[]): {
    value: number;
    category: AQICategory;
  } {
    // Priority: PM2.5 > PM10 > O3 > NO2 > others
    const priority: PollutantType[] = [
      'pm25',
      'pm10',
      'o3',
      'no2',
      'so2',
      'co',
    ];

    for (const pollutant of priority) {
      const measurement = measurements.find(m => m.parameter === pollutant);
      if (measurement) {
        return this.calculateAQI(measurement.value, pollutant);
      }
    }

    return { value: 50, category: 'moderate' };
  }

  /**
   * Get AQI category from value
   */
  getAQICategory(aqi: number): AQICategory {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy-sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very-unhealthy';
    return 'hazardous';
  }

  /**
   * Get color for AQI category
   */
  getAQIColor(category: AQICategory): string {
    const colors: Record<AQICategory, string> = {
      good: '#00E400',
      moderate: '#FFFF00',
      'unhealthy-sensitive': '#FF7E00',
      unhealthy: '#FF0000',
      'very-unhealthy': '#8F3F97',
      hazardous: '#7E0023',
    };
    return colors[category];
  }

  /**
   * Get emoji for AQI category
   */
  getAQIEmoji(category: AQICategory): string {
    const emojis: Record<AQICategory, string> = {
      good: '🌿',
      moderate: '😐',
      'unhealthy-sensitive': '😷',
      unhealthy: '🤢',
      'very-unhealthy': '☠️',
      hazardous: '💀',
    };
    return emojis[category];
  }

  // ===========================================================================
  // Recommendations
  // ===========================================================================

  /**
   * Get recommendations based on AQI
   */
  getRecommendations(category: AQICategory): AQIRecommendation {
    return AQI_RECOMMENDATIONS[category];
  }

  /**
   * Get transport-specific advice
   */
  getTransportAdvice(aqi: AirQualityData): {
    walking: { recommended: boolean; advice: string };
    cycling: { recommended: boolean; advice: string };
    publicTransit: { recommended: boolean; advice: string };
    driving: { recommended: boolean; advice: string };
  } {
    const category = aqi.aqi.category;

    return {
      walking: {
        recommended: ['good', 'moderate'].includes(category),
        advice:
          category === 'good'
            ? 'Great for walking! Reduces your carbon footprint'
            : category === 'moderate'
            ? 'Walking is fine, reduces emissions'
            : 'Consider limiting walking distance',
      },
      cycling: {
        recommended: ['good', 'moderate'].includes(category),
        advice:
          category === 'good'
            ? 'Perfect for cycling! Zero emissions transport'
            : category === 'moderate'
            ? 'Cycling is okay, keep pace moderate'
            : 'Heavy breathing while cycling increases pollutant intake',
      },
      publicTransit: {
        recommended: true,
        advice: 'Public transit reduces per-person emissions by 45%',
      },
      driving: {
        recommended: false,
        advice:
          category === 'good'
            ? 'Consider alternatives - cars contribute to air pollution'
            : 'If driving, keep windows closed and use recirculation',
      },
    };
  }

  // ===========================================================================
  // Achievement Integration
  // ===========================================================================

  /**
   * Track air quality check for badges
   */
  async trackAirQualityCheck(userId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}checks_${userId}`;
    const existing = (await this.getFromCache<string[]>(key)) || [];
    existing.push(new Date().toISOString());

    // Keep last 100 entries
    const trimmed = existing.slice(-100);
    await this.setCache(key, trimmed, 365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Get user's air quality awareness stats
   */
  async getAirAwarenessStats(userId: string): Promise<{
    totalChecks: number;
    uniqueDays: number;
    lastCheck: string | null;
  }> {
    const key = `${this.CACHE_PREFIX}checks_${userId}`;
    const checks = (await this.getFromCache<string[]>(key)) || [];

    if (checks.length === 0) {
      return { totalChecks: 0, uniqueDays: 0, lastCheck: null };
    }

    const uniqueDays = new Set(checks.map(c => new Date(c).toDateString()));

    return {
      totalChecks: checks.length,
      uniqueDays: uniqueDays.size,
      lastCheck: checks[checks.length - 1],
    };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get pollutant display name
   */
  getPollutantName(pollutant: PollutantType): string {
    return POLLUTANT_NAMES[pollutant] || pollutant;
  }

  /**
   * Calculate distance between two coordinates (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
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
   * Clear all air quality cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const aqKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(aqKeys);
    } catch (error) {
      loggingService.error('Failed to clear AQ cache', { error });
    }
  }
}

// Export singleton instance
export const airQualityService = AirQualityService.getInstance();
export default AirQualityService;
