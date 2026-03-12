import { enhancedSecurityService } from '../EnhancedSecurityService';
import { notificationService } from '../NotificationService';
import { enhancedPerformanceService } from '../EnhancedPerformanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import LocationService from '../LocationService';

// Mock dependencies
jest.mock('expo-location', () => ({
  LocationAccuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  GeofencingEventType: {
    Enter: 1,
    Exit: 2,
  },
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  startGeofencingAsync: jest.fn(),
  stopGeofencingAsync: jest.fn(),
}));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../EnhancedPerformanceService', () => ({
  __esModule: true,
  enhancedPerformanceService: {
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    recordMetric: jest.fn(),
  },
}));
jest.mock('../EnhancedSecurityService', () => ({
  __esModule: true,
  enhancedSecurityService: {
    secureRetrieve: jest.fn(),
    secureStore: jest.fn(),
  },
}));
jest.mock('../NotificationService');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
  },
}));

const mockLocation = Location as any;
const mockTaskManager = TaskManager as any;
const mockAsyncStorage = AsyncStorage as any;
const mockPerformanceMonitoring = enhancedPerformanceService as any;
const mockSecurityService = enhancedSecurityService as any;
const mockNotificationService = notificationService as any;

const mockLocationObject: Location.LocationObject = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 10,
    accuracy: 5,
    altitudeAccuracy: 3,
    heading: 90,
    speed: 0,
  },
  timestamp: Date.now(),
};

const mockAddress: Location.LocationGeocodedAddress = {
  city: 'San Francisco',
  country: 'United States',
  district: null,
  isoCountryCode: 'US',
  name: '123 Main St',
  postalCode: '94102',
  region: 'California',
  street: 'Main St',
  streetNumber: '123',
  subregion: null,
  timezone: null,
};

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockPerformanceMonitoring.startTimer.mockReturnValue('timer-id');
    mockPerformanceMonitoring.endTimer.mockResolvedValue(undefined);
    mockPerformanceMonitoring.recordMetric.mockResolvedValue(undefined);

    mockSecurityService.secureRetrieve.mockResolvedValue(null);
    mockSecurityService.secureStore.mockResolvedValue(undefined);

    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });

    mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });

    mockLocation.getCurrentPositionAsync.mockResolvedValue(mockLocationObject);
    mockLocation.reverseGeocodeAsync.mockResolvedValue([mockAddress]);

    mockTaskManager.defineTask.mockImplementation(() => {});
  });

  afterEach(async () => {
    await LocationService.cleanup();
    (LocationService as any).isTracking = false;
    (LocationService as any).locationSubscription = null;
    (LocationService as any).geofenceRegions = [];
    (LocationService as any).placesOfInterest = [];
    (LocationService as any).locationHistory = [];
    (LocationService as any).metrics = {
      totalLocationUpdates: 0,
      backgroundLocationUpdates: 0,
      geofenceEvents: 0,
      averageAccuracy: 0,
      errorCount: 0,
    };
    (LocationService as any).config = {
      enableBackgroundLocation: false,
      enableLocationHistory: false,
      enableGeofencing: false,
      accuracy: 3, // Location.LocationAccuracy.Balanced
      maxLocationHistory: 50,
      privacyMode: 'precise',
      enableBatteryOptimization: true,
    };
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await LocationService.initialize();

      expect(LocationService.isServiceInitialized()).toBe(true);
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_service_init',
        expect.any(Number),
        'ms',
      );
    });

    it('should initialize with custom configuration', async () => {
      const customConfig = {
        enableBackgroundLocation: true,
        enableGeofencing: true,
        accuracy: Location.LocationAccuracy.High,
        maxLocationHistory: 500,
      };

      await LocationService.initialize(customConfig);

      const config = LocationService.getConfig();
      expect(config.enableBackgroundLocation).toBe(true);
      expect(config.enableGeofencing).toBe(true);
      expect(config.accuracy).toBe(Location.LocationAccuracy.High);
      expect(config.maxLocationHistory).toBe(500);
    });

    it('should load persisted data during initialization', async () => {
      const mockConfig = { enableLocationHistory: false };
      const mockHistory = [
        { id: '1', location: mockLocationObject.coords, timestamp: new Date() },
      ];

      mockSecurityService.secureRetrieve
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce(mockHistory);

      await LocationService.initialize();

      expect(mockSecurityService.secureRetrieve).toHaveBeenCalledWith(
        'location_service_config',
      );
      expect(mockSecurityService.secureRetrieve).toHaveBeenCalledWith(
        'location_service_history',
      );
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Permission denied');
      mockLocation.requestForegroundPermissionsAsync.mockRejectedValue(error);

      await expect(LocationService.initialize()).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('Permissions', () => {
    it('should request foreground permissions', async () => {
      const permissions = await LocationService.requestPermissions();

      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(permissions.foreground).toBe('granted');
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_permissions_request',
        expect.any(Number),
        'ms',
      );
    });

    it('should request background permissions when enabled', async () => {
      await LocationService.initialize({ enableBackgroundLocation: true });
      const permissions = await LocationService.requestPermissions();

      expect(mockLocation.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(permissions.background).toBe('granted');
    });

    it('should handle permission denial', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        expires: 'never',
        granted: false,
        canAskAgain: false,
      });

      const permissions = await LocationService.requestPermissions();

      expect(permissions.foreground).toBe('denied');
      expect(permissions.canAskAgain).toBe(false);
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_permissions_request',
        expect.any(Number),
        'ms',
      );
    });
  });

  describe('Location Tracking', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should get current location', async () => {
      const location = await LocationService.getCurrentLocation();

      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.LocationAccuracy.Balanced,
        maximumAge: 30000,
        timeout: 15000,
      });

      expect(location.latitude).toBe(37.7749);
      expect(location.longitude).toBe(-122.4194);
      expect(location.city).toBe('San Francisco');
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_retrieved',
        expect.any(Number),
        'ms',
      );
    });

    it('should get current location with high accuracy', async () => {
      await LocationService.getCurrentLocation(true);

      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.LocationAccuracy.BestForNavigation,
        maximumAge: 30000,
        timeout: 15000,
      });
    });

    it('should start location tracking', async () => {
      const mockSubscription = { remove: jest.fn() };
      mockLocation.watchPositionAsync.mockResolvedValue(
        mockSubscription as any,
      );

      await LocationService.startLocationTracking();

      expect(mockLocation.watchPositionAsync).toHaveBeenCalled();
      expect(LocationService.isLocationTrackingActive()).toBe(true);
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_tracking_started',
        1,
      );
    });

    it('should stop location tracking', async () => {
      const mockSubscription = { remove: jest.fn() };
      mockLocation.watchPositionAsync.mockResolvedValue(
        mockSubscription as any,
      );

      await LocationService.startLocationTracking();
      await LocationService.stopLocationTracking();

      expect(mockSubscription.remove).toHaveBeenCalled();
      expect(LocationService.isLocationTrackingActive()).toBe(false);
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_tracking_stopped',
        1,
      );
    });

    it('should handle location tracking errors', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      });

      await expect(LocationService.startLocationTracking()).rejects.toThrow(
        'Location permissions not granted',
      );
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_tracking_start_error',
        1,
      );
    });
  });

  describe('Background Location', () => {
    it('should setup background location when enabled', async () => {
      await LocationService.initialize({ enableBackgroundLocation: true });

      expect(mockLocation.startLocationUpdatesAsync).toHaveBeenCalledWith(
        'background-location-task',
        expect.objectContaining({
          accuracy: Location.LocationAccuracy.Balanced,
          foregroundService: expect.objectContaining({
            notificationTitle: 'Kindred is tracking your location',
          }),
        }),
      );
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'background_location_started',
        1,
      );
    });

    it('should handle background permission denial', async () => {
      mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      });

      // Should not throw, just log warning
      await LocationService.initialize({ enableBackgroundLocation: true });

      expect(mockLocation.startLocationUpdatesAsync).not.toHaveBeenCalled();
    });
  });

  describe('Geofencing', () => {
    beforeEach(async () => {
      await LocationService.initialize({ enableGeofencing: true });
    });

    it('should add geofence region', async () => {
      const region = {
        name: 'Home',
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 100,
        notifyOnEntry: true,
        notifyOnExit: true,
        enabled: true,
      };

      const regionId = await LocationService.addGeofenceRegion(region);

      expect(regionId).toBeDefined();
      expect(regionId).toMatch(/^geofence_/);

      const regions = LocationService.getGeofenceRegions();
      expect(regions).toHaveLength(1);
      expect(regions[0].name).toBe('Home');
    });

    it('should remove geofence region', async () => {
      const region = {
        name: 'Work',
        latitude: 37.7849,
        longitude: -122.4094,
        radius: 50,
        notifyOnEntry: true,
        notifyOnExit: false,
        enabled: true,
      };

      const regionId = await LocationService.addGeofenceRegion(region);
      await LocationService.removeGeofenceRegion(regionId);

      const regions = LocationService.getGeofenceRegions();
      expect(regions).toHaveLength(0);
    });

    it('should setup geofencing with existing regions', async () => {
      await LocationService.addGeofenceRegion({
        name: 'Test Region',
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 100,
        notifyOnEntry: true,
        notifyOnExit: true,
        enabled: true,
      });

      expect(mockLocation.startGeofencingAsync).toHaveBeenCalledWith(
        'geofence-task',
        expect.arrayContaining([
          expect.objectContaining({
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100,
          }),
        ]),
      );
    });
  });

  describe('Places of Interest', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should add place of interest', async () => {
      const place = {
        name: 'Favorite Coffee Shop',
        category: 'favorite' as const,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: Date.now(),
        },
        radius: 50,
      };

      const placeId = await LocationService.addPlaceOfInterest(place);

      expect(placeId).toBeDefined();
      expect(placeId).toMatch(/^place_/);

      const places = LocationService.getPlacesOfInterest();
      expect(places).toHaveLength(1);
      expect(places[0].name).toBe('Favorite Coffee Shop');
      expect(places[0].visitCount).toBe(0);
    });

    it('should remove place of interest', async () => {
      const place = {
        name: 'Old Place',
        category: 'custom' as const,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: Date.now(),
        },
        radius: 100,
      };

      const placeId = await LocationService.addPlaceOfInterest(place);
      await LocationService.removePlaceOfInterest(placeId);

      const places = LocationService.getPlacesOfInterest();
      expect(places).toHaveLength(0);
    });
  });

  describe('Location History', () => {
    beforeEach(async () => {
      await LocationService.initialize({ enableLocationHistory: true });
    });

    it('should maintain location history', async () => {
      await LocationService.getCurrentLocation();

      const history = LocationService.getLocationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].source).toBe('manual');
      expect(history[0].location.latitude).toBe(37.7749);
    });

    it('should limit history size', async () => {
      await LocationService.updateConfig({ maxLocationHistory: 2 });

      // Simulate multiple location updates
      for (let i = 0; i < 5; i++) {
        await LocationService.getCurrentLocation();
      }

      const history = LocationService.getLocationHistory();
      expect(history.length).toBeLessThanOrEqual(2);
    });

    it('should clear location history', async () => {
      await LocationService.getCurrentLocation();
      await LocationService.clearLocationHistory();

      const history = LocationService.getLocationHistory();
      expect(history).toHaveLength(0);
    });

    it('should get limited history', async () => {
      // Add multiple entries
      for (let i = 0; i < 5; i++) {
        const mockLocation = require('expo-location');
        mockLocation.getCurrentPositionAsync.mockResolvedValueOnce({
          ...mockLocationObject,
          coords: {
            ...mockLocationObject.coords,
            latitude: 37.7749 + i * 0.01,
          },
        });
        await LocationService.getCurrentLocation();
      }

      const limitedHistory = LocationService.getLocationHistory(3);
      expect(limitedHistory).toHaveLength(3);
    });
  });

  describe('Privacy Mode', () => {
    it('should apply approximate privacy mode', async () => {
      await LocationService.initialize({ privacyMode: 'approximate' });

      const location = await LocationService.getCurrentLocation();

      // Coordinates should be rounded
      expect(location.latitude).toBe(37.77); // Rounded to 2 decimal places
      expect(location.longitude).toBe(-122.42);
      expect(location.accuracy).toBeGreaterThanOrEqual(1000);
    });

    it('should skip reverse geocoding in disabled privacy mode', async () => {
      await LocationService.initialize({ privacyMode: 'disabled' });

      const location = await LocationService.getCurrentLocation();

      expect(mockLocation.reverseGeocodeAsync).not.toHaveBeenCalled();
      expect(location.address).toBeUndefined();
    });
  });

  describe('Location Listeners', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should add and notify location listeners', async () => {
      const listener = jest.fn();
      LocationService.addLocationListener('test-listener', listener);

      await LocationService.getCurrentLocation();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 37.7749,
          longitude: -122.4194,
        }),
      );
    });

    it('should remove location listeners', () => {
      const listener = jest.fn();
      LocationService.addLocationListener('test-listener', listener);
      LocationService.removeLocationListener('test-listener');

      // Listener should not be called after removal
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      LocationService.addLocationListener('faulty-listener', faultyListener);

      // Should not throw
      await expect(LocationService.getCurrentLocation()).resolves.toBeDefined();
    });
  });

  describe('Geofence Listeners', () => {
    beforeEach(async () => {
      await LocationService.initialize({ enableGeofencing: true });
    });

    it('should add and remove geofence listeners', () => {
      const listener = jest.fn();
      LocationService.addGeofenceListener('test-geofence-listener', listener);
      LocationService.removeGeofenceListener('test-geofence-listener');

      // Verify listener management
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should track location metrics', async () => {
      await LocationService.getCurrentLocation();

      const metrics = LocationService.getMetrics();
      expect(metrics.totalLocationUpdates).toBe(1);
      expect(metrics.lastUpdate).toBeDefined();
      expect(metrics.averageAccuracy).toBe(5); // From mock location
    });

    it('should reset metrics', async () => {
      await LocationService.getCurrentLocation();
      await LocationService.resetMetrics();

      const metrics = LocationService.getMetrics();
      expect(metrics.totalLocationUpdates).toBe(0);
      expect(metrics.averageAccuracy).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should update configuration', async () => {
      await LocationService.updateConfig({
        accuracy: Location.LocationAccuracy.High,
        timeInterval: 60000,
      });

      const config = LocationService.getConfig();
      expect(config.accuracy).toBe(Location.LocationAccuracy.High);
      expect(config.timeInterval).toBe(60000);
    });

    it('should restart background location when config changes', async () => {
      await LocationService.updateConfig({ enableBackgroundLocation: true });

      expect(mockLocation.startLocationUpdatesAsync).toHaveBeenCalled();
    });

    it('should stop background location when disabled', async () => {
      await LocationService.updateConfig({ enableBackgroundLocation: false });

      expect(mockLocation.stopLocationUpdatesAsync).toHaveBeenCalledWith(
        'background-location-task',
      );
    });
  });

  describe('Location Sharing', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should update sharing settings', async () => {
      const sharingSettings = {
        enabled: true,
        shareWith: ['user1', 'user2'],
        shareAccuracy: 'approximate' as const,
        shareFrequency: 30,
      };

      await LocationService.updateSharingSettings(sharingSettings);

      const settings = LocationService.getSharingSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.shareWith).toEqual(['user1', 'user2']);
      expect(settings.shareAccuracy).toBe('approximate');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should handle location retrieval errors', async () => {
      const error = new Error('Location unavailable');
      mockLocation.getCurrentPositionAsync.mockRejectedValue(error);

      await expect(LocationService.getCurrentLocation()).rejects.toThrow(
        'Location unavailable',
      );

      const metrics = LocationService.getMetrics();
      expect(metrics.errorCount).toBe(1);
      expect(metrics.lastError).toBe('Location unavailable');
    });

    it('should handle reverse geocoding errors gracefully', async () => {
      mockLocation.reverseGeocodeAsync.mockRejectedValue(
        new Error('Geocoding failed'),
      );

      const location = await LocationService.getCurrentLocation();

      // Should still return location data without address info
      expect(location.latitude).toBe(37.7749);
      expect(location.address).toBeUndefined();
    });
  });

  describe('Data Persistence', () => {
    it('should persist data after operations', async () => {
      await LocationService.initialize({ enableLocationHistory: true });
      await LocationService.getCurrentLocation();
      await LocationService.getCurrentLocation();

      expect(mockSecurityService.secureStore).toHaveBeenCalledWith(
        'location_service_history',
        expect.any(Array),
      );
    });

    it('should handle persistence errors gracefully', async () => {
      mockSecurityService.secureStore.mockRejectedValue(
        new Error('Storage error'),
      );

      await LocationService.initialize();

      // Should not throw, just log error
      await expect(LocationService.getCurrentLocation()).resolves.toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await LocationService.initialize({
        enableBackgroundLocation: true,
        enableGeofencing: true,
      });

      const mockSubscription = { remove: jest.fn() };
      mockLocation.watchPositionAsync.mockResolvedValue(
        mockSubscription as any,
      );
      await LocationService.startLocationTracking();

      await LocationService.cleanup();

      expect(mockLocation.stopLocationUpdatesAsync).toHaveBeenCalledWith(
        'background-location-task',
      );
      expect(mockLocation.stopGeofencingAsync).toHaveBeenCalledWith(
        'geofence-task',
      );
      expect(mockSubscription.remove).toHaveBeenCalled();
      expect(LocationService.isServiceInitialized()).toBe(false);
      expect(mockPerformanceMonitoring.recordMetric).toHaveBeenCalledWith(
        'location_service_cleanup',
        1,
      );
    });
  });

  describe('Distance Calculation', () => {
    beforeEach(async () => {
      await LocationService.initialize();
    });

    it('should calculate distance correctly for places of interest', async () => {
      // Add a place of interest
      await LocationService.addPlaceOfInterest({
        name: 'Nearby Place',
        category: 'favorite',
        location: {
          latitude: 37.7749, // Same as mock location
          longitude: -122.4194,
          timestamp: Date.now(),
        },
        radius: 100,
      });

      // Get current location (should trigger place of interest check)
      await LocationService.getCurrentLocation();

      const places = LocationService.getPlacesOfInterest();
      expect(places[0].visitCount).toBe(1);
      expect(places[0].lastVisit).toBeDefined();
    });
  });

  describe('Battery Optimization', () => {
    it('should use balanced accuracy when battery optimization is enabled', async () => {
      await LocationService.initialize({
        enableBackgroundLocation: true,
        enableBatteryOptimization: true,
        accuracy: Location.LocationAccuracy.High,
      });

      expect(mockLocation.startLocationUpdatesAsync).toHaveBeenCalledWith(
        'background-location-task',
        expect.objectContaining({
          accuracy: Location.LocationAccuracy.Balanced, // Should override High with Balanced
        }),
      );
    });

    it('should respect original accuracy when battery optimization is disabled', async () => {
      await LocationService.initialize({
        enableBackgroundLocation: true,
        enableBatteryOptimization: false,
        accuracy: Location.LocationAccuracy.High,
      });

      expect(mockLocation.startLocationUpdatesAsync).toHaveBeenCalledWith(
        'background-location-task',
        expect.objectContaining({
          accuracy: Location.LocationAccuracy.High,
        }),
      );
    });
  });
});
