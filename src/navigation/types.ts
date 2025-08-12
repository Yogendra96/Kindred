import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CarbonActivityType } from '../components/forms/CarbonActivityForm';

export interface RootStackParamList {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Onboarding: undefined;
}

export interface AuthStackParamList {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  SocialLogin: undefined;
}

export interface MainStackParamList {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  CarbonTracker: {
    initialDate?: string;
    category?: string;
  };
  CarbonActivity: {
    activityType: CarbonActivityType;
    initialData?: Record<string, unknown>;
  };
  CarbonDashboard: undefined;
  ActivityHistory: {
    startDate?: string;
    endDate?: string;
    filter?: 'daily' | 'weekly' | 'monthly';
  };
  Community: undefined;
  Notifications: undefined;
  ChallengeDetails: { challengeId: string };
  LeaderBoard: {
    timeFrame?: 'weekly' | 'monthly' | 'allTime';
    category?: string;
  };
}

export interface MainTabParamList {
  HomeTab: NavigatorScreenParams<MainStackParamList>;
  ActivityTab: undefined;
  ChallengesTab: undefined;
  ProfileTab: { userId?: string };
}

// Type augmentation for React Navigation
// This extends the global RootParamList to provide type safety for navigation
declare module '@react-navigation/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface RootParamList extends RootStackParamList {}
}
