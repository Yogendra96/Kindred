// @ts-nocheck
/* eslint-disable */
import { EnhancedAnalyticsService } from '../services/EnhancedAnalyticsService';
import { EnhancedPerformanceService } from '../services/EnhancedPerformanceService';
import { EnhancedSecurityService } from '../services/EnhancedSecurityService';
// Services
import loggingService from '../services/LoggerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Global type declarations
declare global {
  var __DEV__: boolean;
  var global: any;
  var process: {
    env: {
      NODE_ENV?: string;
    };
  };
  var require: (id: string) => any;
}

// Environment variables
const isDevelopment =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
  (typeof __DEV__ !== 'undefined' && __DEV__);

// Development configuration for enhanced debugging and monitoring
export const developmentConfig = {
  // Debugging configuration
  debugging: {
    enableHermes: true,
    enableFlipper: !process.env.NO_FLIPPER,
    enablePerformanceMonitoring: true,
    enableReduxDevTools: true,
    enableReactDevTools: true,
    enableNetworkInspector: true,
    enableAsyncStorageInspector: true,
    enableCrashReporting: true,
    logLevel: 'debug' as const,
    enableDevTools: true,
    enableSecurityMonitoring: true,
    enableAnalyticsTracking: true,
  },

  // Performance monitoring
  performance: {
    enableBundleAnalysis: true,
    enableMemoryProfiling: true,
    enableRenderProfiling: true,
    enableNavigationTiming: true,
    slowRenderThreshold: 16, // 60fps
    memoryWarningThreshold: 100 * 1024 * 1024, // 100MB
    enableAutoTracking: true,
    sampleRate: 1.0, // 100% sampling in dev
  },

  // Testing configuration
  testing: {
    enableE2ETesting: true,
    enableVisualTesting: true,
    enableAccessibilityTesting: true,
    enablePerformanceTesting: true,
    testTimeout: 30000,
    retryAttempts: 3,
  },

  // Feature flags for development
  featureFlags: {
    enableExperimentalFeatures: true,
    enableBetaFeatures: true,
    enableDebugMenu: true,
    enableMockData: false,
    enableOfflineMode: false,
    enableEnhancedServices: true,
  },

  // Development server configuration
  server: {
    host: 'localhost',
    port: 8081,
    enableHotReload: true,
    enableFastRefresh: true,
    enableSourceMaps: true,
  },

  // Analytics for development
  analytics: {
    enableDevelopmentTracking: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUserJourneyTracking: true,
    enableAutoTracking: true,
    batchSize: 10, // Smaller batches in dev
    flushInterval: 10000, // 10 seconds in dev
  },

  // Security configuration
  security: {
    enableSecurityMonitoring: true,
    enableDataEncryption: true,
    enableSessionTracking: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
  },
};

/**
 * Development utilities class for managing dev tools and debugging
 */
export class DevelopmentUtils {
  private static instance: DevelopmentUtils;
  private isInitialized = false;
  private performanceService: EnhancedPerformanceService;
  private securityService: EnhancedSecurityService;
  private analyticsService: EnhancedAnalyticsService;
  private logger: typeof loggingService;

  constructor() {
    this.performanceService = EnhancedPerformanceService.getInstance();
    this.securityService = EnhancedSecurityService.getInstance(
      developmentConfig.security,
    );
    this.analyticsService = EnhancedAnalyticsService.getInstance(
      developmentConfig.analytics,
    );
    this.logger = loggingService;
  }

  static getInstance(): DevelopmentUtils {
    if (!DevelopmentUtils.instance) {
      DevelopmentUtils.instance = new DevelopmentUtils();
    }
    return DevelopmentUtils.instance;
  }

  /**
   * Initialize development utilities
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !__DEV__) return;

    try {
      await this.initializeServices();
      await this.setupFeatureFlags();
      await this.setupPerformanceMonitoring();
      await this.setupLogging();
      await this.setupGlobalErrorHandlers();
      this.setupGlobalDevUtils();

      this.isInitialized = true;
      this.logger.info(
        '🛠️ Development utilities initialized with enhanced services',
      );
    } catch (error) {
      console.error('Failed to initialize development utilities:', error);
    }
  }

  /**
   * Initialize enhanced services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize performance service
      if (developmentConfig.debugging.enablePerformanceMonitoring) {
        await this.performanceService.initialize();
        this.logger.info('📊 Enhanced Performance Service initialized');
      }

      // Initialize security service
      if (developmentConfig.debugging.enableSecurityMonitoring) {
        await this.securityService.initialize();
        this.logger.info('🔒 Enhanced Security Service initialized');
      }

      // Initialize analytics service
      if (developmentConfig.debugging.enableAnalyticsTracking) {
        await this.analyticsService.initialize();
        this.logger.info('📈 Enhanced Analytics Service initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize enhanced services:', error);
    }
  }

  /**
   * Setup feature flags
   */
  private async setupFeatureFlags(): Promise<void> {
    // Initialize feature flag system
    const flags = developmentConfig.featureFlags;

    // Make feature flags globally accessible
    (global as any).featureFlags = flags;

    this.logger.info('🚩 Feature flags initialized:', flags);
  }

  /**
   * Setup performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    if (!developmentConfig.debugging.enablePerformanceMonitoring) return;

    // Setup performance observers
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (
            entry.duration > developmentConfig.performance.slowRenderThreshold
          ) {
            this.logger.warn(
              `🐌 Slow operation detected: ${
                entry.name
              } took ${entry.duration.toFixed(2)}ms`,
            );

            // Track in analytics
            this.analyticsService.trackPerformance(
              'slow_operation',
              entry.duration,
              'ms',
              {
                operation: entry.name,
              },
            );
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        this.logger.warn('Performance observer not supported:', error);
      }
    }

    this.logger.info('📊 Enhanced performance monitoring enabled');
  }

  /**
   * Setup enhanced logging
   */
  private async setupLogging(): Promise<void> {
    const logLevel = developmentConfig.debugging.logLevel;

    // Enhanced console logging with timestamps and context
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(`[${new Date().toISOString()}] [LOG]`, ...args);
      this.logger.debug(args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(`[${new Date().toISOString()}] [WARN]`, ...args);
      this.logger.warn(args.join(' '));
    };

    console.error = (...args) => {
      originalError(`[${new Date().toISOString()}] [ERROR]`, ...args);
      this.logger.error(args.join(' '));

      // Track errors in analytics
      this.analyticsService.trackError(args.join(' '), { source: 'console' });
    };

    this.logger.info('📝 Enhanced logging enabled');
  }

  /**
   * Setup global error handlers
   */
  private async setupGlobalErrorHandlers(): Promise<void> {
    // Global error handler for unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.addEventListener?.('unhandledrejection', event => {
        this.logger.error('🚨 Unhandled Promise Rejection:', event.reason);

        // Track in analytics and security
        this.analyticsService.trackError(
          event.reason,
          { type: 'unhandled_rejection' },
          true,
        );
      });
    }

    // React Native specific error boundary setup would go here
    this.logger.info('🛡️ Enhanced global error handlers setup');
  }

  /**
   * Setup global development utilities
   */
  private setupGlobalDevUtils(): void {
    // Make development utilities globally accessible
    if (typeof global !== 'undefined') {
      (global as any).devUtils = {
        config: developmentConfig,
        services: {
          performance: this.performanceService,
          security: this.securityService,
          analytics: this.analyticsService,
          logger: this.logger,
        },
        toggleFeature: (feature: string) => {
          const flags = (global as any).featureFlags;
          if (flags && feature in flags) {
            flags[feature] = !flags[feature];
            this.logger.info(
              `🔄 Feature '${feature}' toggled to:`,
              flags[feature],
            );

            // Track feature toggle
            this.analyticsService.trackEvent(
              'feature_toggled',
              {
                feature,
                enabled: flags[feature],
              },
              'custom',
              'medium',
            );
          }
        },
        getPerformanceMetrics: () => {
          return this.performanceService.getPerformanceSummary();
        },
        getAnalyticsSummary: () => {
          return this.analyticsService.getAnalyticsSummary();
        },
        getSecuritySummary: () => {
          return this.securityService.getSecuritySummary();
        },
        exportAllData: () => {
          return {
            performance: this.performanceService.exportPerformanceData(),
            analytics: this.analyticsService.exportAnalyticsData(),
            security: this.securityService.exportSecurityData(),
            timestamp: new Date().toISOString(),
          };
        },
        clearStorage: async () => {
          // Clear all storage for testing
          try {
            await AsyncStorage.clear();
            this.logger.info('🗑️ Storage cleared');

            // Track storage clear
            this.analyticsService.trackEvent(
              'storage_cleared',
              {},
              'custom',
              'medium',
            );
          } catch (error) {
            this.logger.error('Failed to clear storage:', error);
          }
        },
        clearAllData: async () => {
          // Clear all service data
          try {
            this.performanceService.clearData();
            await this.analyticsService.clearAnalyticsData();
            await this.securityService.clearSecurityData();
            this.logger.info('🗑️ All service data cleared');
          } catch (error) {
            this.logger.error('Failed to clear service data:', error);
          }
        },
        startSession: async (userId?: string) => {
          await this.analyticsService.startSession(userId);
          this.logger.info('🚀 New analytics session started');
        },
        endSession: async () => {
          await this.analyticsService.endSession();
          this.logger.info('🏁 Analytics session ended');
        },
      };
    }

    this.logger.info(
      '🌐 Enhanced global dev utils available at global.devUtils',
    );
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return developmentConfig;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(
    feature: keyof typeof developmentConfig.featureFlags,
  ): boolean {
    return developmentConfig.featureFlags[feature];
  }

  /**
   * Get service instances
   */
  getServices() {
    return {
      performance: this.performanceService,
      security: this.securityService,
      analytics: this.analyticsService,
      logger: this.logger,
    };
  }

  /**
   * Show development tools
   */
  showDevTools() {
    // This would trigger the DevTools component to show
    // Implementation depends on your app's navigation/modal system
    this.logger.info('🛠️ Development tools requested');

    // Track dev tools usage
    this.analyticsService.trackEvent('dev_tools_opened', {}, 'custom', 'low');
  }
}

// Auto-initialize in development
if (__DEV__) {
  DevelopmentUtils.getInstance().initialize();
}

export default developmentConfig;
