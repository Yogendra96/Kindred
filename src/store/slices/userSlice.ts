 import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  locationSharing: boolean;
}

interface UserState {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
  };
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: {
    id: '',
    name: '',
    email: '',
    avatar: null,
    bio: null,
  },
  preferences: {
    theme: 'light',
    notifications: true,
    locationSharing: true,
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserState['profile']>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { updateProfile, updatePreferences, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;