import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

// Type definitions for LocationService demo
interface LocationData {
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

interface LocationConfig {
  enableBackgroundLocation: boolean;
  enableGeofencing: boolean;
  enableLocationHistory: boolean;
  accuracy: number;
  distanceInterval: number;
  timeInterval: number;
  maxLocationHistory: number;
  enableBatteryOptimization: boolean;
  enableLocationSharing: boolean;
  privacyMode: 'full' | 'approximate' | 'disabled';
}

interface GeofenceRegion {
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

interface PlaceOfInterest {
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

// Mock Location for Storybook
const mockLocation = {
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
};

// Mock LocationService for Storybook
const createMockLocationService = () => {
  let isInitialized = false;
  let isTracking = false;
  let currentLocation: LocationData | null = null;
  let config: LocationConfig = {
    enableBackgroundLocation: false,
    enableGeofencing: false,
    enableLocationHistory: true,
    accuracy: mockLocation.LocationAccuracy.Balanced,
    distanceInterval: 10,
    timeInterval: 30000,
    maxLocationHistory: 1000,
    enableBatteryOptimization: true,
    enableLocationSharing: false,
    privacyMode: 'full',
  };
  let metrics = {
    totalLocationUpdates: 0,
    backgroundLocationUpdates: 0,
    geofenceEvents: 0,
    averageAccuracy: 0,
    batteryUsage: 0,
    errorCount: 0,
  };
  let geofenceRegions: GeofenceRegion[] = [];
  let placesOfInterest: PlaceOfInterest[] = [];
  let locationHistory: any[] = [];
  const listeners = new Map();

  return {
    async initialize(newConfig?: Partial<LocationConfig>) {
      if (newConfig) config = { ...config, ...newConfig };
      isInitialized = true;
      return Promise.resolve();
    },

    async getCurrentLocation(): Promise<LocationData> {
      const mockLocation: LocationData = {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        altitude: 10 + Math.random() * 20,
        accuracy: 5 + Math.random() * 10,
        heading: Math.random() * 360,
        speed: Math.random() * 5,
        timestamp: Date.now(),
        address: '123 Main St',
        city: 'San Francisco',
        region: 'California',
        country: 'United States',
        postalCode: '94102',
      };
      currentLocation = mockLocation;
      metrics.totalLocationUpdates++;
      metrics.averageAccuracy =
        (metrics.averageAccuracy + mockLocation.accuracy!) / 2;

      // Notify listeners
      listeners.forEach(listener => listener(mockLocation));

      return mockLocation;
    },

    async startLocationTracking() {
      isTracking = true;
      // Simulate periodic updates
      const interval = setInterval(async () => {
        if (isTracking) {
          await this.getCurrentLocation();
        } else {
          clearInterval(interval);
        }
      }, 2000);
    },

    async stopLocationTracking() {
      isTracking = false;
    },

    async addGeofenceRegion(
      region: Omit<GeofenceRegion, 'id'>,
    ): Promise<string> {
      const id = `geofence_${Date.now()}`;
      geofenceRegions.push({ ...region, id });
      return id;
    },

    async removeGeofenceRegion(id: string) {
      geofenceRegions = geofenceRegions.filter(r => r.id !== id);
    },

    async addPlaceOfInterest(
      place: Omit<PlaceOfInterest, 'id' | 'visitCount'>,
    ): Promise<string> {
      const id = `place_${Date.now()}`;
      placesOfInterest.push({ ...place, id, visitCount: 0 });
      return id;
    },

    async removePlaceOfInterest(id: string) {
      placesOfInterest = placesOfInterest.filter(p => p.id !== id);
    },

    addLocationListener(
      id: string,
      listener: (location: LocationData) => void,
    ) {
      listeners.set(id, listener);
    },

    removeLocationListener(id: string) {
      listeners.delete(id);
    },

    getCurrentLocationData: () => currentLocation,
    getConfig: () => ({ ...config }),
    getMetrics: () => ({ ...metrics }),
    getLocationHistory: () => [...locationHistory],
    getGeofenceRegions: () => [...geofenceRegions],
    getPlacesOfInterest: () => [...placesOfInterest],
    isLocationTrackingActive: () => isTracking,
    isServiceInitialized: () => isInitialized,

    async updateConfig(updates: Partial<LocationConfig>) {
      config = { ...config, ...updates };
    },

    async clearLocationHistory() {
      locationHistory = [];
    },

    async resetMetrics() {
      metrics = {
        totalLocationUpdates: 0,
        backgroundLocationUpdates: 0,
        geofenceEvents: 0,
        averageAccuracy: 0,
        batteryUsage: 0,
        errorCount: 0,
      };
    },
  };
};

interface LocationServiceDemoProps {
  title: string;
  description: string;
  initialConfig?: Partial<LocationConfig>;
  showGeofencing?: boolean;
  showPlaces?: boolean;
  showMetrics?: boolean;
  autoStart?: boolean;
}

const LocationServiceDemo: React.FC<LocationServiceDemoProps> = ({
  title,
  description,
  initialConfig = {},
  showGeofencing = false,
  showPlaces = false,
  showMetrics = true,
  autoStart = false,
}) => {
  const [locationService] = useState(() => createMockLocationService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [config, setConfig] = useState<LocationConfig | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [geofenceRegions, setGeofenceRegions] = useState<GeofenceRegion[]>([]);
  const [placesOfInterest, setPlacesOfInterest] = useState<PlaceOfInterest[]>(
    [],
  );
  const [status, setStatus] = useState('Not initialized');

  useEffect(() => {
    const initializeService = async () => {
      try {
        await locationService.initialize(initialConfig);
        setIsInitialized(true);
        setConfig(locationService.getConfig());
        setMetrics(locationService.getMetrics());
        setStatus('Initialized');

        if (autoStart) {
          await handleStartTracking();
        }
      } catch (error) {
        setStatus(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    };

    initializeService();

    // Add location listener
    locationService.addLocationListener('demo', location => {
      setCurrentLocation(location);
      setMetrics(locationService.getMetrics());
    });

    return () => {
      locationService.removeLocationListener('demo');
    };
  }, []);

  const handleStartTracking = async () => {
    try {
      await locationService.startLocationTracking();
      setIsTracking(true);
      setStatus('Tracking active');
    } catch (error) {
      setStatus(
        `Tracking error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const handleStopTracking = async () => {
    try {
      await locationService.stopLocationTracking();
      setIsTracking(false);
      setStatus('Tracking stopped');
    } catch (error) {
      setStatus(
        `Stop error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setMetrics(locationService.getMetrics());
      setStatus('Location retrieved');
    } catch (error) {
      setStatus(
        `Location error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const handleAddGeofence = async () => {
    try {
      const regionId = await locationService.addGeofenceRegion({
        name: `Region ${geofenceRegions.length + 1}`,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        radius: 100 + Math.random() * 200,
        notifyOnEntry: true,
        notifyOnExit: true,
        enabled: true,
      });
      setGeofenceRegions(locationService.getGeofenceRegions());
      setStatus(`Added geofence: ${regionId}`);
    } catch (error) {
      setStatus(
        `Geofence error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const handleAddPlace = async () => {
    try {
      const placeId = await locationService.addPlaceOfInterest({
        name: `Place ${placesOfInterest.length + 1}`,
        category: 'favorite',
        location: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now(),
        },
        radius: 50 + Math.random() * 100,
      });
      setPlacesOfInterest(locationService.getPlacesOfInterest());
      setStatus(`Added place: ${placeId}`);
    } catch (error) {
      setStatus(
        `Place error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const handleConfigChange = async (key: keyof LocationConfig, value: any) => {
    try {
      await locationService.updateConfig({ [key]: value });
      setConfig(locationService.getConfig());
      setStatus(`Updated ${key}`);
    } catch (error) {
      setStatus(
        `Config error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.status}>Status: {status}</Text>
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, isTracking && styles.buttonActive]}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
            disabled={!isInitialized}
          >
            <Text style={styles.buttonText}>
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetCurrentLocation}
            disabled={!isInitialized}
          >
            <Text style={styles.buttonText}>Get Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Location */}
      {currentLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>
              📍 {currentLocation.latitude.toFixed(6)},{' '}
              {currentLocation.longitude.toFixed(6)}
            </Text>
            {currentLocation.address && (
              <Text style={styles.locationText}>
                🏠 {currentLocation.address}
              </Text>
            )}
            {currentLocation.city && (
              <Text style={styles.locationText}>
                🏙️ {currentLocation.city}, {currentLocation.region}
              </Text>
            )}
            <Text style={styles.locationText}>
              🎯 Accuracy: {currentLocation.accuracy?.toFixed(1)}m
            </Text>
            {currentLocation.speed !== undefined && (
              <Text style={styles.locationText}>
                🚀 Speed: {(currentLocation.speed * 3.6).toFixed(1)} km/h
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Configuration */}
      {config && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Background Location</Text>
              <Switch
                value={config.enableBackgroundLocation}
                onValueChange={value =>
                  handleConfigChange('enableBackgroundLocation', value)
                }
              />
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Geofencing</Text>
              <Switch
                value={config.enableGeofencing}
                onValueChange={value =>
                  handleConfigChange('enableGeofencing', value)
                }
              />
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Location History</Text>
              <Switch
                value={config.enableLocationHistory}
                onValueChange={value =>
                  handleConfigChange('enableLocationHistory', value)
                }
              />
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Battery Optimization</Text>
              <Switch
                value={config.enableBatteryOptimization}
                onValueChange={value =>
                  handleConfigChange('enableBatteryOptimization', value)
                }
              />
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Privacy Mode</Text>
              <Text style={styles.configValue}>{config.privacyMode}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Metrics */}
      {showMetrics && metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Updates</Text>
              <Text style={styles.metricValue}>
                {metrics.totalLocationUpdates}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Background Updates</Text>
              <Text style={styles.metricValue}>
                {metrics.backgroundLocationUpdates}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Geofence Events</Text>
              <Text style={styles.metricValue}>{metrics.geofenceEvents}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Accuracy</Text>
              <Text style={styles.metricValue}>
                {metrics.averageAccuracy.toFixed(1)}m
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Error Count</Text>
              <Text style={styles.metricValue}>{metrics.errorCount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Geofencing */}
      {showGeofencing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geofencing</Text>
          <TouchableOpacity style={styles.button} onPress={handleAddGeofence}>
            <Text style={styles.buttonText}>Add Geofence Region</Text>
          </TouchableOpacity>
          {geofenceRegions.map(region => (
            <View key={region.id} style={styles.regionCard}>
              <Text style={styles.regionName}>{region.name}</Text>
              <Text style={styles.regionDetails}>
                📍 {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
              </Text>
              <Text style={styles.regionDetails}>
                🔄 Radius: {region.radius}m
              </Text>
              <Text style={styles.regionDetails}>
                🔔 Entry: {region.notifyOnEntry ? '✅' : '❌'} | Exit:{' '}
                {region.notifyOnExit ? '✅' : '❌'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Places of Interest */}
      {showPlaces && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Places of Interest</Text>
          <TouchableOpacity style={styles.button} onPress={handleAddPlace}>
            <Text style={styles.buttonText}>Add Place of Interest</Text>
          </TouchableOpacity>
          {placesOfInterest.map(place => (
            <View key={place.id} style={styles.placeCard}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeDetails}>
                📂 Category: {place.category}
              </Text>
              <Text style={styles.placeDetails}>
                📍 {place.location.latitude.toFixed(4)},{' '}
                {place.location.longitude.toFixed(4)}
              </Text>
              <Text style={styles.placeDetails}>
                🔄 Radius: {place.radius}m
              </Text>
              <Text style={styles.placeDetails}>
                👥 Visits: {place.visitCount}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  configCard: {
    gap: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 16,
    color: '#333',
  },
  configValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  metricsCard: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  regionCard: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  regionDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  placeCard: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  placeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

// Export the demo component for use in development
export default LocationServiceDemo;

// Export different configurations for testing
export const HighAccuracyDemo = () => (
  <LocationServiceDemo
    title='High Accuracy Tracking'
    description='Location service configured for maximum accuracy'
    initialConfig={{
      enableBackgroundLocation: true,
      enableGeofencing: true,
      enableLocationHistory: true,
      accuracy: mockLocation.LocationAccuracy.Highest,
      distanceInterval: 1,
      timeInterval: 1000,
      maxLocationHistory: 1000,
      enableBatteryOptimization: false,
      enableLocationSharing: true,
      privacyMode: 'full' as const,
    }}
    autoStart={true}
    showMetrics={true}
  />
);

export const BatteryOptimizedDemo = () => (
  <LocationServiceDemo
    title='Battery Optimized'
    description='Location service optimized for battery conservation'
    initialConfig={{
      enableBackgroundLocation: false,
      enableGeofencing: false,
      enableLocationHistory: true,
      accuracy: mockLocation.LocationAccuracy.Low,
      distanceInterval: 100,
      timeInterval: 30000,
      maxLocationHistory: 100,
      enableBatteryOptimization: true,
      enableLocationSharing: false,
      privacyMode: 'approximate' as const,
    }}
    showMetrics={true}
  />
);

export const GeofencingDemo = () => (
  <LocationServiceDemo
    title='Geofencing Demo'
    description='Focused on geofencing capabilities and region management'
    initialConfig={{
      enableGeofencing: true,
    }}
    showGeofencing={true}
    showMetrics={true}
  />
);

export const PlacesOfInterestDemo = () => (
  <LocationServiceDemo
    title='Places of Interest'
    description='Manage and track favorite places and locations'
    showPlaces={true}
    showMetrics={true}
  />
);

export const FullFeaturesDemo = () => (
  <LocationServiceDemo
    title='Full Features Demo'
    description='Complete location service with all features enabled'
    initialConfig={{
      enableBackgroundLocation: true,
      enableGeofencing: true,
      enableLocationHistory: true,
      enableLocationSharing: true,
    }}
    showGeofencing={true}
    showPlaces={true}
    showMetrics={true}
  />
);
