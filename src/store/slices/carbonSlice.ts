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
}

interface CarbonState {
  footprint: CarbonFootprint;
  history: HistoryEntry[];
  goals: {
    target: number;
    deadline: string;
  };
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
      state.history = [action.payload, ...state.history].slice(0, 30); // Keep last 30 days
    },
    setGoals: (state, action: PayloadAction<{ target: number; deadline: string }>) => {
      state.goals = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
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
  setError,
  resetState,
} = carbonSlice.actions;

export default carbonSlice.reducer;
