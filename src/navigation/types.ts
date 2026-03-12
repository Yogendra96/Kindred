import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  SocialLogin: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  CarbonTracker: {
    initialDate?: string;
    category?: string;
  };
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
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<MainStackParamList>;
  ActivityTab: undefined;
  ChallengesTab: undefined;
  ProfileTab: { userId?: string };
};

// ─── App Navigator (AppNavigator.tsx) param lists ─────────────────────────────

/** Bottom tab bar screens */
export type AppTabParamList = {
  Home: undefined;
  Map: undefined;
  Profile: undefined;
  Social: undefined;
  Market: undefined;
  Awards: undefined;
};

/** Stack screens reachable from Home */
export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList>;
  CarbonTwin: undefined;
  VisionCamera: undefined;
  Verification: undefined;
  VeganCalculator: undefined;
  Analytics: undefined;
  LearningCenter: undefined;
  SmartDevices: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
