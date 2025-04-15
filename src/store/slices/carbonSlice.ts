 import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CarbonFootprint {
  total: number;
  transportation: number;
  food: number;
  energy: number;
  waste: number;
}

interface CarbonState {
  footprint: CarbonFootprint;
  history: Array<{ date: string; footprint: CarbonFootprint }>;
  goals: {
    target: number;
    deadline: string;
  };
  loading: boolean;
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
  loading: false,
  error: null,
};

const carbonSlice = createSlice({
  name: 'carbon',
  initialState,
  reducers: {
    updateFootprint: (state, action: PayloadAction<Partial<CarbonFootprint>>) => {
      state.footprint = { ...state.footprint, ...action.payload };
      state.footprint.total = Object.values(state.footprint).reduce((sum, val) => sum + val, 0);
    },
    addHistoryEntry: (state, action: PayloadAction<{ date: string; footprint: CarbonFootprint }>) => {
      state.history.push(action.payload);
    },
    setGoal: (state, action: PayloadAction<{ target: number; deadline: string }>) => {
      state.goals = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { updateFootprint, addHistoryEntry, setGoal, setLoading, setError } = carbonSlice.actions;
export default carbonSlice.reducer;