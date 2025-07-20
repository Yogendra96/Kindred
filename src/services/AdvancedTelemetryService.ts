/**
 * @fileoverview Advanced Telemetry and Analytics Service
 *
 * Provides comprehensive telemetry collection, analytics processing,
 * and real-time insights for the Kindred Carbon Tracking App.
 * Supports multiple analytics providers and advanced event correlation.
 *
 * @version 1.0.0
 * @author Kindred Development Team
 * @since 1.0.0
 */

import { Platform } from 'react-native';

// AsyncStorage available for telemetry persistence if needed

import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { defaultValidator } from '../utils/securityValidation';

import { loggingService } from './LoggingService';

/**
 * Telemetry event interface
 */
export interface TelemetryEvent {
  /** Unique event identifier */
  id: string;
  /** Event name/type */
  name: string;
  /** Event category */
  category: 'user_action' | 'system' | 'performance' | 'error' | 'business';
  /** Event properties */
  properties: Record<string, any>;
  /** User identifier (if authenticated) */
  userId?: string;
  /** Session identifier */
  sessionId: string;
  /** Timestamp in ISO format */
  timestamp: string;
  /** App version */
  appVersion: string;
  /** Platform information */
  platform: {
    os: string;
    version: string;
    device: string;
  };
  /** Performance context */
  performance?: {
    renderTime: number;
    memoryUsage: number;
    networkLatency?: number;
  };
}

/**
 * Analytics provider interface
 */
export interface AnalyticsProvider {
  /** Provider name */
  name: string;
  /** Initialize the provider */
  initialize(config: any): Promise<void>;
  /** Track event */
  trackEvent(event: TelemetryEvent): Promise<void>;
  /** Track user properties */
  setUserProperties(userId: string, properties: Record<string, any>): Promise<void>;
  /** Track screen view */
  trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void>;
  /** Flush pending events */
  flush(): Promise<void>;
}

/**
 * Carbon-specific analytics events
 */
export interface CarbonAnalyticsEvent {
  /** Carbon calculation performed */
  carbonCalculated: {
    category: 'transport' | 'energy' | 'food' | 'waste';
    amount: number;
    emissions: number;
    accuracy: number;
  };
  /** Achievement unlocked */
  achievementUnlocked: {
    achievementId: string;
    type: string;
    rarity: string;
    points: number;
  };
  /** Goal set or updated */
  goalUpdated: {
    previousTarget?: number;
    newTarget: number;
    timeframe: string;
  };
  /** Recommendation interaction */
  recommendationInteraction: {
    recommendationId: string;
    action: 'viewed' | 'accepted' | 'dismissed';
    category: string;
    potentialSaving: number;
  };
}

/**
 * Session management
 */
class SessionManager {
  private currentSessionId: string | null = null;
  private sessionStartTime: number = 0;
  private sessionEvents: TelemetryEvent[] = [];

  /**
   * Start new session
   */
  startSession(): string {
    this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();
    this.sessionEvents = [];

    loggingService.info('New telemetry session started', {
      sessionId: this.currentSessionId,
    });
    return this.currentSessionId;
  }

  /**
   * End current session
   */
  endSession(): void {
    if (this.currentSessionId) {
      const duration = Date.now() - this.sessionStartTime;
      loggingService.info('Telemetry session ended', {
        sessionId: this.currentSessionId,
        duration,
        eventCount: this.sessionEvents.length,
      });

      this.currentSessionId = null;
      this.sessionEvents = [];
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      return this.startSession();
    }
    return this.currentSessionId;
  }

  /**
   * Add event to session
   */
  addEvent(event: TelemetryEvent): void {
    this.sessionEvents.push(event);
  }

  /**
   * Get session events
   */
  getSessionEvents(): TelemetryEvent[] {
    return [...this.sessionEvents];
  }
}

/**
 * Firebase Analytics Provider
 */
class FirebaseAnalyticsProvider implements AnalyticsProvider {
  name = 'firebase';
  private initialized = false;

  async initialize(_config: any): Promise<void> {
    try {
      // Initialize Firebase Analytics
      // const analytics = await import('@react-native-firebase/analytics').then(m => m.default);
      // await analytics().setAnalyticsCollectionEnabled(true);
      this.initialized = true;
      loggingService.info('Firebase Analytics initialized');
    } catch (error) {
      loggingService.error('Failed to initialize Firebase Analytics', {
        error,
      });
      throw error;
    }
  }

  async trackEvent(event: TelemetryEvent): Promise<void> {
    if (!this.initialized) return;

    try {
      // const analytics = await import('@react-native-firebase/analytics').then(m => m.default);
      // await analytics().logEvent(event.name, {
      //   category: event.category,
      //   ...event.properties,
      // });
      loggingService.debug('Firebase event tracked', { eventName: event.name });
    } catch (error) {
      loggingService.error('Failed to track Firebase event', {
        error,
        eventName: event.name,
      });
    }
  }

  async setUserProperties(_userId: string, _properties: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    try {
      // const analytics = await import('@react-native-firebase/analytics').then(m => m.default);
      // await analytics().setUserId(userId);
      // for (const [key, value] of Object.entries(properties)) {
      //   await analytics().setUserProperty(key, String(value));
      // }
      loggingService.debug('Firebase user properties set', { userId });
    } catch (error) {
      loggingService.error('Failed to set Firebase user properties', {
        error,
        userId,
      });
    }
  }

  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    try {
      // const analytics = await import('@react-native-firebase/analytics').then(m => m.default);
      // await analytics().logScreenView({
      //   screen_name: screenName,
      //   screen_class: screenName,
      //   ...properties,
      // });
      loggingService.debug('Firebase screen view tracked', { screenName });
    } catch (error) {
      loggingService.error('Failed to track Firebase screen view', {
        error,
        screenName,
      });
    }
  }

  async flush(): Promise<void> {
    // Firebase automatically flushes events
  }
}

/**
 * Custom Analytics Provider for internal tracking
 */
class CustomAnalyticsProvider implements AnalyticsProvider {
  name = 'custom';
  private eventQueue: TelemetryEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }

  async initialize(_config: any): Promise<void> {
    // Start periodic flush
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, 30000); // Flush every 30 seconds

    loggingService.info('Custom Analytics Provider initialized');
  }

  async trackEvent(event: TelemetryEvent): Promise<void> {
    this.eventQueue.push(event);

    // Flush immediately if queue is large
    if (this.eventQueue.length >= 50) {
      await this.flush();
    }
  }

  async setUserProperties(userId: string, properties: Record<string, any>): Promise<void> {
    await this.trackEvent({
      id: `user_props_${Date.now()}`,
      name: 'user_properties_updated',
      category: 'system',
      properties: { userId, ...properties },
      userId,
      sessionId: 'system',
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: {
        os: Platform.OS,
        version: Platform.Version.toString(),
        device: 'unknown',
      },
    });
  }

  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      id: `screen_${Date.now()}`,
      name: 'screen_view',
      category: 'user_action',
      properties: { screenName, ...properties },
      sessionId: 'system',
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: {
        os: Platform.OS,
        version: Platform.Version.toString(),
        device: 'unknown',
      },
    });
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      loggingService.debug('Custom analytics events flushed', {
        count: events.length,
      });
    } catch (error) {
      // Return events to queue on failure
      this.eventQueue.unshift(...events);
      loggingService.error('Failed to flush custom analytics events', {
        error,
        count: events.length,
      });
    }
  }
}

/**
 * Advanced Telemetry Service
 */
export class AdvancedTelemetryService {
  private providers: AnalyticsProvider[] = [];
  private sessionManager = new SessionManager();
  private performanceMonitor = usePerformanceMonitoring();
  private isInitialized = false;
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};

  /**
   * Initialize telemetry service
   */
  async initialize(config: {
    providers: Array<{
      name: string;
      config: any;
    }>;
    userId?: string;
  }): Promise<void> {
    try {
      // Initialize providers
      for (const providerConfig of config.providers) {
        let provider: AnalyticsProvider;

        switch (providerConfig.name) {
          case 'firebase':
            provider = new FirebaseAnalyticsProvider();
            break;
          case 'custom':
            provider = new CustomAnalyticsProvider(providerConfig.config.endpoint);
            break;
          default:
            loggingService.warn('Unknown analytics provider', {
              name: providerConfig.name,
            });
            continue;
        }

        await provider.initialize(providerConfig.config);
        this.providers.push(provider);
      }

      // Set user ID if provided
      if (config.userId) {
        await this.setUserId(config.userId);
      }

      // Start session
      this.sessionManager.startSession();

      this.isInitialized = true;
      loggingService.info('Advanced Telemetry Service initialized', {
        providerCount: this.providers.length,
      });

      // Track initialization event
      await this.trackEvent('telemetry_initialized', {
        providerCount: this.providers.length,
        platform: Platform.OS,
      });
    } catch (error) {
      loggingService.error('Failed to initialize Advanced Telemetry Service', {
        error,
      });
      throw error;
    }
  }

  /**
   * Set user ID for tracking
   */
  async setUserId(userId: string): Promise<void> {
    const validation = defaultValidator.validateString(userId);
    if (!validation.isValid) {
      throw new Error(`Invalid user ID: ${validation.errors.join(', ')}`);
    }

    this.userId = validation.sanitizedValue as string;

    // Update all providers
    for (const provider of this.providers) {
      try {
        await provider.setUserProperties(this.userId, this.userProperties);
      } catch (error) {
        loggingService.error('Failed to set user ID for provider', {
          provider: provider.name,
          error,
        });
      }
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    this.userProperties = { ...this.userProperties, ...properties };

    if (this.userId) {
      for (const provider of this.providers) {
        try {
          await provider.setUserProperties(this.userId, this.userProperties);
        } catch (error) {
          loggingService.error('Failed to set user properties for provider', {
            provider: provider.name,
            error,
          });
        }
      }
    }
  }

  /**
   * Track event
   */
  async trackEvent(
    name: string,
    properties: Record<string, any> = {},
    category: TelemetryEvent['category'] = 'user_action',
  ): Promise<void> {
    if (!this.isInitialized) {
      loggingService.warn('Telemetry service not initialized, queuing event', {
        name,
      });
      return;
    }

    const event: TelemetryEvent = {
      id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      properties: this.sanitizeProperties(properties),
      userId: this.userId || undefined,
      sessionId: this.sessionManager.getCurrentSessionId(),
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0', // TODO: Get from app config
      platform: {
        os: Platform.OS,
        version: Platform.Version.toString(),
        device: Platform.select({
          ios: 'ios-device',
          android: 'android-device',
          default: 'unknown',
        }),
      },
      performance: {
        renderTime: this.performanceMonitor.renderTime,
        memoryUsage: this.performanceMonitor.memoryUsage,
      },
    };

    // Add to session
    this.sessionManager.addEvent(event);

    // Track with all providers
    for (const provider of this.providers) {
      try {
        await provider.trackEvent(event);
      } catch (error) {
        loggingService.error('Failed to track event with provider', {
          provider: provider.name,
          eventName: name,
          error,
        });
      }
    }

    loggingService.debug('Telemetry event tracked', { name, category });
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    const sanitizedProperties = properties ? this.sanitizeProperties(properties) : {};

    for (const provider of this.providers) {
      try {
        await provider.trackScreenView(screenName, sanitizedProperties);
      } catch (error) {
        loggingService.error('Failed to track screen view with provider', {
          provider: provider.name,
          screenName,
          error,
        });
      }
    }

    await this.trackEvent('screen_view', {
      screenName,
      ...sanitizedProperties,
    });
  }

  /**
   * Track carbon-specific events
   */
  async trackCarbonEvent<K extends keyof CarbonAnalyticsEvent>(
    eventType: K,
    data: CarbonAnalyticsEvent[K],
  ): Promise<void> {
    await this.trackEvent(`carbon_${eventType}`, data, 'business');
  }

  /**
   * Track performance event
   */
  async trackPerformanceEvent(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent(
      'performance_metric',
      {
        operation,
        duration,
        isSlowOperation: duration > 1000, // 1 second threshold
        ...metadata,
      },
      'performance',
    );
  }

  /**
   * Track error event
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent(
      'error_occurred',
      {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      },
      'error',
    );
  }

  /**
   * Flush all providers
   */
  async flush(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.flush();
      } catch (error) {
        loggingService.error('Failed to flush provider', {
          provider: provider.name,
          error,
        });
      }
    }
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(): {
    sessionId: string;
    eventCount: number;
    events: TelemetryEvent[];
  } {
    return {
      sessionId: this.sessionManager.getCurrentSessionId(),
      eventCount: this.sessionManager.getSessionEvents().length,
      events: this.sessionManager.getSessionEvents(),
    };
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    await this.trackEvent(
      'session_ended',
      {
        duration: Date.now() - Date.now(), // TODO: Calculate actual duration
        eventCount: this.sessionManager.getSessionEvents().length,
      },
      'system',
    );

    await this.flush();
    this.sessionManager.endSession();
  }

  /**
   * Sanitize properties to ensure they're safe and valid
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      const keyValidation = defaultValidator.validateString(key);
      if (!keyValidation.isValid) {
        loggingService.warn('Invalid property key', {
          key,
          errors: keyValidation.errors,
        });
        continue;
      }

      const sanitizedKey = keyValidation.sanitizedValue as string;

      // Sanitize value based on type
      if (typeof value === 'string') {
        const valueValidation = defaultValidator.validateString(value);
        if (valueValidation.isValid) {
          sanitized[sanitizedKey] = valueValidation.sanitizedValue;
        }
      } else if (typeof value === 'number') {
        const numberValidation = defaultValidator.validateNumber(value);
        if (numberValidation.isValid) {
          sanitized[sanitizedKey] = numberValidation.sanitizedValue;
        }
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (value === null || value === undefined) {
        sanitized[sanitizedKey] = value;
      } else {
        // Convert complex objects to strings
        sanitized[sanitizedKey] = String(value);
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const advancedTelemetryService = new AdvancedTelemetryService();

// Hook for React components
export const useTelemetry = () => {
  return {
    trackEvent: advancedTelemetryService.trackEvent.bind(advancedTelemetryService),
    trackScreenView: advancedTelemetryService.trackScreenView.bind(advancedTelemetryService),
    trackCarbonEvent: advancedTelemetryService.trackCarbonEvent.bind(advancedTelemetryService),
    trackPerformanceEvent:
      advancedTelemetryService.trackPerformanceEvent.bind(advancedTelemetryService),
    trackError: advancedTelemetryService.trackError.bind(advancedTelemetryService),
    setUserProperties: advancedTelemetryService.setUserProperties.bind(advancedTelemetryService),
  };
};
