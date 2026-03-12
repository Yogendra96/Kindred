/**
 * Centralized Configuration System
 * Provides environment-specific settings and feature flags
 */
import { Platform } from 'react-native';
import Config from 'react-native-config';

// Environment types
export type Environment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuration interfaces
export interface AppConfig {
  environment: Environment;
  version: string;
  buildNumber: string;
  bundleId: string;
  displayName: string;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableMocking: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  enableCrashlytics: boolean;
  enablePerformanceMonitoring: boolean;
  sampleRate: number;
}

export interface SecurityConfig {
  enableBiometrics: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableEncryption: boolean;
  certificatePinning: boolean;
}

export interface PerformanceConfig {
  enableHermes: boolean;
  enableFlipper: boolean;
  enableCodePush: boolean;
  bundleSplitting: boolean;
  lazyLoading: boolean;
}

export interface FeatureFlags {
  enableNewUI: boolean;
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  enableSocialLogin: boolean;
  enableBiometricAuth: boolean;
  enableDarkMode: boolean;
  enableExperimentalFeatures: boolean;
}

// Get current environment
const getEnvironment = (): Environment => {
  const env = Config.ENVIRONMENT || process.env.NODE_ENV || 'development';
  return env as Environment;
};

// Base configuration
const baseConfig = {
  app: {
    environment: getEnvironment(),
    version: Config.APP_VERSION || '1.0.0',
    buildNumber: Config.BUILD_NUMBER || '1',
    bundleId: Platform.select({
      ios: Config.IOS_BUNDLE_ID || 'com.kindred.app',
      android: Config.ANDROID_PACKAGE_NAME || 'com.kindred.app',
    }) as string,
    displayName: Config.APP_DISPLAY_NAME || 'Kindred',
  } as AppConfig,

  api: {
    baseURL: Config.API_BASE_URL || 'https://api.kindred.com',
    timeout: parseInt(Config.API_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(Config.API_RETRY_ATTEMPTS || '3', 10),
    enableMocking: Config.ENABLE_API_MOCKING === 'true',
  } as APIConfig,

  firebase: {
    apiKey: Config.FIREBASE_API_KEY || '',
    authDomain: Config.FIREBASE_AUTH_DOMAIN || '',
    projectId: Config.FIREBASE_PROJECT_ID || '',
    storageBucket: Config.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: Config.FIREBASE_APP_ID || '',
    measurementId: Config.FIREBASE_MEASUREMENT_ID,
  } as FirebaseConfig,

  analytics: {
    enabled: Config.ENABLE_ANALYTICS !== 'false',
    trackingId: Config.ANALYTICS_TRACKING_ID,
    enableCrashlytics: Config.ENABLE_CRASHLYTICS !== 'false',
    enablePerformanceMonitoring:
      Config.ENABLE_PERFORMANCE_MONITORING !== 'false',
    sampleRate: parseFloat(Config.ANALYTICS_SAMPLE_RATE || '1.0'),
  } as AnalyticsConfig,

  security: {
    enableBiometrics: Config.ENABLE_BIOMETRICS !== 'false',
    sessionTimeout: parseInt(Config.SESSION_TIMEOUT || '1800000', 10), // 30 minutes
    maxLoginAttempts: parseInt(Config.MAX_LOGIN_ATTEMPTS || '5', 10),
    enableEncryption: Config.ENABLE_ENCRYPTION !== 'false',
    certificatePinning: Config.ENABLE_CERT_PINNING === 'true',
  } as SecurityConfig,

  performance: {
    enableHermes: Config.ENABLE_HERMES !== 'false',
    enableFlipper: Config.ENABLE_FLIPPER !== 'false' && __DEV__,
    enableCodePush: Config.ENABLE_CODEPUSH === 'true',
    bundleSplitting: Config.ENABLE_BUNDLE_SPLITTING === 'true',
    lazyLoading: Config.ENABLE_LAZY_LOADING !== 'false',
  } as PerformanceConfig,

  featureFlags: {
    enableNewUI: Config.FEATURE_NEW_UI === 'true',
    enableOfflineMode: Config.FEATURE_OFFLINE_MODE === 'true',
    enablePushNotifications: Config.FEATURE_PUSH_NOTIFICATIONS !== 'false',
    enableSocialLogin: Config.FEATURE_SOCIAL_LOGIN !== 'false',
    enableBiometricAuth: Config.FEATURE_BIOMETRIC_AUTH !== 'false',
    enableDarkMode: Config.FEATURE_DARK_MODE !== 'false',
    enableExperimentalFeatures: Config.FEATURE_EXPERIMENTAL === 'true',
  } as FeatureFlags,
};

// Environment-specific overrides
const environmentConfigs = {
  development: {
    api: {
      ...baseConfig.api,
      baseURL: Config.DEV_API_BASE_URL || 'http://localhost:3000',
      enableMocking: true,
    },
    analytics: {
      ...baseConfig.analytics,
      enabled: false,
      enableCrashlytics: false,
    },
    performance: {
      ...baseConfig.performance,
      enableFlipper: true,
    },
    featureFlags: {
      ...baseConfig.featureFlags,
      enableExperimentalFeatures: true,
    },
  },

  staging: {
    api: {
      ...baseConfig.api,
      baseURL: Config.STAGING_API_BASE_URL || 'https://staging-api.kindred.com',
    },
    analytics: {
      ...baseConfig.analytics,
      sampleRate: 0.5,
    },
    performance: {
      ...baseConfig.performance,
      enableFlipper: false,
    },
  },

  production: {
    api: {
      ...baseConfig.api,
      enableMocking: false,
    },
    analytics: {
      ...baseConfig.analytics,
      enabled: true,
      enableCrashlytics: true,
      enablePerformanceMonitoring: true,
    },
    performance: {
      ...baseConfig.performance,
      enableFlipper: false,
      enableCodePush: true,
    },
    security: {
      ...baseConfig.security,
      certificatePinning: true,
    },
  },
};

// Merge base config with environment-specific config
const currentEnvironment = getEnvironment();
const environmentConfig: Partial<typeof baseConfig> = (environmentConfigs[
  currentEnvironment
] || {}) as Partial<typeof baseConfig>;

export const config = {
  ...baseConfig,
  ...environmentConfig,
  app: { ...baseConfig.app, ...environmentConfig.app },
  api: { ...baseConfig.api, ...environmentConfig.api },
  firebase: { ...baseConfig.firebase, ...environmentConfig.firebase },
  analytics: { ...baseConfig.analytics, ...environmentConfig.analytics },
  security: { ...baseConfig.security, ...environmentConfig.security },
  performance: { ...baseConfig.performance, ...environmentConfig.performance },
  featureFlags: {
    ...baseConfig.featureFlags,
    ...environmentConfig.featureFlags,
  },
};

// Validation functions
export const validateConfig = (): boolean => {
  const requiredFields = [
    config.firebase.apiKey,
    config.firebase.projectId,
    config.api.baseURL,
  ];

  const missingFields = requiredFields.filter(field => !field);

  if (missingFields.length > 0) {
    console.error('Missing required configuration fields:', missingFields);
    return false;
  }

  return true;
};

// Debug helper
export const logConfig = (): void => {
  if (__DEV__) {
    console.log('🔧 Current Configuration:', {
      environment: config.app.environment,
      version: config.app.version,
      apiBaseURL: config.api.baseURL,
      firebaseProjectId: config.firebase.projectId,
      analyticsEnabled: config.analytics.enabled,
      featureFlags: config.featureFlags,
    });
  }
};

// Export individual configs for convenience
export const {
  app: appConfig,
  api: apiConfig,
  firebase: firebaseConfig,
  analytics: analyticsConfig,
  security: securityConfig,
  performance: performanceConfig,
  featureFlags,
} = config;

export default config;
