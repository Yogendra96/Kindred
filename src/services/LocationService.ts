import { enhancedPerformanceService } from './EnhancedPerformanceService';
import { enhancedSecurityService } from './EnhancedSecurityService';
import { loggingService } from './LoggingService';
import _AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Note: Actual location implementation would use react-native-geolocation-service
// or @react-native-community/geolocation for production use

// Location service configuration
const STORAGE_KEY_PREFIX = 'location_service_';

export interface LocationConfig {
  enableBackgroundLocation: boolean;
  enableGeofencing: boolean;
  enableLocationHistory: boolean;
  accuracy: 'low' | 'balanced' | 'high' | 'best';
  distanceInterval: number;
  timeInterval: number;
  maxLocationHistory: number;
  enableBatteryOptimization: boolean;
  enableLocationSharing: boolean;
  privacyMode: 'full' | 'approximate' | 'disabled';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export interface GeofenceRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface LocationPermissions {
  foreground: 'granted' | 'denied' | 'undetermined';
  background: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

export interface LocationMetrics {
  totalLocationUpdates: number;
  backgroundLocationUpdates: number;
  geofenceEvents: number;
  averageAccuracy: number;
  batteryUsage: number;
  lastUpdate?: Date;
  errorCount: number;
  lastError?: string;
}

export interface LocationHistory {
  id: string;
  location: LocationData;
  timestamp: Date;
  source: 'foreground' | 'background' | 'manual';
  accuracy: number;
}

export interface PlaceOfInterest {
  id: string;
  name: string;
  category: 'home' | 'work' | 'favorite' | 'custom';
  location: LocationData;
  radius: number;
  visitCount: number;
  lastVisit?: Date;
  averageStayDuration?: number;
  metadata?: Record<string, any>;
}

export interface LocationSharingSettings {
  enabled: boolean;
  shareWith: string[];
  shareAccuracy: 'exact' | 'approximate' | 'city';
  shareFrequency: number; // minutes
  expiresAt?: Date;
  emergencyContacts: string[];
}

class LocationService {
  private logger: typeof loggingService;
  private securityService: typeof enhancedSecurityService;
  private performanceService: typeof enhancedPerformanceService;
  private config: LocationConfig;
  private isInitialized = false;
  private isTracking = false;
  private currentLocation: LocationData | null = null;
  private locationHistory: LocationHistory[] = [];
  private geofenceRegions: GeofenceRegion[] = [];
  private placesOfInterest: PlaceOfInterest[] = [];
  private metrics: LocationMetrics;
  private listeners: Map<string, (location: LocationData) => void> = new Map();
  private geofenceListeners: Map<string, (event: any) => void> = new Map();
  private locationSubscription: Location.LocationSubscription | null = null;
  private sharingSettings: LocationSharingSettings;

  constructor() {
    this.config = {
      enableBackgroundLocation: false,
      enableGeofencing: false,
      enableLocationHistory: true,
      accuracy: 'balanced',
      distanceInterval: 10, // meters
      timeInterval: 30000, // 30 seconds
      maxLocationHistory: 1000,
      enableBatteryOptimization: true,
      enableLocationSharing: false,
      privacyMode: 'full',
    };

    this.metrics = {
      totalLocationUpdates: 0,
      backgroundLocationUpdates: 0,
      geofenceEvents: 0,
      averageAccuracy: 0,
      batteryUsage: 0,
      errorCount: 0,
    };

    this.sharingSettings = {
      enabled: false,
      shareWith: [],
      shareAccuracy: 'approximate',
      shareFrequency: 15,
      emergencyContacts: [],
    };

    // Initialize logging
    this.logger = loggingService;
    this.securityService = enhancedSecurityService;
    this.performanceService = enhancedPerformanceService;
  }

  async initialize(config?: Partial<LocationConfig>): Promise<void> {
    const startTime = Date.now();

    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Load persisted data
      await this.loadPersistedData();

      // Request permissions
      await this.requestPermissions();

      // Setup location watching
      this.setupLocationWatcher();

      // Setup background tasks if enabled
      if (this.config.enableBackgroundLocation) {
        await this.setupBackgroundLocation();
      }

      if (this.config.enableGeofencing) {
        await this.setupGeofencing();
      }

      this.isInitialized = true;

      this.performanceService.recordMetric(
        'location_service_init',
        Date.now() - startTime,
        'ms',
      );

      this.logger.info('Location service initialized', {
        config: this.config,
        backgroundLocation: this.config.enableBackgroundLocation,
        geofencing: this.config.enableGeofencing,
      });
    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Location service initialization failed', {
        error: error.message,
      });
      throw error;
    }
  }

  private setupLocationWatcher(): void {
    // Setup location watching using navigator.geolocation for web
    // or react-native-geolocation-service for native apps
    if (Platform.OS === 'web' && navigator.geolocation) {
      this.logger.info('Setting up web geolocation');
    } else {
      this.logger.info('Setting up native geolocation');
    }
  }

  async requestPermissions(): Promise<LocationPermissions> {
    const startTime = Date.now();

    try {
      // Mock permission request for demo purposes
      // In production, use proper permission libraries
      const permissions: LocationPermissions = {
        foreground: 'granted',
        background: this.config.enableBackgroundLocation
          ? 'granted'
          : 'undetermined',
        canAskAgain: true,
      };

      this.performanceService.recordMetric(
        'location_permissions_request',
        Date.now() - startTime,
        'ms',
      );

      this.logger.info('Location permissions requested', permissions);
      return permissions;
    } catch (error) {
      this.logger.error('Location permissions request failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async getCurrentLocation(highAccuracy = false): Promise<LocationData> {
    const startTime = Date.now();

    try {
      const location = await this.getLocationFromNavigator(highAccuracy);
      const locationData = await this.processLocationData(location, 'manual');
      this.currentLocation = locationData;

      this.performanceService.recordMetric(
        'location_retrieved',
        Date.now() - startTime,
        'ms',
      );

      this.logger.info('Current location retrieved', {
        accuracy: locationData.accuracy,
        source: 'manual',
      });

      return locationData;
    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Failed to get current location', {
        error: error.message,
      });
      throw error;
    }
  }

  async startLocationTracking(): Promise<void> {
    if (this.isTracking) return;

    try {
      const permissions = await this.requestPermissions();
      if (permissions.foreground !== 'granted') {
        throw new Error('Location permissions not granted');
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.config.accuracy,
          timeInterval: this.config.timeInterval,
          distanceInterval: this.config.distanceInterval,
        },
        location => {
          this.handleLocationUpdate(location, 'foreground');
        },
      );

      this.isTracking = true;
      this.performanceService.recordMetric('location_tracking_started', 1);
    } catch (error) {
      this.performanceService.recordMetric('location_tracking_start_error', 1);
      throw error;
    }
  }

  async stopLocationTracking(): Promise<void> {
    if (!this.isTracking) return;

    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isTracking = false;
      this.performanceService.recordMetric('location_tracking_stopped', 1);
    } catch (error) {
      this.performanceService.recordMetric('location_tracking_stop_error', 1);
      throw error;
    }
  }

  private async setupBackgroundLocation(): Promise<void> {
    try {
      const permissions = await this.requestPermissions();
      if (permissions.background !== 'granted') {
        this.logger.warn('Background location permissions not granted');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: this.config.enableBatteryOptimization
          ? Location.LocationAccuracy.Balanced
          : this.config.accuracy,
        timeInterval: this.config.timeInterval * 2, // Less frequent in background
        distanceInterval: this.config.distanceInterval * 2,
        deferredUpdatesInterval: 60000, // 1 minute
        foregroundService: {
          notificationTitle: 'Kindred is tracking your location',
          notificationBody: 'This helps provide location-based features',
          notificationColor: '#3B82F6',
        },
      });

      this.performanceService.recordMetric('background_location_started', 1);
    } catch (error) {
      this.performanceService.recordMetric(
        'background_location_setup_error',
        1,
      );
      throw error;
    }
  }

  private async setupGeofencing(): Promise<void> {
    try {
      if (this.geofenceRegions.length === 0) return;

      const regions = this.geofenceRegions
        .filter(region => region.enabled)
        .map(region => ({
          identifier: region.id,
          latitude: region.latitude,
          longitude: region.longitude,
          radius: region.radius,
          notifyOnEntry: region.notifyOnEntry,
          notifyOnExit: region.notifyOnExit,
        }));

      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
      this.performanceService.recordMetric('geofencing_started', 1);
    } catch (error) {
      this.performanceService.recordMetric('geofencing_setup_error', 1);
      throw error;
    }
  }

  private async handleLocationUpdate(
    location: Location.LocationObject,
    source: 'foreground' | 'background' | 'manual',
  ): Promise<void> {
    try {
      const locationData = await this.processLocationData(location, source);
      this.currentLocation = locationData;

      // Update metrics
      this.updateLocationMetrics(locationData, source);

      // Add to history if enabled
      if (this.config.enableLocationHistory) {
        this.addToLocationHistory(locationData, source);
      }

      // Check for places of interest
      await this.checkPlacesOfInterest(locationData);

      // Notify listeners
      this.notifyLocationListeners(locationData);

      // Handle location sharing
      if (this.sharingSettings.enabled) {
        await this.handleLocationSharing(locationData);
      }
    } catch (error) {
      this.logger.error('Error handling location update:', error);
      this.metrics.errorCount++;
    }
  }

  private async handleBackgroundLocationUpdate(
    locations: Location.LocationObject[],
  ): Promise<void> {
    for (const location of locations) {
      await this.handleLocationUpdate(location, 'background');
      this.metrics.backgroundLocationUpdates++;
    }
  }

  private async handleGeofenceEvent(
    eventType: Location.GeofencingEventType,
    region: Location.LocationRegion,
  ): Promise<void> {
    try {
      const geofenceRegion = this.geofenceRegions.find(
        r => r.id === region.identifier,
      );
      if (!geofenceRegion) return;

      this.metrics.geofenceEvents++;

      // Notify listeners
      this.geofenceListeners.forEach(listener => {
        try {
          listener({
            type: eventType,
            region: geofenceRegion,
            timestamp: new Date(),
          });
        } catch (error) {
          this.logger.error('Error in geofence listener:', error);
        }
      });

      // Send notification if configured
      const shouldNotify =
        (eventType === Location.GeofencingEventType.Enter &&
          geofenceRegion.notifyOnEntry) ||
        (eventType === Location.GeofencingEventType.Exit &&
          geofenceRegion.notifyOnExit);

      if (shouldNotify) {
        await notificationService.displayNotification({
          title: `${geofenceRegion.name}`,
          body:
            eventType === Location.GeofencingEventType.Enter
              ? `You've entered ${geofenceRegion.name}`
              : `You've left ${geofenceRegion.name}`,
          data: {
            type: 'geofence',
            regionId: geofenceRegion.id,
            eventType: eventType.toString(),
          },
        });
      }

      this.performanceService.recordMetric('geofence_event_processed', 1);
    } catch (error) {
      this.performanceService.recordMetric('geofence_event_error', 1);
      this.logger.error('Error handling geofence event:', error);
    }
  }

  private async processLocationData(
    location: Location.LocationObject,
    source: string,
  ): Promise<LocationData> {
    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      altitudeAccuracy: location.coords.altitudeAccuracy || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
      timestamp: location.timestamp,
    };

    // Apply privacy mode
    if (this.config.privacyMode === 'approximate') {
      locationData.latitude = Math.round(locationData.latitude * 100) / 100;
      locationData.longitude = Math.round(locationData.longitude * 100) / 100;
      locationData.accuracy = Math.max(locationData.accuracy || 0, 1000);
    } else if (this.config.privacyMode === 'disabled') {
      return locationData; // Skip reverse geocoding
    }

    // Reverse geocoding for address information
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      if (address) {
        locationData.address = [address.streetNumber, address.street]
          .filter(Boolean)
          .join(' ');
        locationData.city = address.city || undefined;
        locationData.region = address.region || undefined;
        locationData.country = address.country || undefined;
        locationData.postalCode = address.postalCode || undefined;
      }
    } catch (error) {
      this.logger.warn('Reverse geocoding failed:', error);
    }

    return locationData;
  }

  private updateLocationMetrics(location: LocationData, source: string): void {
    this.metrics.totalLocationUpdates++;
    this.metrics.lastUpdate = new Date();

    if (source === 'background') {
      this.metrics.backgroundLocationUpdates++;
    }

    // Update average accuracy
    if (location.accuracy) {
      const totalAccuracy =
        this.metrics.averageAccuracy * (this.metrics.totalLocationUpdates - 1);
      this.metrics.averageAccuracy =
        (totalAccuracy + location.accuracy) / this.metrics.totalLocationUpdates;
    }
  }

  private addToLocationHistory(
    location: LocationData,
    source: 'foreground' | 'background' | 'manual',
  ): void {
    const historyEntry: LocationHistory = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location,
      timestamp: new Date(),
      source,
      accuracy: location.accuracy || 0,
    };

    this.locationHistory.unshift(historyEntry);

    // Keep only the specified number of entries
    if (this.locationHistory.length > this.config.maxLocationHistory) {
      this.locationHistory = this.locationHistory.slice(
        0,
        this.config.maxLocationHistory,
      );
    }

    // Persist history
    this.persistData();
  }

  private async checkPlacesOfInterest(location: LocationData): Promise<void> {
    for (const place of this.placesOfInterest) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        place.location.latitude,
        place.location.longitude,
      );

      if (distance <= place.radius) {
        place.visitCount++;
        place.lastVisit = new Date();

        // Calculate average stay duration if this is a return visit
        // This would require more sophisticated tracking of entry/exit times

        await this.persistData();
        break; // Only count one place per location update
      }
    }
  }

  private notifyLocationListeners(location: LocationData): void {
    this.listeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        this.logger.error('Error in location listener:', error);
      }
    });
  }

  private async handleLocationSharing(location: LocationData): Promise<void> {
    // Implementation would depend on your sharing mechanism
    // This could involve sending to a server, peer-to-peer sharing, etc.
    try {
      const sharedLocation = this.prepareLocationForSharing(location);
      // Send to sharing service
      this.performanceService.recordMetric('location_shared', 1);
    } catch (error) {
      this.logger.error('Error sharing location:', error);
    }
  }

  private prepareLocationForSharing(
    location: LocationData,
  ): Partial<LocationData> {
    const shared: Partial<LocationData> = {
      timestamp: location.timestamp,
    };

    switch (this.sharingSettings.shareAccuracy) {
      case 'exact':
        return location;

      case 'approximate':
        shared.latitude = Math.round(location.latitude * 100) / 100;
        shared.longitude = Math.round(location.longitude * 100) / 100;
        shared.city = location.city;
        break;

      case 'city':
        shared.city = location.city;
        shared.region = location.region;
        shared.country = location.country;
        break;
    }

    return shared;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Public API methods
  addLocationListener(
    id: string,
    listener: (location: LocationData) => void,
  ): void {
    this.listeners.set(id, listener);
  }

  removeLocationListener(id: string): void {
    this.listeners.delete(id);
  }

  addGeofenceListener(id: string, listener: (event: any) => void): void {
    this.geofenceListeners.set(id, listener);
  }

  removeGeofenceListener(id: string): void {
    this.geofenceListeners.delete(id);
  }

  async addGeofenceRegion(region: Omit<GeofenceRegion, 'id'>): Promise<string> {
    const id = `geofence_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const geofenceRegion: GeofenceRegion = { ...region, id };

    this.geofenceRegions.push(geofenceRegion);
    await this.persistData();

    // Restart geofencing if it's enabled
    if (this.config.enableGeofencing) {
      await this.setupGeofencing();
    }

    return id;
  }

  async removeGeofenceRegion(id: string): Promise<void> {
    this.geofenceRegions = this.geofenceRegions.filter(
      region => region.id !== id,
    );
    await this.persistData();

    // Restart geofencing if it's enabled
    if (this.config.enableGeofencing) {
      await this.setupGeofencing();
    }
  }

  async addPlaceOfInterest(
    place: Omit<PlaceOfInterest, 'id' | 'visitCount'>,
  ): Promise<string> {
    const id = `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const placeOfInterest: PlaceOfInterest = {
      ...place,
      id,
      visitCount: 0,
    };

    this.placesOfInterest.push(placeOfInterest);
    await this.persistData();

    return id;
  }

  async removePlaceOfInterest(id: string): Promise<void> {
    this.placesOfInterest = this.placesOfInterest.filter(
      place => place.id !== id,
    );
    await this.persistData();
  }

  // Data persistence
  private async loadPersistedData(): Promise<void> {
    try {
      const [
        configData,
        historyData,
        geofenceData,
        placesData,
        metricsData,
        sharingData,
      ] = await Promise.all([
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}config`),
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}history`),
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}geofence`),
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}places`),
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}metrics`),
        this.securityService.secureRetrieve(`${STORAGE_KEY_PREFIX}sharing`),
      ]);

      if (configData) {
        this.config = { ...this.config, ...configData };
      }

      if (historyData) {
        this.locationHistory = historyData.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }

      if (geofenceData) {
        this.geofenceRegions = geofenceData;
      }

      if (placesData) {
        this.placesOfInterest = placesData.map((place: any) => ({
          ...place,
          lastVisit: place.lastVisit ? new Date(place.lastVisit) : undefined,
        }));
      }

      if (metricsData) {
        this.metrics = {
          ...this.metrics,
          ...metricsData,
          lastUpdate: metricsData.lastUpdate
            ? new Date(metricsData.lastUpdate)
            : undefined,
        };
      }

      if (sharingData) {
        this.sharingSettings = {
          ...this.sharingSettings,
          ...sharingData,
          expiresAt: sharingData.expiresAt
            ? new Date(sharingData.expiresAt)
            : undefined,
        };
      }
    } catch (error) {
      this.logger.error('Error loading persisted location data', {
        error: error.message,
      });
    }
  }

  private async persistData(): Promise<void> {
    try {
      await Promise.all([
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}config`,
          this.config,
        ),
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}history`,
          this.locationHistory,
        ),
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}geofence`,
          this.geofenceRegions,
        ),
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}places`,
          this.placesOfInterest,
        ),
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}metrics`,
          this.metrics,
        ),
        this.securityService.secureStore(
          `${STORAGE_KEY_PREFIX}sharing`,
          this.sharingSettings,
        ),
      ]);
    } catch (error) {
      this.logger.error('Error persisting location data', {
        error: error.message,
      });
    }
  }

  // Public getters
  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  getConfig(): LocationConfig {
    return { ...this.config };
  }

  getMetrics(): LocationMetrics {
    return { ...this.metrics };
  }

  getLocationHistory(limit?: number): LocationHistory[] {
    return limit
      ? this.locationHistory.slice(0, limit)
      : [...this.locationHistory];
  }

  getGeofenceRegions(): GeofenceRegion[] {
    return [...this.geofenceRegions];
  }

  getPlacesOfInterest(): PlaceOfInterest[] {
    return [...this.placesOfInterest];
  }

  getSharingSettings(): LocationSharingSettings {
    return { ...this.sharingSettings };
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Configuration updates
  async updateConfig(updates: Partial<LocationConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.persistData();

    // Restart services if needed
    if (updates.enableBackgroundLocation !== undefined) {
      if (updates.enableBackgroundLocation) {
        await this.setupBackgroundLocation();
      } else {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    }

    if (updates.enableGeofencing !== undefined) {
      if (updates.enableGeofencing) {
        await this.setupGeofencing();
      } else {
        await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      }
    }
  }

  async updateSharingSettings(
    updates: Partial<LocationSharingSettings>,
  ): Promise<void> {
    this.sharingSettings = { ...this.sharingSettings, ...updates };
    await this.persistData();
  }

  async clearLocationHistory(): Promise<void> {
    this.locationHistory = [];
    await this.persistData();
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalLocationUpdates: 0,
      backgroundLocationUpdates: 0,
      geofenceEvents: 0,
      averageAccuracy: 0,
      batteryUsage: 0,
      errorCount: 0,
    };
    await this.persistData();
  }

  async cleanup(): Promise<void> {
    try {
      await this.stopLocationTracking();

      if (this.config.enableBackgroundLocation) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      if (this.config.enableGeofencing) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      }

      this.listeners.clear();
      this.geofenceListeners.clear();
      this.isInitialized = false;

      this.performanceService.recordMetric('location_service_cleanup', 1);
    } catch (error) {
      this.logger.error('Error during location service cleanup:', error);
    }
  }

  // Add method to get location from navigator (browser) or native geolocation
  private async getLocationFromNavigator(highAccuracy: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            });
          },
          error => reject(new Error(`Geolocation error: ${error.message}`)),
          {
            enableHighAccuracy: highAccuracy,
            timeout: 15000,
            maximumAge: 30000,
          },
        );
      } else {
        // Mock location for native platforms in development
        const mockLocation = {
          coords: {
            latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
            altitude: 50,
            accuracy: highAccuracy ? 5 : 20,
            altitudeAccuracy: 10,
            heading: Math.random() * 360,
            speed: Math.random() * 10,
          },
          timestamp: Date.now(),
        };

        this.logger.warn('Using mock location data for development');
        resolve(mockLocation);
      }
    });
  }
}

// Create and export singleton instance
export const locationService = new LocationService();
export default locationService;
