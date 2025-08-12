/**
 * Comprehensive Observability Service for production monitoring
 * Includes APM, Real User Monitoring, Business Metrics, and Alerting
 */
import type { AppStateStatus } from 'react-native';
import { AppState, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { loggingService } from './LoggingService';

export interface MetricData {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: number;
  readonly tags: Record<string, string>;
  readonly dimensions?: Record<string, string>;
}

export interface BusinessMetric {
  readonly eventName: string;
  readonly userId?: string;
  readonly sessionId: string;
  readonly timestamp: number;
  readonly properties: Record<string, unknown>;
  readonly value?: number;
  readonly currency?: string;
}

export interface UserJourneyEvent {
  readonly stepName: string;
  readonly screenName: string;
  readonly action: string;
  readonly timestamp: number;
  readonly duration?: number;
  readonly success: boolean;
  readonly errorCode?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  readonly metricType: 'coreVitals' | 'custom' | 'network' | 'memory';
  readonly name: string;
  readonly value: number;
  readonly threshold?: number;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly timestamp: number;
  readonly context: Record<string, unknown>;
}

export interface AlertRule {
  readonly id: string;
  readonly name: string;
  readonly metricName: string;
  readonly condition: 'above' | 'below' | 'equals';
  readonly threshold: number;
  readonly duration: number; // seconds
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly enabled: boolean;
  readonly channels: ('email' | 'slack' | 'webhook')[];
}

export interface ObservabilityConfig {
  readonly enableRUM: boolean;
  readonly enableAPM: boolean;
  readonly enableBusinessMetrics: boolean;
  readonly enableErrorTracking: boolean;
  readonly sampleRate: number; // 0-1
  readonly bufferSize: number;
  readonly flushInterval: number; // milliseconds
  readonly alertingEnabled: boolean;
}

class ObservabilityService {
  private readonly config: ObservabilityConfig;
  private readonly metricsBuffer: MetricData[] = [];
  private readonly businessMetricsBuffer: BusinessMetric[] = [];
  private readonly journeyEventsBuffer: UserJourneyEvent[] = [];
  private readonly performanceMetricsBuffer: PerformanceMetric[] = [];

  private sessionId: string;
  private userId?: string;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private appStateSubscription?: any;
  private networkSubscription?: any;

  // Core Web Vitals tracking
  private readonly coreVitals = {
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0,
  };

  // Alert state tracking
  private readonly alertStates = new Map<
    string,
    {
      triggered: boolean;
      firstTriggered: number;
      lastTriggered: number;
      count: number;
    }
  >();

  constructor() {
    this.config = {
      enableRUM: true,
      enableAPM: true,
      enableBusinessMetrics: true,
      enableErrorTracking: true,
      sampleRate: 1.0, // 100% in development, reduce in production
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      alertingEnabled: true,
    };

    this.sessionId = this.generateSessionId();
  }

  public async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize session tracking
      await this.initializeSession();

      // Set up automatic flushing
      this.startPeriodicFlush();

      // Monitor app state changes
      this.setupAppStateMonitoring();

      // Monitor network changes
      this.setupNetworkMonitoring();

      // Track app startup metrics
      this.trackStartupMetrics(Date.now() - startTime);

      loggingService.info('Observability Service initialized', {
        sessionId: this.sessionId,
        platform: Platform.OS,
        enabledFeatures: {
          rum: this.config.enableRUM,
          apm: this.config.enableAPM,
          businessMetrics: this.config.enableBusinessMetrics,
        },
      });
    } catch (error) {
      loggingService.error('Failed to initialize Observability Service', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Track custom metrics
   */
  public trackMetric(data: Omit<MetricData, 'timestamp'>): void {
    if (!this.shouldSample()) return;

    const metric: MetricData = {
      ...data,
      timestamp: Date.now(),
    };

    this.metricsBuffer.push(metric);
    this.checkBufferSize();

    // Check for alerts
    if (this.config.alertingEnabled) {
      this.checkAlerts(metric);
    }

    loggingService.debug('Metric tracked', {
      metric: metric.name,
      value: metric.value,
    });
  }

  /**
   * Track business events
   */
  public trackBusinessEvent(
    data: Omit<BusinessMetric, 'sessionId' | 'timestamp'>,
  ): void {
    if (!this.config.enableBusinessMetrics || !this.shouldSample()) return;

    const event: BusinessMetric = {
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.businessMetricsBuffer.push(event);
    this.checkBufferSize();

    loggingService.debug('Business event tracked', {
      eventName: event.eventName,
    });
  }

  /**
   * Track user journey events
   */
  public trackUserJourney(data: Omit<UserJourneyEvent, 'timestamp'>): void {
    if (!this.config.enableRUM || !this.shouldSample()) return;

    const journeyEvent: UserJourneyEvent = {
      ...data,
      timestamp: Date.now(),
    };

    this.journeyEventsBuffer.push(journeyEvent);
    this.checkBufferSize();

    loggingService.debug('User journey tracked', {
      step: journeyEvent.stepName,
      screen: journeyEvent.screenName,
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(data: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enableAPM || !this.shouldSample()) return;

    const perfMetric: PerformanceMetric = {
      ...data,
      timestamp: Date.now(),
    };

    this.performanceMetricsBuffer.push(perfMetric);
    this.checkBufferSize();

    // Log performance issues immediately
    if (
      perfMetric.severity === 'critical' ||
      perfMetric.severity === 'warning'
    ) {
      loggingService.warn('Performance issue detected', {
        metric: perfMetric.name,
        value: perfMetric.value,
        threshold: perfMetric.threshold,
        severity: perfMetric.severity,
      });
    }
  }

  /**
   * Track Core Web Vitals
   */
  public trackCoreVitals(
    vital: keyof typeof this.coreVitals,
    value: number,
  ): void {
    this.coreVitals[vital] = value;

    this.trackPerformance({
      metricType: 'coreVitals',
      name: vital,
      value,
      threshold: this.getCoreVitalThreshold(vital),
      severity: this.getCoreVitalSeverity(vital, value),
      context: { sessionId: this.sessionId },
    });
  }

  /**
   * Track screen transitions
   */
  public trackScreenTransition(
    fromScreen: string,
    toScreen: string,
    duration: number,
  ): void {
    this.trackUserJourney({
      stepName: 'screen_transition',
      screenName: toScreen,
      action: 'navigate',
      duration,
      success: true,
      metadata: { fromScreen, toScreen },
    });

    this.trackMetric({
      name: 'screen_transition_duration',
      value: duration,
      unit: 'ms',
      tags: { fromScreen, toScreen },
    });
  }

  /**
   * Track API calls
   */
  public trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    errorMessage?: string,
  ): void {
    const success = status >= 200 && status < 300;

    this.trackPerformance({
      metricType: 'network',
      name: 'api_call_duration',
      value: duration,
      threshold: 2000, // 2 seconds
      severity:
        duration > 5000 ? 'critical' : duration > 2000 ? 'warning' : 'info',
      context: { endpoint, method, status, success },
    });

    this.trackBusinessEvent({
      eventName: 'api_call',
      properties: {
        endpoint,
        method,
        duration,
        status,
        success,
        errorMessage,
      },
    });
  }

  /**
   * Track user actions
   */
  public trackUserAction(
    action: string,
    screen: string,
    properties: Record<string, unknown> = {},
  ): void {
    this.trackBusinessEvent({
      eventName: 'user_action',
      userId: this.userId,
      properties: {
        action,
        screen,
        ...properties,
      },
    });
  }

  /**
   * Track errors with context
   */
  public trackError(
    error: Error,
    context: Record<string, unknown> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  ): void {
    if (!this.config.enableErrorTracking) return;

    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      platform: Platform.OS,
      severity,
      context,
    };

    // Log immediately for critical errors
    if (severity === 'critical' || severity === 'high') {
      loggingService.error('Critical error tracked', errorData);
    }

    this.trackBusinessEvent({
      eventName: 'error_occurred',
      userId: this.userId,
      properties: errorData,
    });
  }

  /**
   * Generate observability dashboard data
   */
  public getDashboardMetrics(): {
    coreVitals: typeof this.coreVitals;
    sessionMetrics: {
      sessionId: string;
      userId?: string;
      duration: number;
      screenViews: number;
      errors: number;
    };
    performanceOverview: {
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
      availability: number;
    };
    businessMetrics: {
      totalEvents: number;
      uniqueUsers: number;
      topEvents: Array<{ name: string; count: number }>;
    };
  } {
    const sessionStart = this.getSessionStartTime();
    const sessionDuration = sessionStart ? Date.now() - sessionStart : 0;

    const apiCalls = this.performanceMetricsBuffer.filter(
      m => m.metricType === 'network' && m.name === 'api_call_duration',
    );

    const errors = this.businessMetricsBuffer.filter(
      e => e.eventName === 'error_occurred',
    );

    const eventCounts = this.businessMetricsBuffer.reduce(
      (acc, event) => {
        acc[event.eventName] = (acc[event.eventName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      coreVitals: { ...this.coreVitals },
      sessionMetrics: {
        sessionId: this.sessionId,
        userId: this.userId,
        duration: sessionDuration,
        screenViews: this.journeyEventsBuffer.filter(
          e => e.stepName === 'screen_transition',
        ).length,
        errors: errors.length,
      },
      performanceOverview: {
        avgResponseTime:
          apiCalls.length > 0
            ? apiCalls.reduce((sum, call) => sum + call.value, 0) /
              apiCalls.length
            : 0,
        errorRate: apiCalls.length > 0 ? errors.length / apiCalls.length : 0,
        throughput: apiCalls.length,
        availability:
          apiCalls.length > 0
            ? apiCalls.filter(call => call.context.success === true).length /
              apiCalls.length
            : 1,
      },
      businessMetrics: {
        totalEvents: this.businessMetricsBuffer.length,
        uniqueUsers: new Set(
          this.businessMetricsBuffer.filter(e => e.userId).map(e => e.userId),
        ).size,
        topEvents,
      },
    };
  }

  /**
   * Flush all buffered data
   */
  public async flush(): Promise<void> {
    try {
      if (
        this.metricsBuffer.length === 0 &&
        this.businessMetricsBuffer.length === 0 &&
        this.journeyEventsBuffer.length === 0 &&
        this.performanceMetricsBuffer.length === 0
      ) {
        return;
      }

      const batchData = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        platform: Platform.OS,
        metrics: [...this.metricsBuffer],
        businessEvents: [...this.businessMetricsBuffer],
        journeyEvents: [...this.journeyEventsBuffer],
        performanceMetrics: [...this.performanceMetricsBuffer],
      };

      // In production, send to your observability platform (DataDog, New Relic, etc.)
      await this.sendToObservabilityPlatform(batchData);

      // Store locally as backup
      await this.storeLocalBackup(batchData);

      // Clear buffers
      this.clearBuffers();

      loggingService.debug('Observability data flushed', {
        metricsCount: batchData.metrics.length,
        businessEventsCount: batchData.businessEvents.length,
        journeyEventsCount: batchData.journeyEvents.length,
        performanceMetricsCount: batchData.performanceMetrics.length,
      });
    } catch (error) {
      loggingService.error('Failed to flush observability data', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Set user context
   */
  public setUserContext(
    userId: string,
    properties: Record<string, unknown> = {},
  ): void {
    this.userId = userId;

    this.trackBusinessEvent({
      eventName: 'user_identified',
      userId,
      properties,
    });

    loggingService.info('User context set', { userId });
  }

  /**
   * Create custom alert rule
   */
  public createAlertRule(rule: AlertRule): void {
    // In production, store in persistent storage or send to alerting system
    loggingService.info('Alert rule created', { rule: rule.name });
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private shouldSample(): boolean {
    return Math.random() <= this.config.sampleRate;
  }

  private async initializeSession(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'observability_session_start',
        Date.now().toString(),
      );

      this.trackBusinessEvent({
        eventName: 'session_started',
        properties: {
          platform: Platform.OS,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      loggingService.warn('Failed to initialize session', { error });
    }
  }

  private async getSessionStartTime(): Promise<number | null> {
    try {
      const startTime = await AsyncStorage.getItem(
        'observability_session_start',
      );
      return startTime ? parseInt(startTime, 10) : null;
    } catch {
      return null;
    }
  }

  private checkBufferSize(): void {
    if (
      this.metricsBuffer.length >= this.config.bufferSize ||
      this.businessMetricsBuffer.length >= this.config.bufferSize ||
      this.journeyEventsBuffer.length >= this.config.bufferSize ||
      this.performanceMetricsBuffer.length >= this.config.bufferSize
    ) {
      this.flush();
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  private setupNetworkMonitoring(): void {
    this.networkSubscription = NetInfo.addEventListener(state => {
      this.trackMetric({
        name: 'network_connection',
        value: state.isConnected ? 1 : 0,
        unit: 'boolean',
        tags: {
          type: state.type || 'unknown',
          isInternetReachable: String(state.isInternetReachable),
        },
      });
    });
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    this.trackBusinessEvent({
      eventName: 'app_state_change',
      properties: {
        state: nextAppState,
        timestamp: Date.now(),
      },
    });

    if (nextAppState === 'background') {
      this.flush(); // Flush data when app goes to background
    }
  };

  private trackStartupMetrics(duration: number): void {
    this.trackPerformance({
      metricType: 'custom',
      name: 'app_startup_time',
      value: duration,
      threshold: 3000, // 3 seconds
      severity:
        duration > 5000 ? 'critical' : duration > 3000 ? 'warning' : 'info',
      context: { platform: Platform.OS },
    });
  }

  private getCoreVitalThreshold(vital: keyof typeof this.coreVitals): number {
    const thresholds = {
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      timeToInteractive: 3800,
    };
    return thresholds[vital];
  }

  private getCoreVitalSeverity(
    vital: keyof typeof this.coreVitals,
    value: number,
  ): PerformanceMetric['severity'] {
    const threshold = this.getCoreVitalThreshold(vital);

    if (value > threshold * 2) return 'critical';
    if (value > threshold) return 'warning';
    return 'info';
  }

  private checkAlerts(metric: MetricData): void {
    // In production, check against configured alert rules
    // This is a simplified example
    const criticalThresholds = {
      api_response_time: 5000,
      error_rate: 0.05,
      memory_usage: 80,
    };

    const threshold =
      criticalThresholds[metric.name as keyof typeof criticalThresholds];
    if (threshold && metric.value > threshold) {
      this.triggerAlert({
        id: `alert_${metric.name}`,
        name: `High ${metric.name}`,
        metricName: metric.name,
        condition: 'above',
        threshold,
        duration: 60,
        severity: 'high',
        enabled: true,
        channels: ['webhook'],
      });
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alertState = this.alertStates.get(rule.id);
    const now = Date.now();

    if (!alertState) {
      this.alertStates.set(rule.id, {
        triggered: true,
        firstTriggered: now,
        lastTriggered: now,
        count: 1,
      });
    } else {
      alertState.triggered = true;
      alertState.lastTriggered = now;
      alertState.count++;
    }

    loggingService.warn('Alert triggered', {
      ruleName: rule.name,
      severity: rule.severity,
      threshold: rule.threshold,
    });

    this.trackBusinessEvent({
      eventName: 'alert_triggered',
      properties: {
        alertId: rule.id,
        alertName: rule.name,
        severity: rule.severity,
        metricName: rule.metricName,
        threshold: rule.threshold,
      },
    });
  }

  private async sendToObservabilityPlatform(data: unknown): Promise<void> {
    // In production, implement integration with your observability platform
    // Examples: DataDog, New Relic, Dynatrace, Elastic APM, etc.

    try {
      // Example implementation:
      // await fetch('https://your-observability-platform.com/api/events', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${API_KEY}`,
      //   },
      //   body: JSON.stringify(data),
      // });

      loggingService.debug('Data sent to observability platform', {
        dataType: typeof data,
      });
    } catch (error) {
      loggingService.error('Failed to send data to observability platform', {
        error,
      });
    }
  }

  private async storeLocalBackup(data: unknown): Promise<void> {
    try {
      const backupKey = `observability_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(data));

      // Clean up old backups (keep last 10)
      await this.cleanupOldBackups();
    } catch (error) {
      loggingService.warn('Failed to store local backup', { error });
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys
        .filter(key => key.startsWith('observability_backup_'))
        .sort()
        .reverse();

      // Keep only the 10 most recent backups
      const keysToDelete = backupKeys.slice(10);
      await AsyncStorage.multiRemove(keysToDelete);
    } catch (error) {
      loggingService.warn('Failed to cleanup old backups', { error });
    }
  }

  private clearBuffers(): void {
    this.metricsBuffer.length = 0;
    this.businessMetricsBuffer.length = 0;
    this.journeyEventsBuffer.length = 0;
    this.performanceMetricsBuffer.length = 0;
  }

  /**
   * Cleanup observability service
   */
  public cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }

    if (this.networkSubscription) {
      this.networkSubscription();
      this.networkSubscription = undefined;
    }

    // Final flush before cleanup
    this.flush();

    this.clearBuffers();
    this.alertStates.clear();

    loggingService.info('Observability Service cleaned up');
  }
}

// Create and export singleton instance
export const observabilityService = new ObservabilityService();
export default observabilityService;
