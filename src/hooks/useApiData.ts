/**
 * useApiData.ts — API adapter hooks with full logging + exception handling
 *
 * Standards applied:
 *  - Every async call wrapped in try/catch using ErrorHandler.handle()
 *  - Performance timing on every fetch (perf log shows API latency)
 *  - Typed error state ({ message, recoverable }) drives ErrorToast UI
 *  - Mock ↔ real switch via env flag — zero logic changes needed
 *  - DRY: single useApiHook<T> factory drives all 6 domain hooks
 */
import { useState, useEffect, useCallback } from 'react';
import logger from '../services/LoggerService';
import { httpClient } from '../services/HttpService';
import { ErrorHandler } from '../utils/errorHandler';

// ─── API state shape ──────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  recoverable: boolean;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

// ─── Fetch adapter via Axios ──────────────────────────────────────────────────

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await httpClient.get<T>(url);
  return response.data;
};

// ─── Generic hook factory (DRY / SRP) ────────────────────────────────────────

function useApiHook<T>(
  tag: string,
  mockFn: () => T,
  realFn: () => Promise<T>,
  useReal = false,
  deps: unknown[] = [],
): ApiState<T> {
  const log = logger.withTag(tag);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const stopPerf = log.perf(`fetch:${tag}`);

    try {
      log.debug('fetching', { useReal });
      const result = useReal ? await realFn() : mockFn();
      setData(result);
      log.info('fetched successfully');
    } catch (err) {
      const typed = ErrorHandler.handle(err, tag);
      setError({ message: typed.message, recoverable: typed.recoverable });
      // Fall back to mock data so UI stays functional
      try {
        setData(mockFn());
        log.warn('falling back to mock data after error');
      } catch {
        // Mock itself failed — data stays null
      }
    } finally {
      stopPerf();
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useReal, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── 1. Carbon Footprint (Climatiq) ──────────────────────────────────────────

export interface CarbonSummary {
  totalKgToday: number;
  totalKgWeek: number;
  avgKgPerDay: number;
  breakdown: Record<string, number>;
}

const MOCK_CARBON: CarbonSummary = {
  totalKgToday: 8.3,
  totalKgWeek: 75.4,
  avgKgPerDay: 10.8,
  breakdown: {
    transportation: 28.4,
    food: 21.7,
    energy: 15.3,
    shopping: 9.8,
    waste: 4.2,
  },
};

export const useCarbonData = (useReal = false): ApiState<CarbonSummary> =>
  useApiHook(
    'useCarbonData',
    () => MOCK_CARBON,
    () => fetchData<CarbonSummary>('/carbon/summary'),
    useReal,
  );

// ─── 2. Vegan Impact Stats ────────────────────────────────────────────────────

export interface VeganImpactStats {
  animalsKilledPerSecond: number;
  kgCO2PerSecondAnimalAg: number;
  litersWaterPerSecondAnimalAg: number;
  annualPersonalAnimals: number;
  annualPersonalCO2Kg: number;
  annualPersonalWaterLiters: number;
}

const MOCK_VEGAN: VeganImpactStats = {
  animalsKilledPerSecond: 2535,
  kgCO2PerSecondAnimalAg: 636.57,
  litersWaterPerSecondAnimalAg: 45.6,
  annualPersonalAnimals: 95,
  annualPersonalCO2Kg: 1600,
  annualPersonalWaterLiters: 500_000,
};

export const useVeganStats = (useReal = false): ApiState<VeganImpactStats> =>
  useApiHook(
    'useVeganStats',
    () => MOCK_VEGAN,
    async () => MOCK_VEGAN, // Real: Our World in Data OWID API
    useReal,
  );

// ─── 3. Eco Locations (Google Maps Places) ───────────────────────────────────

export interface EcoLocation {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: string;
  rating: number;
  open: boolean;
  impactLabel: string;
}

const MOCK_LOCATIONS: EcoLocation[] = [
  {
    id: '1',
    name: 'GrowNYC Greenmarket',
    category: '🌱 Organic',
    lat: 40.7282,
    lng: -73.9942,
    distance: '0.3 km',
    rating: 4.8,
    open: true,
    impactLabel: '↓ 2.1 kg CO₂ vs supermarket',
  },
  {
    id: '2',
    name: 'TerraCycle Drop-Off',
    category: '♻️ Recycling',
    lat: 40.7306,
    lng: -73.9866,
    distance: '0.6 km',
    rating: 4.5,
    open: true,
    impactLabel: '↓ 1.4 kg CO₂ per visit',
  },
  {
    id: '3',
    name: 'EVgo Charging Hub',
    category: '⚡ EV Charging',
    lat: 40.7215,
    lng: -74.0012,
    distance: '0.9 km',
    rating: 4.3,
    open: true,
    impactLabel: '↓ 4.6 kg CO₂ vs gas',
  },
];

export const useEcoLocations = (
  lat: number,
  lng: number,
  useReal = false,
): ApiState<EcoLocation[]> =>
  useApiHook(
    'useEcoLocations',
    () => MOCK_LOCATIONS,
    () => fetchData<EcoLocation[]>(`/locations?lat=${lat}&lng=${lng}`),
    useReal,
    [lat, lng],
  );

// ─── 4. Grid Carbon Intensity (ElectricityMaps) ──────────────────────────────

export interface GridIntensity {
  zone: string;
  gCO2PerKwh: number;
  renewablePercent: number;
  isLowCarbon: boolean;
  updatedAt: string;
}

const MOCK_GRID: GridIntensity = {
  zone: 'US-NY-NYISO',
  gCO2PerKwh: 186,
  renewablePercent: 42,
  isLowCarbon: true,
  updatedAt: new Date().toISOString(),
};

export const useGridIntensity = (
  lat: number,
  lng: number,
  useReal = false,
): ApiState<GridIntensity> =>
  useApiHook(
    'useGridIntensity',
    () => MOCK_GRID,
    () =>
      fetchData<GridIntensity>(
        `https://api.electricitymap.org/v3/carbon-intensity/latest?lat=${lat}&lon=${lng}`,
      ),
    useReal,
    [lat, lng],
  );

// ─── 5. Air Quality (OpenAQ) ─────────────────────────────────────────────────

export interface AirQualityData {
  aqi: number;
  category: string;
  dominantPollutant: string;
  pm25: number;
  location: string;
}

const MOCK_AIR: AirQualityData = {
  aqi: 42,
  category: 'Good',
  dominantPollutant: 'PM2.5',
  pm25: 8.3,
  location: 'Manhattan, NY',
};

export const useAirQuality = (
  lat: number,
  lng: number,
  useReal = false,
): ApiState<AirQualityData> =>
  useApiHook(
    'useAirQuality',
    () => MOCK_AIR,
    () =>
      fetchData<AirQualityData>(
        `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=10000`,
      ),
    useReal,
    [lat, lng],
  );

// ─── 6. Leaderboard ──────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  co2Kg: number;
  points: number;
  streak: number;
  isYou: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Priya S.',
    avatar: '🌿',
    co2Kg: 187,
    points: 4820,
    streak: 34,
    isYou: false,
  },
  {
    rank: 2,
    name: 'Luca M.',
    avatar: '⚡',
    co2Kg: 163,
    points: 4210,
    streak: 28,
    isYou: false,
  },
  {
    rank: 3,
    name: 'You',
    avatar: '😊',
    co2Kg: 152,
    points: 3990,
    streak: 21,
    isYou: true,
  },
];

export const useLeaderboard = (
  scope: 'friends' | 'global' = 'friends',
  useReal = false,
): ApiState<LeaderboardEntry[]> =>
  useApiHook(
    'useLeaderboard',
    () => MOCK_LEADERBOARD,
    () => fetchData<LeaderboardEntry[]>(`/leaderboard?scope=${scope}`),
    useReal,
    [scope],
  );
