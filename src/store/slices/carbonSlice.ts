import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CarbonActivityResult } from '../../components/forms/CarbonActivityForm';
import type { CarbonEmissionCalculation } from '../../services/CarbonAPIService';
import { carbonStorageService, type CarbonActivity } from '../../services/CarbonStorageService';

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

// Helper function to generate human-readable activity descriptions
function generateActivityDescription(result: CarbonActivityResult): string {
  const { type, data } = result;
  
  switch (type) {
    case 'transport': {
      const transport = data as any;
      const mode = transport.mode || 'unknown';
      const distance = transport.distance || 0;
      return `${mode.charAt(0).toUpperCase() + mode.slice(1)} trip - ${distance}km`;
    }
    case 'energy': {
      const energy = data as any;
      const energyType = energy.type || 'electricity';
      const amount = energy.amount || 0;
      const unit = energy.unit || 'kWh';
      return `${energyType.charAt(0).toUpperCase() + energyType.slice(1)} usage - ${amount}${unit}`;
    }
    case 'food': {
      const food = data as any;
      const category = food.category || 'food';
      const servings = food.servings || 1;
      const mealType = food.mealType || 'meal';
      return `${category.charAt(0).toUpperCase() + category.slice(1)} ${mealType} - ${servings} serving${servings > 1 ? 's' : ''}`;
    }
    default:
      return `${type} activity`;
  }
}

// Async thunks for storage operations
export const loadStoredActivities = createAsyncThunk(
  'carbon/loadStoredActivities',
  async () => {
    const activities = await carbonStorageService.loadActivities();
    return activities;
  }
);

export const saveActivityToStorage = createAsyncThunk(
  'carbon/saveActivityToStorage',
  async (activity: CarbonActivity) => {
    await carbonStorageService.addActivity(activity);
    return activity;
  }
);

export const clearOldStoredActivities = createAsyncThunk(
  'carbon/clearOldStoredActivities',
  async (daysToKeep: number = 90) => {
    await carbonStorageService.clearOldActivities(daysToKeep);
    const activities = await carbonStorageService.loadActivities();
    return activities;
  }
);

export const syncActivityStatus = createAsyncThunk(
  'carbon/syncActivityStatus',
  async ({ activityId, synced }: { activityId: string; synced: boolean }) => {
    await carbonStorageService.updateActivitySyncStatus(activityId, synced);
    return { activityId, synced };
  }
);

interface CarbonState {
  footprint: CarbonFootprint;
  history: HistoryEntry[];
  activities: CarbonActivity[];
  goals: {
    target: number;
    deadline: string;
  };
  loading: {
    footprint: boolean;
    history: boolean;
    activities: boolean;
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
  activities: [],
  goals: {
    target: 0,
    deadline: '',
  },
  loading: {
    footprint: false,
    history: false,
    activities: false,
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
    setActivitiesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.activities = action.payload;
    },
    setGoalsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.goals = action.payload;
    },
    updateFootprint: (
      state,
      action: PayloadAction<Partial<CarbonFootprint>>,
    ) => {
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
    addCarbonActivity: (state, action: PayloadAction<CarbonActivityResult>) => {
      const activity: CarbonActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: action.payload.type,
        description: generateActivityDescription(action.payload),
        emissions: action.payload.calculation,
        data: action.payload.data,
        timestamp: action.payload.timestamp,
        synced: false,
      };

      // Add to activities list (keep last 100 entries)
      state.activities = [activity, ...state.activities].slice(0, 100);

      // Update current footprint
      const categoryEmissions = activity.emissions.carbon_footprint_kg;
      switch (activity.type) {
        case 'transport':
          state.footprint.transportation += categoryEmissions;
          break;
        case 'energy':
          state.footprint.energy += categoryEmissions;
          break;
        case 'food':
          state.footprint.food += categoryEmissions;
          break;
      }
      
      // Recalculate total
      state.footprint.total = 
        state.footprint.transportation +
        state.footprint.energy +
        state.footprint.food +
        state.footprint.waste;
    },
    updateActivitySyncStatus: (state, action: PayloadAction<{ id: string; synced: boolean }>) => {
      const activity = state.activities.find(a => a.id === action.payload.id);
      if (activity) {
        activity.synced = action.payload.synced;
      }
    },
    setActivities: (state, action: PayloadAction<CarbonActivity[]>) => {
      state.activities = action.payload;
    },
    clearOldActivities: (state, action: PayloadAction<number>) => {
      const daysToKeep = action.payload;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      state.activities = state.activities.filter(
        activity => new Date(activity.timestamp) > cutoffDate
      );
    },
    setGoals: (
      state,
      action: PayloadAction<{ target: number; deadline: string }>,
    ) => {
      state.goals = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetState: state => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Load stored activities
    builder.addCase(loadStoredActivities.pending, (state) => {
      state.loading.activities = true;
      state.error = null;
    });
    builder.addCase(loadStoredActivities.fulfilled, (state, action) => {
      state.loading.activities = false;
      state.activities = action.payload;
      
      // Recalculate footprint from loaded activities
      const totals = { transportation: 0, energy: 0, food: 0, waste: 0, total: 0 };
      
      for (const activity of action.payload) {
        const emissions = activity.emissions.carbon_footprint_kg;
        switch (activity.type) {
          case 'transport':
            totals.transportation += emissions;
            break;
          case 'energy':
            totals.energy += emissions;
            break;
          case 'food':
            totals.food += emissions;
            break;
        }
      }
      
      totals.total = totals.transportation + totals.energy + totals.food + totals.waste;
      state.footprint = totals;
    });
    builder.addCase(loadStoredActivities.rejected, (state, action) => {
      state.loading.activities = false;
      state.error = action.error.message || 'Failed to load activities';
    });

    // Save activity to storage
    builder.addCase(saveActivityToStorage.fulfilled, (state, action) => {
      // Activity is already added to state by addCarbonActivity action
      // This just confirms it was saved to storage
      const activity = state.activities.find(a => a.id === action.payload.id);
      if (activity) {
        // Mark as pending sync but saved locally
        activity.synced = false;
      }
    });
    builder.addCase(saveActivityToStorage.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to save activity to storage';
    });

    // Clear old activities
    builder.addCase(clearOldStoredActivities.fulfilled, (state, action) => {
      state.activities = action.payload;
      
      // Recalculate footprint after clearing old activities
      const totals = { transportation: 0, energy: 0, food: 0, waste: 0, total: 0 };
      
      for (const activity of action.payload) {
        const emissions = activity.emissions.carbon_footprint_kg;
        switch (activity.type) {
          case 'transport':
            totals.transportation += emissions;
            break;
          case 'energy':
            totals.energy += emissions;
            break;
          case 'food':
            totals.food += emissions;
            break;
        }
      }
      
      totals.total = totals.transportation + totals.energy + totals.food + totals.waste;
      state.footprint = totals;
    });

    // Sync activity status
    builder.addCase(syncActivityStatus.fulfilled, (state, action) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity) {
        activity.synced = action.payload.synced;
      }
    });
  },
});

export const {
  setFootprintLoading,
  setHistoryLoading,
  setActivitiesLoading,
  setGoalsLoading,
  updateFootprint,
  setHistory,
  addHistoryEntry,
  addCarbonActivity,
  updateActivitySyncStatus,
  setActivities,
  clearOldActivities,
  setGoals,
  setError,
  resetState,
} = carbonSlice.actions;

export default carbonSlice.reducer;
