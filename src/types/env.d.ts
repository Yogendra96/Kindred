declare module '@env' {
  // Firebase Configuration
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;

  // Google Services
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GOOGLE_IOS_CLIENT_ID: string;
  export const GOOGLE_ANDROID_CLIENT_ID: string;
  export const GOOGLE_MAPS_API_KEY: string;

  // Carbon API Services
  export const CARBON_API_KEY: string;
  export const CARBON_API_BASE_URL: string;
  export const CARBON_INTERFACE_API_KEY: string;

  // Security
  export const ENCRYPTION_SECRET_KEY: string;
  export const JWT_SECRET: string;
  export const BIOMETRIC_ENABLED: string;

  // Development
  export const DEBUG_MODE: string;
  export const PERFORMANCE_MONITORING: string;
  export const ANALYTICS_ENABLED: string;
  export const CRASH_REPORTING: string;

  // Feature Flags
  export const ENABLE_ML_PREDICTIONS: string;
  export const ENABLE_BARCODE_SCANNER: string;
  export const ENABLE_LOCATION_TRACKING: string;
  export const ENABLE_SOCIAL_FEATURES: string;
  export const ENABLE_ACHIEVEMENTS: string;

  // API Endpoints
  export const API_BASE_URL: string;
  export const WEBSOCKET_URL: string;

  // Third Party Services
  export const SENTRY_DSN: string;
  export const AMPLITUDE_API_KEY: string;

  // Development Settings
  export const FLIPPER_ENABLED: string;
  export const STORYBOOK_ENABLED: string;
  export const DETOX_ENABLED: string;
}
