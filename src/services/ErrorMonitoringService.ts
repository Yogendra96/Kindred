/**
 * Enhanced Error Monitoring Service
 * Comprehensive error tracking, crash reporting, and performance monitoring
 */

import type { Sentry } from '../config/sentry';
import {
  initSentry,
  reportError,
  reportCarbonError,
  reportPerformanceIssue,
  setUserContext,
  addBreadcrumb,
  trackCarbonCalculation,
  startTransaction,
  flushSentryEvents,
} from '../config/sentry';
import type { EnhancedAnalyticsService } from './EnhancedAnalyticsService';
import type { EnhancedSecurityService } from './EnhancedSecurityService';

export interface ErrorContext {
  component?: string;
  screen?: string;
  action?: string;
  userId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memory?: number;
  cpu?: number;
  networkRequests?: number;
  renderCount?: number;
}

export interface CrashReport {
  error: Error;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  appVersion: string;
  platform: string;
  deviceInfo?: Record<string, any>;
}

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  affectedUsers: number;
  severity: string;
}

/**
 * Enhanced Error Monitoring Service
 * Provides comprehensive error tracking and performance monitoring
 */
class ErrorMonitoringServiceImpl {
  private initialized = false;
  private errorQueue: CrashReport[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorPatterns = new Map<string, ErrorPattern>();
  private currentTransaction: Sentry.Transaction | null = null;

  // Service dependencies
  private analyticsService?: EnhancedAnalyticsService;
  private securityService?: EnhancedSecurityService;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the error monitoring service
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize Sentry
      initSentry();

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      this.initialized = true;

      console.log('🚨 ErrorMonitoringService initialized');

      // Track service initialization
      addBreadcrumb('ErrorMonitoringService initialized', 'service', 'info');
    } catch (error) {
      console.error('Failed to initialize ErrorMonitoringService:', error);
      throw error;
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', event => {
        this.reportError(new Error(event.reason), {
          component: 'global',
          action: 'unhandled_promise_rejection',
          severity: 'high',
        });
      });
    }

    // Set up React Native specific error handlers
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Capture console.error calls as breadcrumbs
      addBreadcrumb(`Console error: ${args.join(' ')}`, 'console', 'error');

      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor app state changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        addBreadcrumb(
          `App visibility changed: ${document.hidden ? 'hidden' : 'visible'}`,
          'app_state',
          'info',
        );
      });
    }
  }

  /**
   * Report an error with enhanced context
   */
  public reportError(
    error: Error,
    context: ErrorContext = {},
  ): string | undefined {
    try {
      // Create crash report
      const crashReport: CrashReport = {
        error,
        stack: error.stack,
        context,
        timestamp: Date.now(),
        appVersion: require('../../package.json').version,
        platform: 'react-native',
      };

      // Add to error queue
      this.errorQueue.push(crashReport);

      // Update error patterns
      this.updateErrorPatterns(error, context);

      // Report to Sentry
      const eventId = reportError(
        error,
        {
          component: context.component,
          screen: context.screen,
          action: context.action,
          severity: context.severity,
          ...context.extra,
        },
        this.getSentryLevel(context.severity),
      );

      // Track in analytics if available
      if (this.analyticsService) {
        this.analyticsService.trackEvent('error_occurred', {
          error_type: error.name,
          error_message: error.message.substring(0, 100),
          component: context.component,
          severity: context.severity || 'medium',
          has_stack: !!error.stack,
        });
      }

      // Log locally for debugging
      console.error('🔴 Error reported:', {
        message: error.message,
        context,
        eventId,
      });

      return eventId;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return undefined;
    }
  }

  /**
   * Report carbon calculation specific errors
   */
  public reportCarbonError(
    error: Error,
    activityData: Record<string, any>,
    userId?: string,
  ): string | undefined {
    const eventId = reportCarbonError(error, activityData, userId);

    // Add to analytics
    if (this.analyticsService) {
      this.analyticsService.trackEvent('carbon_calculation_error', {
        error_type: error.name,
        activity_type: activityData.type,
        has_location: !!activityData.location,
      });
    }

    return eventId;
  }

  /**
   * Report performance issues
   */
  public reportPerformanceIssue(
    metrics: PerformanceMetrics,
    threshold?: number,
  ): void {
    const defaultThreshold = this.getPerformanceThreshold(metrics.operation);
    const actualThreshold = threshold || defaultThreshold;

    if (metrics.duration > actualThreshold) {
      reportPerformanceIssue(
        metrics.operation,
        metrics.duration,
        actualThreshold,
        {
          memory: metrics.memory,
          cpu: metrics.cpu,
          network_requests: metrics.networkRequests,
          render_count: metrics.renderCount,
        },
      );

      // Track in analytics
      if (this.analyticsService) {
        this.analyticsService.trackEvent('performance_issue', {
          operation: metrics.operation,
          duration: metrics.duration,
          threshold: actualThreshold,
          severity: this.getPerformanceSeverity(
            metrics.duration,
            actualThreshold,
          ),
        });
      }
    }

    // Store metrics for analysis
    this.performanceMetrics.push(metrics);

    // Keep only recent metrics (last 100)
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUser(
    userId: string,
    email?: string,
    additionalData?: Record<string, any>,
  ): void {
    setUserContext(userId, email);

    // Add breadcrumb for user context change
    addBreadcrumb('User context updated', 'auth', 'info', {
      user_id: userId.slice(-8), // Last 8 chars for privacy
      has_email: !!email,
      additional_fields: additionalData
        ? Object.keys(additionalData).length
        : 0,
    });
  }

  /**
   * Track carbon calculation events
   */
  public trackCarbonCalculation(
    activityType: string,
    emissions: number,
    success: boolean,
    duration?: number,
  ): void {
    trackCarbonCalculation(activityType, emissions, success, duration);

    // Also track in analytics
    if (this.analyticsService) {
      this.analyticsService.trackEvent('carbon_calculation_tracked', {
        activity_type: activityType,
        success,
        duration: duration || 0,
        emissions: success ? emissions : undefined,
      });
    }
  }

  /**
   * Start a performance transaction
   */
  public startTransaction(
    name: string,
    operation: string,
  ): Sentry.Transaction | null {
    this.currentTransaction = startTransaction(name, operation);
    return this.currentTransaction;
  }

  /**
   * Finish the current transaction
   */
  public finishTransaction(): void {
    if (this.currentTransaction) {
      this.currentTransaction.finish();
      this.currentTransaction = null;
    }
  }

  /**
   * Add breadcrumb for user actions
   */
  public addBreadcrumb(
    message: string,
    category = 'user',
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    data?: Record<string, any>,
  ): void {
    addBreadcrumb(message, category, level, data);
  }

  /**
   * Get error statistics and patterns
   */
  public getErrorStatistics(): {
    totalErrors: number;
    recentErrors: CrashReport[];
    errorPatterns: ErrorPattern[];
    performanceMetrics: PerformanceMetrics[];
  } {
    const recentErrors = this.errorQueue.slice(-10); // Last 10 errors
    const errorPatterns = [...this.errorPatterns.values()]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Top 20 patterns

    return {
      totalErrors: this.errorQueue.length,
      recentErrors,
      errorPatterns,
      performanceMetrics: this.performanceMetrics.slice(-20), // Last 20 metrics
    };
  }

  /**
   * Clear error data (useful for testing)
   */
  public clearErrorData(): void {
    this.errorQueue = [];
    this.performanceMetrics = [];
    this.errorPatterns.clear();
  }

  /**
   * Flush pending error reports
   */
  public async flush(timeout = 5000): Promise<boolean> {
    return await flushSentryEvents(timeout);
  }

  /**
   * Check if service is healthy
   */
  public isHealthy(): boolean {
    return this.initialized;
  }

  /**
   * Set service dependencies
   */
  public setAnalyticsService(service: EnhancedAnalyticsService): void {
    this.analyticsService = service;
  }

  public setSecurityService(service: EnhancedSecurityService): void {
    this.securityService = service;
  }

  // Private helper methods

  private updateErrorPatterns(error: Error, context: ErrorContext): void {
    const errorKey = `${error.name}:${error.message.substring(0, 50)}`;
    const now = Date.now();

    if (this.errorPatterns.has(errorKey)) {
      const pattern = this.errorPatterns.get(errorKey)!;
      pattern.frequency++;
      pattern.lastSeen = now;
      pattern.affectedUsers++;
    } else {
      this.errorPatterns.set(errorKey, {
        errorType: error.name,
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
        affectedUsers: 1,
        severity: context.severity || 'medium',
      });
    }
  }

  private getSentryLevel(
    severity?: string,
  ): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'fatal';
      default:
        return 'error';
    }
  }

  private getPerformanceThreshold(operation: string): number {
    // Define performance thresholds for different operations
    const thresholds: Record<string, number> = {
      carbon_calculation: 2000, // 2 seconds for carbon calculations
      screen_navigation: 1000, // 1 second for screen navigation
      api_request: 5000, // 5 seconds for API requests
      database_query: 1000, // 1 second for database queries
      image_processing: 3000, // 3 seconds for image processing
      component_render: 100, // 100ms for component renders
      default: 2000, // 2 seconds default
    };

    return thresholds[operation] || thresholds.default;
  }

  private getPerformanceSeverity(duration: number, threshold: number): string {
    const ratio = duration / threshold;

    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }
}

// Singleton instance
export const ErrorMonitoringService = new ErrorMonitoringServiceImpl();

// Re-export for convenience
export * from '../config/sentry';
