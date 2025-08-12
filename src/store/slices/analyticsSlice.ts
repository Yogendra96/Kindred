import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  screenViews: number;
  actions: number;
  errors: number;
}

interface AnalyticsEvent {
  name: string;
  category:
    | 'user_action'
    | 'performance'
    | 'error'
    | 'navigation'
    | 'feature_usage';
  properties?: Record<string, string | number | boolean | null>;
  timestamp: number;
}

interface AnalyticsState {
  currentSession: UserSession | null;
  events: AnalyticsEvent[];
  metrics: PerformanceMetric[];
  crashReports: Array<{
    id: string;
    error: string;
    stack?: string;
    timestamp: number;
    context?: Record<string, string | number | boolean | null>;
  }>;
  settings: {
    enabled: boolean;
    crashReporting: boolean;
    performanceMonitoring: boolean;
    maxEvents: number;
    maxMetrics: number;
  };
  isOnline: boolean;
  pendingEvents: AnalyticsEvent[];
}

const initialState: AnalyticsState = {
  currentSession: null,
  events: [],
  metrics: [],
  crashReports: [],
  settings: {
    enabled: true,
    crashReporting: true,
    performanceMonitoring: true,
    maxEvents: 1000,
    maxMetrics: 500,
  },
  isOnline: true,
  pendingEvents: [],
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    startSession: (
      state,
      action: PayloadAction<{ sessionId: string; timestamp: number }>,
    ) => {
      state.currentSession = {
        sessionId: action.payload.sessionId,
        startTime: action.payload.timestamp,
        screenViews: 0,
        actions: 0,
        errors: 0,
      };
    },
    endSession: (state, action: PayloadAction<{ timestamp: number }>) => {
      if (state.currentSession) {
        state.currentSession.endTime = action.payload.timestamp;
      }
    },
    incrementScreenViews: state => {
      if (state.currentSession) {
        state.currentSession.screenViews++;
      }
    },
    incrementActions: state => {
      if (state.currentSession) {
        state.currentSession.actions++;
      }
    },
    incrementErrors: state => {
      if (state.currentSession) {
        state.currentSession.errors++;
      }
    },
    addEvent: (state, action: PayloadAction<AnalyticsEvent>) => {
      if (!state.settings.enabled) return;

      state.events.unshift(action.payload);

      // Keep only the most recent events
      if (state.events.length > state.settings.maxEvents) {
        state.events = state.events.slice(0, state.settings.maxEvents);
      }

      // Add to pending if offline
      if (!state.isOnline) {
        state.pendingEvents.unshift(action.payload);
      }
    },
    addMetric: (state, action: PayloadAction<PerformanceMetric>) => {
      if (!state.settings.performanceMonitoring) return;

      state.metrics.unshift(action.payload);

      // Keep only the most recent metrics
      if (state.metrics.length > state.settings.maxMetrics) {
        state.metrics = state.metrics.slice(0, state.settings.maxMetrics);
      }
    },
    addCrashReport: (
      state,
      action: PayloadAction<{
        id: string;
        error: string;
        stack?: string;
        timestamp: number;
        context?: Record<string, string | number | boolean | null>;
      }>,
    ) => {
      if (!state.settings.crashReporting) return;

      state.crashReports.unshift(action.payload);

      // Keep only last 50 crash reports
      if (state.crashReports.length > 50) {
        state.crashReports = state.crashReports.slice(0, 50);
      }
    },
    updateSettings: (
      state,
      action: PayloadAction<Partial<AnalyticsState['settings']>>,
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;

      // Clear pending events when coming back online
      if (action.payload) {
        state.pendingEvents = [];
      }
    },
    clearEvents: state => {
      state.events = [];
      state.pendingEvents = [];
    },
    clearMetrics: state => {
      state.metrics = [];
    },
    clearCrashReports: state => {
      state.crashReports = [];
    },
    resetAnalytics: state => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  startSession,
  endSession,
  incrementScreenViews,
  incrementActions,
  incrementErrors,
  addEvent,
  addMetric,
  addCrashReport,
  updateSettings,
  setOnlineStatus,
  clearEvents,
  clearMetrics,
  clearCrashReports,
  resetAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
