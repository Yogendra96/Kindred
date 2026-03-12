/**
 * useClimateData Hook
 * Unified hook for accessing climate data across the app
 * Integrates with location services and caches data appropriately
 */

import { useState, useEffect, useCallback } from 'react';
import {
  climateTraceService,
  globalContextService,
  gridCarbonService,
  airQualityService,
  unifiedClimateService,
  type NearbyEmitter,
  type UserGlobalContext,
  type GridCarbonIntensity,
  type OptimalWindow,
  type AirQualityData,
} from '../services/climate';
import logger from '../services/LoggerService';
import { ErrorHandler } from '../utils/errorHandler';

// Convert NearbyEmitter to display format
import type { EmissionSourceDisplay } from '../components/climate';

interface ClimateDataState {
  // Global Context
  globalContext: UserGlobalContext | null;
  globalContextLoading: boolean;
  globalContextError: string | null;

  // Nearby Emissions
  nearbyEmitters: EmissionSourceDisplay[];
  nearbyEmittersLoading: boolean;
  nearbyEmittersError: string | null;

  // Grid Carbon
  gridIntensity: GridCarbonIntensity | null;
  optimalWindow: OptimalWindow | null;
  gridLoading: boolean;
  gridError: string | null;

  // Air Quality
  airQuality: AirQualityData | null;
  airQualityLoading: boolean;
  airQualityError: string | null;
}

interface ClimateDataActions {
  refreshGlobalContext: (
    userFootprint: number,
    country: string,
  ) => Promise<void>;
  refreshNearbyEmitters: (
    lat: number,
    lng: number,
    country: string,
    radiusKm?: number,
  ) => Promise<void>;
  refreshGridCarbon: (lat: number, lng: number) => Promise<void>;
  refreshAirQuality: (lat: number, lng: number) => Promise<void>;
  refreshAll: (
    lat: number,
    lng: number,
    userFootprint: number,
    country: string,
  ) => Promise<void>;
}

interface UseClimateDataOptions {
  autoRefreshInterval?: number; // ms, 0 to disable
}

const DEFAULT_OPTIONS: UseClimateDataOptions = {
  autoRefreshInterval: 0, // Disabled by default
};

/**
 * Converts NearbyEmitter to UI-friendly EmissionSourceDisplay
 */
function toDisplayFormat(emitter: NearbyEmitter): EmissionSourceDisplay {
  return {
    id: emitter.id,
    name: emitter.name,
    sector: emitter.sector,
    emissions: emitter.emissions,
    country: emitter.country,
    distance: emitter.distance,
    coordinates: [emitter.coordinates.longitude, emitter.coordinates.latitude],
  };
}

export function useClimateData(
  options: UseClimateDataOptions = {},
): ClimateDataState & ClimateDataActions {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<ClimateDataState>({
    globalContext: null,
    globalContextLoading: false,
    globalContextError: null,
    nearbyEmitters: [],
    nearbyEmittersLoading: false,
    nearbyEmittersError: null,
    gridIntensity: null,
    optimalWindow: null,
    gridLoading: false,
    gridError: null,
    airQuality: null,
    airQualityLoading: false,
    airQualityError: null,
  });

  // Track last location for auto-refresh
  const [lastLocation, setLastLocation] = useState<{
    lat: number;
    lng: number;
    country: string;
  } | null>(null);

  // Refresh global context
  const refreshGlobalContext = useCallback(
    async (userFootprint: number, country: string) => {
      const log = logger.withTag('useClimateData:globalContext');
      const stopPerf = log.perf('fetchGlobalContext');
      setState(prev => ({
        ...prev,
        globalContextLoading: true,
        globalContextError: null,
      }));
      try {
        const context = await globalContextService.getUserGlobalContext(
          userFootprint,
          country,
        );
        setState(prev => ({
          ...prev,
          globalContext: context,
          globalContextLoading: false,
        }));
        log.info('Global context fetched successfully');
      } catch (err) {
        const handledError = ErrorHandler.handle(
          err,
          'useClimateData:globalContext',
        );
        setState(prev => ({
          ...prev,
          globalContextLoading: false,
          globalContextError: handledError.message,
        }));
      } finally {
        stopPerf();
      }
    },
    [],
  );

  // Refresh nearby emitters
  const refreshNearbyEmitters = useCallback(
    async (lat: number, lng: number, country: string, radiusKm = 50) => {
      const log = logger.withTag('useClimateData:nearbyEmitters');
      const stopPerf = log.perf('fetchNearbyEmitters');
      setState(prev => ({
        ...prev,
        nearbyEmittersLoading: true,
        nearbyEmittersError: null,
      }));
      try {
        const sources = await climateTraceService.getNearbyEmitters(
          lat,
          lng,
          radiusKm,
          country,
        );
        const displaySources = sources.map(s => toDisplayFormat(s));
        setState(prev => ({
          ...prev,
          nearbyEmitters: displaySources.sort(
            (a, b) => a.distance - b.distance,
          ),
          nearbyEmittersLoading: false,
        }));
        log.info('Nearby emitters fetched successfully', {
          count: displaySources.length,
        });
      } catch (err) {
        const handledError = ErrorHandler.handle(
          err,
          'useClimateData:nearbyEmitters',
        );
        setState(prev => ({
          ...prev,
          nearbyEmittersLoading: false,
          nearbyEmittersError: handledError.message,
        }));
      } finally {
        stopPerf();
      }
    },
    [],
  );

  // Refresh grid carbon
  const refreshGridCarbon = useCallback(async (lat: number, lng: number) => {
    const log = logger.withTag('useClimateData:gridCarbon');
    const stopPerf = log.perf('fetchGridCarbon');
    setState(prev => ({ ...prev, gridLoading: true, gridError: null }));
    try {
      // First find the zone for the location
      const zone = await gridCarbonService.findZoneByLocation(lat, lng);
      const zoneId = zone || 'US'; // Fallback to US

      const [intensity, window] = await Promise.all([
        gridCarbonService.getCurrentIntensity(zoneId),
        gridCarbonService.getOptimalWindow(zoneId),
      ]);
      setState(prev => ({
        ...prev,
        gridIntensity: intensity,
        optimalWindow: window,
        gridLoading: false,
      }));
      log.info('Grid carbon data fetched successfully');
    } catch (err) {
      const handledError = ErrorHandler.handle(
        err,
        'useClimateData:gridCarbon',
      );
      setState(prev => ({
        ...prev,
        gridLoading: false,
        gridError: handledError.message,
      }));
    } finally {
      stopPerf();
    }
  }, []);

  // Refresh air quality
  const refreshAirQuality = useCallback(async (lat: number, lng: number) => {
    const log = logger.withTag('useClimateData:airQuality');
    const stopPerf = log.perf('fetchAirQuality');
    setState(prev => ({
      ...prev,
      airQualityLoading: true,
      airQualityError: null,
    }));
    try {
      const data = await airQualityService.getCurrentAirQuality(lat, lng);
      setState(prev => ({
        ...prev,
        airQuality: data,
        airQualityLoading: false,
      }));
      log.info('Air quality fetched successfully');
    } catch (err) {
      const handledError = ErrorHandler.handle(
        err,
        'useClimateData:airQuality',
      );
      setState(prev => ({
        ...prev,
        airQualityLoading: false,
        airQualityError: handledError.message,
      }));
    } finally {
      stopPerf();
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(
    async (
      lat: number,
      lng: number,
      userFootprint: number,
      country: string,
    ) => {
      setLastLocation({ lat, lng, country });
      await Promise.all([
        refreshGlobalContext(userFootprint, country),
        refreshNearbyEmitters(lat, lng, country),
        refreshGridCarbon(lat, lng),
        refreshAirQuality(lat, lng),
      ]);
    },
    [
      refreshGlobalContext,
      refreshNearbyEmitters,
      refreshGridCarbon,
      refreshAirQuality,
    ],
  );

  // Auto-refresh interval
  useEffect(() => {
    if (!opts.autoRefreshInterval || opts.autoRefreshInterval <= 0) return;
    if (!lastLocation) return;

    const interval = setInterval(() => {
      // Only refresh grid carbon and air quality (time-sensitive data)
      refreshGridCarbon(lastLocation.lat, lastLocation.lng);
      refreshAirQuality(lastLocation.lat, lastLocation.lng);
    }, opts.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [
    opts.autoRefreshInterval,
    lastLocation,
    refreshGridCarbon,
    refreshAirQuality,
  ]);

  return {
    ...state,
    refreshGlobalContext,
    refreshNearbyEmitters,
    refreshGridCarbon,
    refreshAirQuality,
    refreshAll,
  };
}

/**
 * Lightweight hook for just grid carbon intensity
 * Use when you only need grid status (e.g., for smart device scheduling)
 */
export function useGridCarbon(lat: number, lng: number, autoRefresh = false) {
  const [intensity, setIntensity] = useState<GridCarbonIntensity | null>(null);
  const [optimalWindow, setOptimalWindow] = useState<OptimalWindow | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!lat || !lng) return;
    const log = logger.withTag('useGridCarbon');
    const stopPerf = log.perf('fetchGridCarbonData');
    setLoading(true);
    setError(null);
    try {
      const zone = await gridCarbonService.findZoneByLocation(lat, lng);
      const zoneId = zone || 'US';
      const [intensityData, windowData] = await Promise.all([
        gridCarbonService.getCurrentIntensity(zoneId),
        gridCarbonService.getOptimalWindow(zoneId),
      ]);
      setIntensity(intensityData);
      setOptimalWindow(windowData);
      log.info('Grid carbon fetched successfully');
    } catch (err) {
      const handledError = ErrorHandler.handle(err, 'useGridCarbon');
      setError(handledError.message);
    } finally {
      stopPerf();
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 15 * 60 * 1000); // 15 min
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  return { intensity, optimalWindow, loading, error, refresh };
}

/**
 * Hook for air quality with automatic location-based updates
 */
export function useAirQuality(lat: number, lng: number) {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!lat || !lng) return;
    const log = logger.withTag('useAirQualityHook');
    const stopPerf = log.perf('fetchAirQualityData');
    setLoading(true);
    setError(null);
    try {
      const airData = await airQualityService.getCurrentAirQuality(lat, lng);
      setData(airData);
      log.info('Air quality hooked fetched successfully');
    } catch (err) {
      const handledError = ErrorHandler.handle(err, 'useAirQualityHook');
      setError(handledError.message);
    } finally {
      stopPerf();
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

/**
 * Hook for unified climate intelligence
 * Provides combined insights from all climate data sources
 */
export function useClimateIntelligence(
  lat: number,
  lng: number,
  countryCode: string,
  _userFootprint: number,
) {
  const [insights, setInsights] = useState<{
    carbonIntensityGood: boolean;
    airQualityGood: boolean;
    nearbyMajorEmitters: number;
    bestChargingTime: string | null;
    overallRecommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!lat || !lng) return;
      const log = logger.withTag('useClimateIntelligence');
      const stopPerf = log.perf('fetchIntelligence');
      setLoading(true);
      try {
        const summary = await unifiedClimateService.getQuickSummary(
          lat,
          lng,
          countryCode,
        );
        const zone =
          (await gridCarbonService.findZoneByLocation(lat, lng)) || countryCode;
        const optimalWindow = await gridCarbonService.getOptimalWindow(zone);

        const carbonIntensityGood = summary.gridStatus === 'clean';
        const airQualityGood = summary.airStatus === 'good';

        setInsights({
          carbonIntensityGood,
          airQualityGood,
          nearbyMajorEmitters: summary.nearbyEmitterCount,
          bestChargingTime: optimalWindow
            ? new Date(optimalWindow.start).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : null,
          overallRecommendation: summary.recommendation,
        });
        log.info('Climate intelligence fetched successfully');
      } catch (err) {
        ErrorHandler.handle(err, 'useClimateIntelligence');
        // Non-critical, fail silently in UI
      } finally {
        stopPerf();
        setLoading(false);
      }
    };

    fetchInsights();
  }, [lat, lng, countryCode]);

  return { insights, loading };
}

export default useClimateData;
