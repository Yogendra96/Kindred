import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system' | 'highContrast';
  notifications: boolean;
  locationSharing: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  weeklyReports: boolean;
  weeklyReport?: boolean;
  consentAccepted: boolean;
  privateProfile?: boolean;
  analytics?: boolean;
  locationTracking?: boolean;
  ecoChargingScreen?: boolean;
  units?: 'metric' | 'imperial';
}

interface AppState {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  notifications: true,
  locationSharing: true,
  pushEnabled: true,
  emailEnabled: true,
  weeklyReports: true,
  consentAccepted: false,
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      preferences: defaultPreferences,
      updatePreferences: prefs =>
        set(state => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'kindred-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
