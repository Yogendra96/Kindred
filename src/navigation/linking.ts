import type { LinkingOptions } from '@react-navigation/native';
import type { AppStackParamList } from './types';

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['kindred://', 'https://kindred.earth'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '',
          Map: 'map',
          Profile: 'profile',
          Social: 'social',
          Market: 'market',
          Awards: 'awards',
        },
      },
      CarbonTwin: 'carbontwin',
      VisionCamera: 'scan',
      Verification: 'verify',
      VeganCalculator: 'vegan',
      Analytics: 'analytics',
      LearningCenter: 'learn',
      SmartDevices: 'devices',
      DataConnections: 'connections',
      Offset: 'offset',
      Wallet: 'wallet',
      CorporateLeaderboard: 'corporate',
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};

export default linking;
