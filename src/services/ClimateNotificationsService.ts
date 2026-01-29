/**
 * Climate Notifications Service
 * Integrates climate data with notification service
 * Sends alerts for grid carbon, air quality, and optimal timing
 */

import {
  gridCarbonService,
  airQualityService,
  type GridCarbonIntensity,
  type AirQualityData,
} from './climate';

export interface ClimateNotificationConfig {
  // Grid carbon alerts
  gridCarbonAlerts: boolean;
  lowCarbonThreshold: number; // gCO2/kWh
  highCarbonThreshold: number;
  optimalWindowReminders: boolean;

  // Air quality alerts
  airQualityAlerts: boolean;
  unhealthyAQIThreshold: number; // AQI value

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export interface ClimateAlert {
  id: string;
  type: 'grid-low' | 'grid-high' | 'optimal-window' | 'air-quality';
  title: string;
  body: string;
  priority: 'high' | 'default' | 'low';
  data: Record<string, string>;
  timestamp: Date;
}

const DEFAULT_CONFIG: ClimateNotificationConfig = {
  gridCarbonAlerts: true,
  lowCarbonThreshold: 100,
  highCarbonThreshold: 400,
  optimalWindowReminders: true,
  airQualityAlerts: true,
  unhealthyAQIThreshold: 150,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

class ClimateNotificationsService {
  private config: ClimateNotificationConfig;
  private lastGridIntensity: GridCarbonIntensity | null = null;
  private lastAirQuality: AirQualityData | null = null;
  private notifiedOptimalWindows: Set<string> = new Set();

  constructor(config?: Partial<ClimateNotificationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if we're in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.config.quietHoursEnabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = this.config.quietHoursStart.split(':').map(Number);
    const [endH, endM] = this.config.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight quiet hours
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Generate grid carbon alerts based on current intensity
   */
  async checkGridCarbon(
    lat: number,
    lng: number,
  ): Promise<ClimateAlert | null> {
    if (!this.config.gridCarbonAlerts || this.isQuietHours()) return null;

    try {
      const zone =
        (await gridCarbonService.findZoneByLocation(lat, lng)) || 'US';
      const intensity = await gridCarbonService.getCurrentIntensity(zone);

      // Check for significant change from last check
      const lastValue = this.lastGridIntensity?.carbonIntensity;
      const currentValue = intensity.carbonIntensity;
      this.lastGridIntensity = intensity;

      // Low carbon opportunity
      if (
        currentValue < this.config.lowCarbonThreshold &&
        (!lastValue || lastValue >= this.config.lowCarbonThreshold)
      ) {
        return {
          id: `grid-low-${Date.now()}`,
          type: 'grid-low',
          title: '🌿 Low Carbon Grid Alert',
          body: `Grid is clean at ${currentValue} gCO₂/kWh. Great time to charge devices or run appliances!`,
          priority: 'default',
          data: {
            intensity: currentValue.toString(),
            zone: intensity.zoneName,
            renewable: intensity.renewablePercentage.toFixed(0),
          },
          timestamp: new Date(),
        };
      }

      // High carbon warning
      if (
        currentValue > this.config.highCarbonThreshold &&
        (!lastValue || lastValue <= this.config.highCarbonThreshold)
      ) {
        return {
          id: `grid-high-${Date.now()}`,
          type: 'grid-high',
          title: '⚡ High Carbon Grid Alert',
          body: `Grid is carbon-heavy at ${currentValue} gCO₂/kWh. Consider delaying non-essential electric use.`,
          priority: 'high',
          data: {
            intensity: currentValue.toString(),
            zone: intensity.zoneName,
            fossil: intensity.fossilFuelPercentage.toFixed(0),
          },
          timestamp: new Date(),
        };
      }

      return null;
    } catch {
      return null; // Fail silently
    }
  }

  /**
   * Check for optimal charging window and send reminder
   */
  async checkOptimalWindow(
    lat: number,
    lng: number,
  ): Promise<ClimateAlert | null> {
    if (!this.config.optimalWindowReminders || this.isQuietHours()) return null;

    try {
      const zone =
        (await gridCarbonService.findZoneByLocation(lat, lng)) || 'US';
      const window = await gridCarbonService.getOptimalWindow(zone);
      if (!window) return null;

      // Create unique key for this window
      const windowKey = `${window.start}-${window.end}`;
      if (this.notifiedOptimalWindows.has(windowKey)) return null;

      // Check if optimal window is starting soon (within 30 minutes)
      const windowStart = new Date(window.start);
      const now = new Date();
      const minutesUntilStart = (windowStart.getTime() - now.getTime()) / 60000;

      if (minutesUntilStart > 0 && minutesUntilStart <= 30) {
        this.notifiedOptimalWindows.add(windowKey);

        // Clean up old keys
        if (this.notifiedOptimalWindows.size > 10) {
          const oldest = this.notifiedOptimalWindows.values().next().value;
          if (oldest) this.notifiedOptimalWindows.delete(oldest);
        }

        return {
          id: `optimal-${Date.now()}`,
          type: 'optimal-window',
          title: '🔌 Optimal Charging Window',
          body: `${
            window.recommendation
          } Starting at ${windowStart.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}`,
          priority: 'default',
          data: {
            start: window.start,
            end: window.end,
            expectedIntensity: window.avgCarbonIntensity.toString(),
            savings: window.savings.vsNow.toString(),
          },
          timestamp: new Date(),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check air quality and send alerts
   */
  async checkAirQuality(
    lat: number,
    lng: number,
  ): Promise<ClimateAlert | null> {
    if (!this.config.airQualityAlerts || this.isQuietHours()) return null;

    try {
      const data = await airQualityService.getCurrentAirQuality(lat, lng);

      const lastAQI = this.lastAirQuality?.aqi.value;
      const currentAQI = data.aqi.value;
      this.lastAirQuality = data;

      // Alert when AQI becomes unhealthy
      if (
        currentAQI >= this.config.unhealthyAQIThreshold &&
        (!lastAQI || lastAQI < this.config.unhealthyAQIThreshold)
      ) {
        const category = data.aqi.category.replace(/-/g, ' ');
        return {
          id: `aqi-${Date.now()}`,
          type: 'air-quality',
          title: '🌬️ Air Quality Alert',
          body: `AQI is ${currentAQI} (${category}). Consider limiting outdoor activities.`,
          priority: 'high',
          data: {
            aqi: currentAQI.toString(),
            category: data.aqi.category,
            pollutant: data.aqi.dominantPollutant,
            location: data.location.name,
          },
          timestamp: new Date(),
        };
      }

      // Alert when AQI improves significantly
      if (
        lastAQI &&
        lastAQI >= this.config.unhealthyAQIThreshold &&
        currentAQI < this.config.unhealthyAQIThreshold - 20
      ) {
        return {
          id: `aqi-improved-${Date.now()}`,
          type: 'air-quality',
          title: '😊 Air Quality Improved',
          body: `AQI is now ${currentAQI}. Air quality is back to acceptable levels!`,
          priority: 'default',
          data: {
            aqi: currentAQI.toString(),
            category: data.aqi.category,
            location: data.location.name,
          },
          timestamp: new Date(),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Run all climate checks and return any alerts
   */
  async checkAll(lat: number, lng: number): Promise<ClimateAlert[]> {
    const alerts: ClimateAlert[] = [];

    const [gridAlert, windowAlert, airAlert] = await Promise.all([
      this.checkGridCarbon(lat, lng),
      this.checkOptimalWindow(lat, lng),
      this.checkAirQuality(lat, lng),
    ]);

    if (gridAlert) alerts.push(gridAlert);
    if (windowAlert) alerts.push(windowAlert);
    if (airAlert) alerts.push(airAlert);

    return alerts;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ClimateNotificationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): ClimateNotificationConfig {
    return { ...this.config };
  }

  /**
   * Reset cached data
   */
  reset(): void {
    this.lastGridIntensity = null;
    this.lastAirQuality = null;
    this.notifiedOptimalWindows.clear();
  }
}

// Singleton instance
let instance: ClimateNotificationsService | null = null;

export function getClimateNotifications(
  config?: Partial<ClimateNotificationConfig>,
): ClimateNotificationsService {
  if (!instance) {
    instance = new ClimateNotificationsService(config);
  } else if (config) {
    instance.updateConfig(config);
  }
  return instance;
}

export default ClimateNotificationsService;
