import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { updateFootprint } from '../../store/slices/carbonSlice';
import { saveActivityData } from '../../utils/carbonCalculator';

interface EcoLocation {
  id: string;
  name: string;
  description: string;
  type: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

const LOCATION_TIMEOUT = 15000;
const LOCATION_MAX_AGE = 10000;
const LOCATION_UPDATE_INTERVAL = 10000;
const INITIAL_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen = () => {
  const [region, setRegion] = useState(INITIAL_REGION);
  const [userLocation, setUserLocation] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);
  const [ecoLocations, setEcoLocations] = useState<EcoLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [startLocation, setStartLocation] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const dispatch = useDispatch();

  const checkConnectivity = useCallback(async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setError('No internet connection');
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    const setupLocation = async () => {
      try {
        const hasPermission = await requestLocationPermission();
        if (hasPermission) {
          getCurrentLocation();
        }
      } catch (_error) {
        setError('Location permission denied');
      }
    };

    setupLocation();
    fetchEcoLocations();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const granted = await Geolocation.requestAuthorization();
      return granted === 'granted';
    } catch (error_) {
      console.error('Error requesting location permission:', error_);
      return false;
    }
  };

  const fetchEcoLocations = async () => {
    if (!(await checkConnectivity())) return;

    try {
      const snapshot = await firestore()
        .collection('eco_locations')
        .orderBy('type')
        .limit(50)
        .get();

      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EcoLocation[];

      setEcoLocations(locations);
    } catch (error) {
      console.error('Error fetching eco locations:', error);
      setError('Failed to load eco-friendly locations');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setRegion(prev => ({
          ...prev,
          latitude,
          longitude,
        }));

        // Animate map to user location
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        });

        setError(null);
      },
      error => {
        console.error(error);
        setError('Unable to get current location');
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: LOCATION_MAX_AGE,
      },
    );
  }, [region.latitudeDelta, region.longitudeDelta]);

  const startTrackingJourney = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Error', 'Please wait for location to be detected');
      return;
    }

    setIsTracking(true);
    setStartLocation(userLocation);

    // Start watching position
    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      error => {
        console.error(error);
        setError('Error tracking location');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: LOCATION_UPDATE_INTERVAL,
      },
    );
  }, [userLocation]);

  const stopTrackingJourney = useCallback(async () => {
    if (!startLocation || !userLocation) return;

    // Clear watch
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const distance = calculateDistance(
      startLocation.latitude,
      startLocation.longitude,
      userLocation.latitude,
      userLocation.longitude,
    );

    try {
      // Update carbon footprint with the journey
      const transportImpact = distance * 0.404; // kg CO2 per mile for car
      await saveActivityData({
        distance,
        vehicleType: 'car',
        type: 'transportation',
        impact: transportImpact,
      });
      dispatch(updateFootprint({ transportation: transportImpact }));

      Alert.alert(
        'Journey Complete',
        `Distance: ${distance.toFixed(
          2,
        )} miles\nCarbon Impact: ${transportImpact.toFixed(2)} kg CO2`,
      );
    } catch (error_) {
      console.error('Error saving journey:', error_);
      setError('Failed to save journey data');
    } finally {
      setIsTracking(false);
      setStartLocation(null);
    }
  }, [startLocation, userLocation, dispatch]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 0.621371; // Convert to miles
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {ecoLocations.map(location => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.name}
            description={location.description}
            pinColor={
              location.type === 'recycling'
                ? 'green'
                : location.type === 'charging'
                  ? 'blue'
                  : 'red'
            }
          />
        ))}
      </MapView>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>Get Current Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trackingButton, isTracking ? styles.trackingActiveButton : null]}
          onPress={isTracking ? stopTrackingJourney : startTrackingJourney}
        >
          <Text style={styles.buttonText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingActiveButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default MapScreen;
