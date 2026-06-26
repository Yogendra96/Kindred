import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface CarbonFootprint {
  total: number;
  transportation: number;
  food: number;
  energy: number;
  waste: number;
}

interface HistoryEntry {
  date: string;
  footprint: CarbonFootprint;
  pendingSync?: boolean; // true while the action is in the offline queue
}

export interface EcosystemState {
  health: number; // 0.0 to 1.0
  treeCount: number;
  biodiversity: number; // 0.0 to 1.0
  waterClarity: number; // 0.0 to 1.0
  airQuality: number; // 0.0 to 1.0
  lastUpdated: string;
}

interface CarbonState {
  footprint: CarbonFootprint;
  history: HistoryEntry[];
  goals: {
    target: number;
    deadline: string;
  };
  ecosystem: EcosystemState;
  loading: {
    footprint: boolean;
    history: boolean;
    goals: boolean;
  };
  error: string | null;
}

const initialState: CarbonState = {
  footprint: {
    total: 0,
    transportation: 0,
    food: 0,
    energy: 0,
    waste: 0,
  },
  history: [],
  goals: {
    target: 0,
    deadline: '',
  },
  ecosystem: {
    health: 0.5,
    treeCount: 0,
    biodiversity: 0.3,
    waterClarity: 0.5,
    airQuality: 0.5,
    lastUpdated: new Date().toISOString(),
  },
  loading: {
    footprint: false,
    history: false,
    goals: false,
  },
  error: null,
};

const carbonSlice = createSlice({
  name: 'carbon',
  initialState,
  reducers: {
    setFootprintLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.footprint = action.payload;
    },
    setHistoryLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.history = action.payload;
    },
    setGoalsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.goals = action.payload;
    },
    updateFootprint: (state, action: PayloadAction<Partial<CarbonFootprint>>) => {
      state.footprint = {
        ...state.footprint,
        ...action.payload,
        total: Object.values({ ...state.footprint, ...action.payload }).reduce(
          (sum, val) => (typeof val === 'number' ? sum + val : sum),
          0,
        ),
      };
    },
    setHistory: (state, action: PayloadAction<HistoryEntry[]>) => {
      state.history = action.payload;
    },
    addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
      const entry = {
        ...action.payload,
        pendingSync: action.payload.pendingSync ?? false,
      };
      state.history = [entry, ...state.history].slice(0, 30); // Keep last 30 days
    },
    setGoals: (state, action: PayloadAction<{ target: number; deadline: string }>) => {
      state.goals = action.payload;
    },
    updateEcosystem: (state, action: PayloadAction<Partial<EcosystemState>>) => {
      state.ecosystem = {
        ...state.ecosystem,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    /** Mark a history entry as synced (clears pendingSync flag) */
    markEntrySynced: (state, action: PayloadAction<string>) => {
      const entry = state.history.find(h => h.date === action.payload);
      if (entry) entry.pendingSync = false;
    },
    /** Mark a history entry as pending sync */
    markEntryPendingSync: (state, action: PayloadAction<string>) => {
      const entry = state.history.find(h => h.date === action.payload);
      if (entry) entry.pendingSync = true;
    },
    resetState: state => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setFootprintLoading,
  setHistoryLoading,
  setGoalsLoading,
  updateFootprint,
  setHistory,
  addHistoryEntry,
  setGoals,
  updateEcosystem,
  setError,
  markEntrySynced,
  markEntryPendingSync,
  resetState,
} = carbonSlice.actions;

export default carbonSlice.reducer;
