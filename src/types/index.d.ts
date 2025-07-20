declare module '*.svg' {
  import type React from 'react';

  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';

// Environment variables type definitions
declare module '@env' {
  export const EXPO_PUBLIC_FIREBASE_API_KEY: string;
  export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  export const EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
  export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  export const EXPO_PUBLIC_FIREBASE_APP_ID: string;
  export const EXPO_PUBLIC_FIREBASE_VAPID_KEY: string;
  export const EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  export const EXPO_PUBLIC_FACEBOOK_APP_ID: string;
  export const EXPO_PUBLIC_TWITTER_CONSUMER_KEY: string;
  export const EXPO_PUBLIC_TWITTER_CONSUMER_SECRET: string;
  export const EXPO_PUBLIC_API_KEY: string;
}

// Global type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      GOOGLE_CLIENT_ID: string;
      GOOGLE_IOS_CLIENT_ID: string;
      GOOGLE_WEB_CLIENT_ID: string;
    }
  }
}

// Redux state types
interface RootState {
  auth: AuthState;
  user: UserState;
  app: AppState;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  isOnboarded: boolean;
}

// Model types
interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  userId: string;
  fullName: string;
  avatar: string;
  bio: string;
  location: string;
  interests: string[];
  carbonFootprint: number;
  ecoScore: number;
}

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  theme: 'light' | 'dark';
  language: string;
  privacySettings: {
    shareLocation: boolean;
    shareProfile: boolean;
    shareActivity: boolean;
  };
}

// API Response types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Navigation types
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

type MainStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  Activity: undefined;
  CarbonTracker: undefined;
  EcoTips: undefined;
};

// Utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

// Common types used across the app
interface CarbonFootprint {
  id: string;
  userId: string;
  date: Date;
  value: number;
  category: 'transport' | 'food' | 'energy' | 'other';
  description?: string;
}

interface Activity {
  id: string;
  userId: string;
  type: 'walking' | 'cycling' | 'public_transport' | 'other';
  startTime: Date;
  endTime?: Date;
  distance?: number;
  carbonSaved?: number;
}

interface EcoTip {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'food' | 'energy' | 'lifestyle';
  carbonSavingPotential?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Make these types available globally
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      // This interface extends RootStackParamList for type safety
      // Additional navigation params can be added here if needed
      [key: string]: undefined;
    }
  }
}
