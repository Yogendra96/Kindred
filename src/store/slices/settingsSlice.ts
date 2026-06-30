import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  carbonTips: boolean;
  achievements: boolean;
  weeklyReports: boolean;
  emergencyAlerts: boolean;
}

interface PrivacySettings {
  locationTracking: boolean;
  dataSharing: boolean;
  analytics: boolean;
  biometricAuth: boolean;
  dataRetentionDays: number;
  consentAccepted: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  units: 'metric' | 'imperial';
  autoBackup: boolean;
  offlineMode: boolean;
  performanceMode: 'power_save' | 'balanced' | 'performance';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  autoLock: boolean;
  autoLockTimeout: number;
  encryptionEnabled: boolean;
}

interface SettingsState {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  app: AppSettings;
  security: SecuritySettings;
  isLoading: boolean;
  error: string | null;
  lastSynced: number | null;
}

const initialState: SettingsState = {
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    carbonTips: true,
    achievements: true,
    weeklyReports: true,
    emergencyAlerts: true,
  },
  privacy: {
    locationTracking: true,
    dataSharing: false,
    analytics: true,
    biometricAuth: false,
    dataRetentionDays: 365,
    consentAccepted: false,
  },
  app: {
    theme: 'system',
    language: 'en',
    currency: 'USD',
    units: 'metric',
    autoBackup: true,
    offlineMode: false,
    performanceMode: 'balanced',
  },
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30, // minutes
    autoLock: true,
    autoLockTimeout: 5, // minutes
    encryptionEnabled: true,
  },
  isLoading: false,
  error: null,
  lastSynced: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
      state.lastSynced = Date.now();
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<PrivacySettings>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
      state.lastSynced = Date.now();
    },
    acceptPrivacyConsent: state => {
      state.privacy.consentAccepted = true;
      state.lastSynced = Date.now();
    },
    updateAppSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.app = { ...state.app, ...action.payload };
      state.lastSynced = Date.now();
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
      state.lastSynced = Date.now();
    },
    resetSettings: state => {
      Object.assign(state, initialState);
    },
    syncSettings: (state, action: PayloadAction<Omit<SettingsState, 'isLoading' | 'error'>>) => {
      const { notifications, privacy, app, security, lastSynced } = action.payload;
      state.notifications = notifications;
      state.privacy = privacy;
      state.app = app;
      state.security = security;
      state.lastSynced = lastSynced;
    },
  },
});

export const {
  setLoading,
  setError,
  updateNotificationSettings,
  updatePrivacySettings,
  acceptPrivacyConsent,
  updateAppSettings,
  updateSecuritySettings,
  resetSettings,
  syncSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
