// @ts-nocheck
/* eslint-disable */
// Import services for middleware integration
import { AnalyticsService } from '../services/AnalyticsService';
const analyticsService = AnalyticsService.getInstance();
import loggingService from '../services/LoggerService';
import analyticsReducer, { addEvent, startSession } from './slices/analyticsSlice';
// Import all reducers
import authReducer, { loginSuccess, logout } from './slices/authSlice';
import carbonReducer from './slices/carbonSlice';
import locationReducer from './slices/locationSlice';
import settingsReducer, {
  updatePrivacySettings,
  acceptPrivacyConsent,
} from './slices/settingsSlice';
import userReducer from './slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import createFilter from 'redux-persist-transform-filter';
import compressTransform from 'redux-persist-transform-compress';

// Create listener middleware for side effects
const listenerMiddleware = createListenerMiddleware();

// Listen for auth state changes to sync with analytics
listenerMiddleware.startListening({
  matcher: isAnyOf(loginSuccess, logout),
  effect: async (action, listenerApi) => {
    const _state = listenerApi.getState() as RootState;

    if (loginSuccess.match(action)) {
      // Start analytics session on login
      await analyticsService.startSession(action.payload.id);

      // Track login event
      analyticsService.trackEvent(
        'user_login',
        {
          method: 'email',
          userId: action.payload.id,
        },
        'user_action',
        'medium',
      );

      loggingService.info(
        'User logged in',
        JSON.stringify({
          userId: action.payload.id,
          email: action.payload.email,
        }),
      );
    } else if (logout.match(action)) {
      // End analytics session on logout
      await analyticsService.endSession();

      // Track logout event
      analyticsService.trackEvent('user_logout', {}, 'user_action', 'medium');

      loggingService.info('User logged out', '');
    }
  },
});

// Listen for analytics events to sync with service
listenerMiddleware.startListening({
  actionCreator: addEvent,
  effect: async (action, _listenerApi) => {
    const event = action.payload;
    analyticsService.trackEvent(event.name, event.properties, event.category, 'medium');
  },
});

// Listen for settings and privacy updates to sync with analytics service
listenerMiddleware.startListening({
  matcher: isAnyOf(updatePrivacySettings, acceptPrivacyConsent),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const analyticsEnabled = state.settings?.privacy?.analytics ?? true;
    analyticsService.setAnalyticsEnabled(analyticsEnabled);
  },
});

// Sync analytics service on store hydration
listenerMiddleware.startListening({
  predicate: action => action.type === 'persist/REHYDRATE',
  effect: async (action, listenerApi) => {
    // Wait a tick for persist/REHYDRATE to be fully applied to the store
    await new Promise(resolve => setTimeout(resolve, 0));
    const state = listenerApi.getState() as RootState;
    const analyticsEnabled = state.settings?.privacy?.analytics ?? true;
    analyticsService.setAnalyticsEnabled(analyticsEnabled);
  },
});

// ─── State Migrations ─────────────────────────────────────────────────────────
// Add new versions here when the persisted state shape changes.
// This prevents users from getting corrupted / incompatible state after upgrades.

const migrations = {
  // v0 → v1: initial shape (no-op — starting version)
  1: (state: any) => state,
  // v1 → v2: added pendingSync flag to carbon history entries
  2: (state: any) => ({
    ...state,
    carbon: {
      ...state?.carbon,
      history: (state?.carbon?.history ?? []).map((entry: any) => ({
        ...entry,
        pendingSync: entry.pendingSync ?? false,
      })),
    },
  }),
};

// ─── Per-slice Transforms ─────────────────────────────────────────────────────
// Only persist the fields we need — strips ephemeral loading/error state
// so the rehydrated store is always clean.

const carbonFilter = createFilter('carbon', [
  'footprint',
  'history',
  'goals',
  'ecosystem',
  'offsets',
]);

const userFilter = createFilter('user', ['profile', 'preferences']);

const settingsFilter = createFilter('settings', ['notifications', 'privacy', 'app']);

const authFilter = createFilter('auth', ['token', 'user', 'isAuthenticated']);

// Compress the carbon history array which can get large (30 days × entries)
const historyCompress = compressTransform({
  whitelist: ['carbon'],
});

// ─── Persist Configuration ────────────────────────────────────────────────────

const persistConfig = {
  key: 'root',
  version: 2,
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'settings', 'carbon'],
  blacklist: ['analytics', 'location'],
  migrate: createMigrate(migrations, { debug: __DEV__ }),
  transforms: [carbonFilter, userFilter, settingsFilter, authFilter, historyCompress],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  carbon: carbonReducer,
  settings: settingsReducer,
  analytics: analyticsReducer,
  location: locationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).prepend(listenerMiddleware.middleware),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Action creators for easy access
export { loginSuccess, logout } from './slices/authSlice';
export { updateProfile, updatePreferences, clearUserState } from './slices/userSlice';
export {
  updateFootprint,
  addHistoryEntry,
  resetState as resetCarbonState,
  updateEcosystem,
} from './slices/carbonSlice';
export {
  updateNotificationSettings,
  updatePrivacySettings,
  acceptPrivacyConsent,
  updateAppSettings,
  resetSettings,
} from './slices/settingsSlice';
export {
  addEvent,
  addMetric,
  startSession as startAnalyticsSession,
  resetAnalytics,
} from './slices/analyticsSlice';
export {
  updateCurrentLocation,
  addLocationHistory,
  setTrackingStatus,
  resetLocationState,
} from './slices/locationSlice';
