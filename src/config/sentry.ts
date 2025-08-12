/**
 * Sentry Configuration for Error Monitoring and Crash Reporting
 * Comprehensive error tracking and performance monitoring setup
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Development mock DSN (replace with actual production DSN)
const SENTRY_DSN = __DEV__
  ? '' // No Sentry in development
  : process.env.SENTRY_DSN ?? 'https://your-actual-dsn@sentry.io/project-id';

// Application metadata
const APP_VERSION = require('../../package.json').version;
const APP_BUILD = process.env.APP_BUILD_NUMBER ?? '1';

/**
 * Initialize Sentry with comprehensive configuration
 */
export const initSentry = (): void => {
  if (!SENTRY_DSN || __DEV__) {
    console.log('🔧 Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // App metadata
    release: `com.kindred.carbontracker@${APP_VERSION}+${APP_BUILD}`,
    environment: __DEV__ ? 'development' : 'production',

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Native crash handling
    enableNativeCrashHandling: true,
    enableNativeNagger: false,

    // JavaScript error handling
    enableJSCrashHandling: true,

    // Debug options
    debug: __DEV__,

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Tracing integrations
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        enableAppStartTracking: true,

        // Routing instrumentation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],

    // Before send filter for sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.exception) {
        const error = hint.originalException;

        // Don't send network errors for development
        if (__DEV__ && error?.message?.includes('Network Error')) {
          return null;
        }

        // Filter sensitive data from error messages
        if (event.message) {
          event.message = sanitizeErrorMessage(event.message);
        }

        if (event.exception.values) {
          for (const exception of event.exception.values) {
            if (exception.value) {
              exception.value = sanitizeErrorMessage(exception.value);
            }
          }
        }
      }

      // Remove sensitive context data
      if (event.contexts?.device) {
        delete event.contexts.device.device_unique_id;
      }

      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },

    // Performance filters
    beforeTransaction(transaction) {
      // Sample critical transactions at higher rate
      if (transaction.name?.includes('CarbonCalculation')) {
        transaction.sampled = Math.random() < 0.5; // 50% for carbon calculations
      }

      // Skip noisy transactions
      if (
        transaction.name?.includes('Metro') ||
        transaction.name?.includes('__DEV__')
      ) {
        return null;
      }

      return transaction;
    },
  });

  // Set global context
  Sentry.setContext('app', {
    version: APP_VERSION,
    build: APP_BUILD,
    platform: Platform.OS,
    platformVersion: Platform.Version,
    bundle_id: 'com.kindred.carbontracker',
  });

  console.log('🚨 Sentry initialized for error monitoring');
};

/**
 * Custom error reporting with enhanced context
 */
export const reportError = (
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error',
): string | undefined => {
  if (!SENTRY_DSN || __DEV__) {
    console.error('🔴 Error (Sentry disabled):', error, context);
    return undefined;
  }

  return Sentry.withScope(scope => {
    scope.setLevel(level);
    scope.setTag('component', 'error_reporter');

    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (typeof value === 'object') {
          scope.setContext(key, value);
        } else {
          scope.setTag(key, String(value));
        }
      }
    }

    return Sentry.captureException(error);
  });
};

/**
 * Report carbon calculation errors with specific context
 */
export const reportCarbonError = (
  error: Error,
  activityData: Record<string, any>,
  userId?: string,
): string | undefined => {
  return reportError(error, {
    type: 'carbon_calculation',
    activity_type: activityData.type,
    user_id: userId ? hashUserId(userId) : undefined,
    carbon_context: {
      ...activityData,
      // Remove sensitive location data
      location: activityData.location ? '[LOCATION_DATA]' : undefined,
    },
  });
};

/**
 * Report performance issues
 */
export const reportPerformanceIssue = (
  operation: string,
  duration: number,
  threshold: number,
  context?: Record<string, any>,
): void => {
  if (duration > threshold) {
    Sentry.addBreadcrumb({
      message: `Performance issue: ${operation}`,
      level: 'warning',
      data: {
        operation,
        duration,
        threshold,
        ...context,
      },
    });

    Sentry.captureMessage(
      `Performance threshold exceeded: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      'warning',
    );
  }
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email?: string): void => {
  if (!SENTRY_DSN || __DEV__) return;

  Sentry.setUser({
    id: hashUserId(userId),
    email: email ? hashEmail(email) : undefined,
  });
};

/**
 * Add breadcrumb for user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'user',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>,
): void => {
  if (!SENTRY_DSN || __DEV__) return;

  Sentry.addBreadcrumb({
    message: sanitizeErrorMessage(message),
    category,
    level,
    data: data ? sanitizeBreadcrumbData(data) : undefined,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Track carbon calculation events
 */
export const trackCarbonCalculation = (
  activityType: string,
  emissions: number,
  success: boolean,
  duration?: number,
): void => {
  addBreadcrumb(
    `Carbon calculation: ${activityType}`,
    'carbon',
    success ? 'info' : 'error',
    {
      activity_type: activityType,
      emissions: success ? emissions : undefined,
      success,
      duration,
    },
  );
};

/**
 * Create custom transaction for performance monitoring
 */
export const startTransaction = (
  name: string,
  operation: string,
): Sentry.Transaction | null => {
  if (!SENTRY_DSN || __DEV__) return null;

  return Sentry.startTransaction({
    name: sanitizeErrorMessage(name),
    op: operation,
    tags: {
      component: 'performance_monitoring',
    },
  });
};

/**
 * Flush Sentry events (useful before app termination)
 */
export const flushSentryEvents = async (timeout = 5000): Promise<boolean> => {
  if (!SENTRY_DSN || __DEV__) return true;

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.warn('Failed to flush Sentry events:', error);
    return false;
  }
};

/**
 * Configure Sentry for navigation tracking
 */
export const createNavigationInstrumentation =
  (): Sentry.ReactNavigationInstrumentation => {
    return new Sentry.ReactNavigationInstrumentation({
      enableTimeToInitialDisplay: true,
      enableTimeToFullDisplay: false, // Can cause performance issues
    });
  };

/**
 * Utility functions for data sanitization
 */

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/\b[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z|]{2,}\b/g, '[EMAIL]')
    .replace(/\b(?:\d{4}[\s-]?){3}\d{4}\b/g, '[CARD]')
    .replace(/\b\d{10,}\b/g, '[PHONE]')
    .replace(/bearer\s+[\w.-]+/gi, 'Bearer [TOKEN]')
    .replace(/password[\s"]*[:=][\s"]*[^\s"]+/gi, 'password: [PASSWORD]');
}

function sanitizeBreadcrumbData(
  data: Record<string, any>,
): Record<string, any> {
  const sanitized = { ...data };

  // Remove sensitive keys
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'email',
    'phone',
  ];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

function hashUserId(userId: string): string {
  // Simple hash for privacy (in production, use proper hashing)
  return `user_${userId.slice(-8)}`;
}

function hashEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '[EMAIL]';

  const username = parts[0];
  const domain = parts[1];

  return `${username.slice(0, 2)}***@${domain}`;
}

/**
 * Error boundary integration
 * Note: For React Native, use the ErrorBoundary component instead
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry instance for direct access if needed
export { Sentry };
