// Import services for middleware integration
import { AnalyticsService } from '../services/AnalyticsService';
const analyticsService = AnalyticsService.getInstance();
import loggingService from '../services/LoggerService';
import analyticsReducer, {
  addEvent,
  startSession,
} from './slices/analyticsSlice';
// Import all reducers
import authReducer, { loginSuccess, logout } from './slices/authSlice';
import carbonReducer from './slices/carbonSlice';
import locationReducer from './slices/locationSlice';
import settingsReducer from './slices/settingsSlice';
import userReducer from './slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

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
          method: 'email', // This could be dynamic based on login method
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
    analyticsService.trackEvent(
      event.name,
      event.properties,
      event.category,
      'medium',
    );
  },
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'settings', 'carbon'], // Only persist certain slices
  blacklist: ['analytics', 'location'], // Don't persist volatile data
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
export { updateProfile, updatePreferences } from './slices/userSlice';
export { updateFootprint, addHistoryEntry } from './slices/carbonSlice';
export {
  updateNotificationSettings,
  updatePrivacySettings,
  updateAppSettings,
} from './slices/settingsSlice';
export {
  addEvent,
  addMetric,
  startSession as startAnalyticsSession,
} from './slices/analyticsSlice';
export {
  updateCurrentLocation,
  addLocationHistory,
  setTrackingStatus,
} from './slices/locationSlice';
