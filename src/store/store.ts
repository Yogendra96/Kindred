/**
 * Modern Zustand Store - Replaces Redux
 * Ultra-simple state management with persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedDate: string;
}

export interface CarbonFootprint {
  total: number;
  transportation: number;
  food: number;
  energy: number;
  waste: number;
  target: number;
  lastUpdated: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  units: 'metric' | 'imperial';
  language: string;
}

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // Carbon state
  footprint: CarbonFootprint;
  carbonHistory: Array<{ date: string; value: number }>;

  // Settings state
  settings: Settings;

  // App state
  isLoading: boolean;
  error: string | null;

  // Actions - User
  setUser: (user: User) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;

  // Actions - Carbon
  updateFootprint: (updates: Partial<CarbonFootprint>) => void;
  addCarbonActivity: (
    category: keyof Omit<CarbonFootprint, 'total' | 'target' | 'lastUpdated'>,
    amount: number,
  ) => void;
  resetDailyFootprint: () => void;

  // Actions - Settings
  updateSettings: (updates: Partial<Settings>) => void;
  toggleTheme: () => void;

  // Actions - App
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Initial state
const initialFootprint: CarbonFootprint = {
  total: 0,
  transportation: 0,
  food: 0,
  energy: 0,
  waste: 0,
  target: 8.0,
  lastUpdated: new Date().toISOString(),
};

const initialSettings: Settings = {
  theme: 'light',
  notifications: true,
  units: 'metric',
  language: 'en',
};

// Create the store
export const useAppStore = create<AppState>()(
  persist(
    immer(set => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      footprint: initialFootprint,
      carbonHistory: [],
      settings: initialSettings,
      isLoading: false,
      error: null,

      // User actions
      setUser: user =>
        set(state => {
          state.user = user;
          state.isAuthenticated = true;
        }),

      logout: () =>
        set(state => {
          state.user = null;
          state.isAuthenticated = false;
          state.footprint = initialFootprint;
          state.carbonHistory = [];
        }),

      updateUserProfile: updates =>
        set(state => {
          if (state.user) {
            state.user = { ...state.user, ...updates };
          }
        }),

      // Carbon actions
      updateFootprint: updates =>
        set(state => {
          state.footprint = {
            ...state.footprint,
            ...updates,
            lastUpdated: new Date().toISOString(),
          };

          // Recalculate total
          const { transportation, food, energy, waste } = state.footprint;
          state.footprint.total = transportation + food + energy + waste;
        }),

      addCarbonActivity: (category, amount) =>
        set(state => {
          state.footprint[category] += amount;
          state.footprint.total += amount;
          state.footprint.lastUpdated = new Date().toISOString();

          // Add to history
          state.carbonHistory.push({
            date: new Date().toISOString(),
            value: state.footprint.total,
          });
        }),

      resetDailyFootprint: () =>
        set(state => {
          // Save current total to history before reset
          state.carbonHistory.push({
            date: new Date().toISOString(),
            value: state.footprint.total,
          });

          // Reset to zero
          state.footprint = {
            ...initialFootprint,
            target: state.footprint.target, // Keep the same target
            lastUpdated: new Date().toISOString(),
          };
        }),

      // Settings actions
      updateSettings: updates =>
        set(state => {
          state.settings = { ...state.settings, ...updates };
        }),

      toggleTheme: () =>
        set(state => {
          const themes: Array<'light' | 'dark' | 'auto'> = [
            'light',
            'dark',
            'auto',
          ];
          const currentIndex = themes.indexOf(state.settings.theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          state.settings.theme = themes[nextIndex];
        }),

      // App actions
      setLoading: loading =>
        set(state => {
          state.isLoading = loading;
        }),

      setError: error =>
        set(state => {
          state.error = error;
        }),

      clearError: () =>
        set(state => {
          state.error = null;
        }),
    })),
    {
      name: 'kindred-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        footprint: state.footprint,
        carbonHistory: state.carbonHistory,
        settings: state.settings,
      }),
    },
  ),
);

// Selectors (for optimized re-renders)
export const useUser = () => useAppStore(state => state.user);
export const useIsAuthenticated = () =>
  useAppStore(state => state.isAuthenticated);
export const useFootprint = () => useAppStore(state => state.footprint);
export const useSettings = () => useAppStore(state => state.settings);
export const useIsLoading = () => useAppStore(state => state.isLoading);
export const useError = () => useAppStore(state => state.error);
