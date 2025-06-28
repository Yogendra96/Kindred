import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
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
}

interface PlaceOfInterest {
  id: string;
  name: string;
  category: 'home' | 'work' | 'favorite' | 'custom';
  location: LocationData;
  radius: number;
  visitCount: number;
  lastVisit?: number;
}

interface LocationHistory {
  id: string;
  location: LocationData;
  timestamp: number;
  source: 'foreground' | 'background' | 'manual';
}

interface LocationState {
  currentLocation: LocationData | null;
  isTracking: boolean;
  isBackgroundTracking: boolean;
  permissionsGranted: {
    foreground: boolean;
    background: boolean;
  };
  history: LocationHistory[];
  geofenceRegions: GeofenceRegion[];
  placesOfInterest: PlaceOfInterest[];
  settings: {
    enableLocationHistory: boolean;
    enableBackgroundLocation: boolean;
    enableGeofencing: boolean;
    accuracy: 'low' | 'balanced' | 'high' | 'best';
    distanceInterval: number;
    timeInterval: number;
    maxHistoryEntries: number;
    privacyMode: 'full' | 'approximate' | 'disabled';
  };
  sharing: {
    enabled: boolean;
    shareWith: string[];
    shareAccuracy: 'exact' | 'approximate' | 'city';
    shareFrequency: number;
    expiresAt?: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
  isBackgroundTracking: false,
  permissionsGranted: {
    foreground: false,
    background: false,
  },
  history: [],
  geofenceRegions: [],
  placesOfInterest: [],
  settings: {
    enableLocationHistory: true,
    enableBackgroundLocation: false,
    enableGeofencing: false,
    accuracy: 'balanced',
    distanceInterval: 10,
    timeInterval: 30000,
    maxHistoryEntries: 1000,
    privacyMode: 'full',
  },
  sharing: {
    enabled: false,
    shareWith: [],
    shareAccuracy: 'approximate',
    shareFrequency: 15,
  },
  isLoading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateCurrentLocation: (state, action: PayloadAction<LocationData>) => {
      state.currentLocation = action.payload;
      state.error = null;
    },
    setTrackingStatus: (
      state,
      action: PayloadAction<{ foreground: boolean; background: boolean }>,
    ) => {
      state.isTracking = action.payload.foreground;
      state.isBackgroundTracking = action.payload.background;
    },
    setPermissions: (
      state,
      action: PayloadAction<{ foreground: boolean; background: boolean }>,
    ) => {
      state.permissionsGranted = action.payload;
    },
    addLocationHistory: (state, action: PayloadAction<LocationHistory>) => {
      if (!state.settings.enableLocationHistory) return;

      state.history.unshift(action.payload);

      // Keep only the specified number of entries
      if (state.history.length > state.settings.maxHistoryEntries) {
        state.history = state.history.slice(
          0,
          state.settings.maxHistoryEntries,
        );
      }
    },
    clearLocationHistory: state => {
      state.history = [];
    },
    addGeofenceRegion: (state, action: PayloadAction<GeofenceRegion>) => {
      state.geofenceRegions.push(action.payload);
    },
    updateGeofenceRegion: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<GeofenceRegion> }>,
    ) => {
      const index = state.geofenceRegions.findIndex(
        region => region.id === action.payload.id,
      );
      if (index !== -1) {
        state.geofenceRegions[index] = {
          ...state.geofenceRegions[index],
          ...action.payload.updates,
        };
      }
    },
    removeGeofenceRegion: (state, action: PayloadAction<string>) => {
      state.geofenceRegions = state.geofenceRegions.filter(
        region => region.id !== action.payload,
      );
    },
    addPlaceOfInterest: (state, action: PayloadAction<PlaceOfInterest>) => {
      state.placesOfInterest.push(action.payload);
    },
    updatePlaceOfInterest: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<PlaceOfInterest> }>,
    ) => {
      const index = state.placesOfInterest.findIndex(
        place => place.id === action.payload.id,
      );
      if (index !== -1) {
        state.placesOfInterest[index] = {
          ...state.placesOfInterest[index],
          ...action.payload.updates,
        };
      }
    },
    removePlaceOfInterest: (state, action: PayloadAction<string>) => {
      state.placesOfInterest = state.placesOfInterest.filter(
        place => place.id !== action.payload,
      );
    },
    incrementPlaceVisit: (
      state,
      action: PayloadAction<{ id: string; timestamp: number }>,
    ) => {
      const place = state.placesOfInterest.find(
        p => p.id === action.payload.id,
      );
      if (place) {
        place.visitCount++;
        place.lastVisit = action.payload.timestamp;
      }
    },
    updateLocationSettings: (
      state,
      action: PayloadAction<Partial<LocationState['settings']>>,
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    updateSharingSettings: (
      state,
      action: PayloadAction<Partial<LocationState['sharing']>>,
    ) => {
      state.sharing = { ...state.sharing, ...action.payload };
    },
    resetLocationState: state => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setLoading,
  setError,
  updateCurrentLocation,
  setTrackingStatus,
  setPermissions,
  addLocationHistory,
  clearLocationHistory,
  addGeofenceRegion,
  updateGeofenceRegion,
  removeGeofenceRegion,
  addPlaceOfInterest,
  updatePlaceOfInterest,
  removePlaceOfInterest,
  incrementPlaceVisit,
  updateLocationSettings,
  updateSharingSettings,
  resetLocationState,
} = locationSlice.actions;

export default locationSlice.reducer;
