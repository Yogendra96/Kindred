import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { loggingService } from './LoggingService';

// Global type declarations
declare global {
  var __DEV__: boolean;
}

// Use Timer type instead of NodeJS.Timeout namespace
// type Timer = ReturnType<typeof setInterval>; // TODO: Add when needed

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  category:
    | 'user_action'
    | 'performance'
    | 'error'
    | 'navigation'
    | 'feature_usage'
    | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  screenViews: number;
  actions: number;
  errors: number;
  platform: string;
  appVersion: string;
  deviceInfo?: Record<string, string | number | boolean>;
}

interface ScreenView {
  screenName: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  duration?: number;
  previousScreen?: string;
  parameters?: Record<string, string | number | boolean>;
}

interface UserAction {
  action: string;
  target: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  screenName?: string;
  properties?: Record<string, string | number | boolean>;
}

interface AnalyticsConfig {
  enableAutoTracking?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
  enableOfflineQueue?: boolean;
  batchSize?: number;
  flushInterval?: number;
  maxQueueSize?: number;
  dataRetentionDays?: number;
}

interface AnalyticsExportData {
  summary: AnalyticsSummary;
  sessions: UserSession[];
  events: AnalyticsEvent[];
  screenViews: ScreenView[];
  userActions: UserAction[];
  config: AnalyticsConfig;
  metadata: {
    platform: string;
    timestamp: string;
    version: string;
  };
}

interface AnalyticsSummary {
  sessions: {
    total: number;
    active: number;
    averageDuration: number;
    totalDuration: number;
  };
  events: {
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  screens: {
    totalViews: number;
    uniqueScreens: number;
    mostViewed: Array<{ screen: string; views: number }>;
  };
  users: {
    total: number;
    active: number;
    returning: number;
  };
  performance: {
    averageLoadTime: number;
    errorRate: number;
    crashRate: number;
  };
}

/**
 * Enhanced Analytics Service for comprehensive app analytics
 */
export class EnhancedAnalyticsService {
  private static instance: EnhancedAnalyticsService;
  private logger: typeof loggingService;
  // Performance service integration will be added when available
  private config: AnalyticsConfig;
  private currentSession: UserSession | null = null;
  private events: AnalyticsEvent[] = [];
  private screenViews: ScreenView[] = [];
  private userActions: UserAction[] = [];
  private sessions: UserSession[] = [];
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized: boolean = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private currentScreen: string | null = null;
  private screenStartTime: number | null = null;

  private constructor(config: AnalyticsConfig = {}) {
    this.logger = loggingService;
    // Performance service integration will be added when available
    this.config = {
      enableAutoTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableOfflineQueue: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxQueueSize: 1000,
      dataRetentionDays: 30,
      ...config,
    };
  }

  static getInstance(config?: AnalyticsConfig): EnhancedAnalyticsService {
    if (!EnhancedAnalyticsService.instance) {
      EnhancedAnalyticsService.instance = new EnhancedAnalyticsService(config);
    }
    return EnhancedAnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      await this.loadStoredData();
      await this.startSession(userId);
      this.setupAutoTracking();
      this.setupPerformanceTracking();
      this.setupErrorTracking();
      this.startFlushTimer();
      this.cleanupOldData();
      this.isInitialized = true;

      this.logger.info('Enhanced analytics service initialized');

      // Track initialization
      this.trackEvent(
        'analytics_initialized',
        {
          config: this.config,
          platform: Platform.OS,
        },
        'custom',
        'medium',
      );
    } catch (error) {
      this.logger.error('Failed to initialize analytics service:', error);
      throw error;
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean>,
    category: AnalyticsEvent['category'] = 'custom',
    priority: AnalyticsEvent['priority'] = 'medium',
  ): void {
    if (!this.isInitialized) {
      this.logger.warn('Analytics not initialized, queuing event:', name);
    }

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp_iso: new Date().toISOString(),
      },
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId ?? 'no-session',
      userId: this.currentSession?.userId ?? '',
      category,
      priority,
    };

    this.events.push(event);
    this.eventQueue.push(event);

    // Update session stats
    if (this.currentSession) {
      this.currentSession.actions++;
    }

    // Keep only recent events in memory
    if (this.events.length > this.config.maxQueueSize!) {
      this.events.shift();
    }

    if (__DEV__) {
      this.logger.debug(`Analytics event: ${name}`, event);
    }

    // Immediate flush for critical events
    if (priority === 'critical') {
      this.flush();
    }
  }

  /**
   * Track screen view
   */
  trackScreenView(
    screenName: string,
    parameters?: Record<string, string | number | boolean>,
  ): void {
    // End previous screen view
    if (this.currentScreen && this.screenStartTime) {
      const duration = Date.now() - this.screenStartTime;
      this.updateScreenViewDuration(this.currentScreen, duration);
    }

    const screenView: ScreenView = {
      screenName,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId ?? 'no-session',
      userId: this.currentSession?.userId ?? '',
      previousScreen: this.currentScreen ?? undefined,
      parameters,
    };

    this.screenViews.push(screenView);
    this.currentScreen = screenName;
    this.screenStartTime = Date.now();

    // Update session stats
    if (this.currentSession) {
      this.currentSession.screenViews++;
    }

    // Track as event
    this.trackEvent(
      'screen_view',
      {
        screen_name: screenName,
        previous_screen: screenView.previousScreen,
        ...parameters,
      },
      'navigation',
      'medium',
    );

    // Keep only recent screen views
    if (this.screenViews.length > 500) {
      this.screenViews.shift();
    }
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    target: string,
    properties?: Record<string, string | number | boolean>,
  ): void {
    const userAction: UserAction = {
      action,
      target,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId ?? 'no-session',
      userId: this.currentSession?.userId ?? '',
      screenName: this.currentScreen ?? undefined,
      properties,
    };

    this.userActions.push(userAction);

    // Track as event
    this.trackEvent(
      'user_action',
      {
        action,
        target,
        screen_name: this.currentScreen,
        ...properties,
      },
      'user_action',
      'medium',
    );

    // Keep only recent actions
    if (this.userActions.length > 1000) {
      this.userActions.shift();
    }
  }

  /**
   * Track error
   */
  trackError(
    error: Error | string,
    context?: Record<string, string | number | boolean>,
    isFatal: boolean = false,
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.trackEvent(
      'error_occurred',
      {
        error_message: errorMessage,
        error_stack: errorStack,
        is_fatal: isFatal,
        screen_name: this.currentScreen,
        ...context,
      },
      'error',
      isFatal ? 'critical' : 'high',
    );

    // Update session stats
    if (this.currentSession) {
      this.currentSession.errors++;
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, string | number | boolean>,
  ): void {
    this.trackEvent(
      'performance_metric',
      {
        metric,
        value,
        unit,
        screen_name: this.currentScreen,
        ...context,
      },
      'performance',
      'low',
    );
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: string,
    action: string,
    properties?: Record<string, string | number | boolean>,
  ): void {
    this.trackEvent(
      'feature_usage',
      {
        feature,
        action,
        screen_name: this.currentScreen,
        ...properties,
      },
      'feature_usage',
      'medium',
    );
  }

  /**
   * Set user properties
   */
  setUserProperties(
    properties: Record<string, string | number | boolean>,
  ): void {
    this.trackEvent(
      'user_properties_updated',
      {
        properties,
      },
      'custom',
      'low',
    );
  }

  /**
   * Start a new session
   */
  async startSession(userId?: string): Promise<void> {
    try {
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }

      const sessionId = this.generateSessionId();
      const deviceInfo = await this.getDeviceInfo();

      this.currentSession = {
        sessionId,
        userId: userId ?? '',
        startTime: Date.now(),
        screenViews: 0,
        actions: 0,
        errors: 0,
        platform: Platform.OS,
        appVersion: await this.getAppVersion(),
        deviceInfo,
      };

      this.sessions.push(this.currentSession);

      this.trackEvent(
        'session_started',
        {
          session_id: sessionId,
          user_id: userId,
          device_info: deviceInfo,
        },
        'custom',
        'medium',
      );

      if (this.currentSession) {
        await this.saveData();
      }
    } catch (error) {
      this.logger.error('Failed to start session:', error);
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const endTime = Date.now();
      const duration = endTime - this.currentSession.startTime;

      this.currentSession.endTime = endTime;
      this.currentSession.duration = duration;

      // End current screen view
      if (this.currentScreen && this.screenStartTime) {
        const screenDuration = endTime - this.screenStartTime;
        this.updateScreenViewDuration(this.currentScreen, screenDuration);
      }

      this.trackEvent(
        'session_ended',
        {
          session_id: this.currentSession.sessionId,
          duration,
          screen_views: this.currentSession.screenViews,
          actions: this.currentSession.actions,
          errors: this.currentSession.errors,
        },
        'custom',
        'medium',
      );

      await this.saveData();
      await this.flush();

      this.currentSession = null;
      this.currentScreen = null;
      this.screenStartTime = null;
    } catch (error) {
      this.logger.error('Failed to end session:', error);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(timeRange?: {
    start: number;
    end: number;
  }): AnalyticsSummary {
    const now = Date.now();
    const start = timeRange?.start ?? now - 7 * 24 * 60 * 60 * 1000; // Last 7 days
    const end = timeRange?.end ?? now;

    const filteredEvents = this.events.filter(
      e => e.timestamp >= start && e.timestamp <= end,
    );
    const filteredSessions = this.sessions.filter(
      s => s.startTime >= start && s.startTime <= end,
    );
    const filteredScreenViews = this.screenViews.filter(
      s => s.timestamp >= start && s.timestamp <= end,
    );

    // Calculate session metrics
    const totalSessions = filteredSessions.length;
    const activeSessions = filteredSessions.filter(s => !s.endTime).length;
    const completedSessions = filteredSessions.filter(s => s.duration);
    const averageDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) /
          completedSessions.length
        : 0;
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + (s.duration ?? 0),
      0,
    );

    // Calculate event metrics
    const eventsByCategory = filteredEvents.reduce(
      (acc, event) => {
        acc[event.category] = (acc[event.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const eventsByPriority = filteredEvents.reduce(
      (acc, event) => {
        acc[event.priority] = (acc[event.priority] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate screen metrics
    const screenCounts = filteredScreenViews.reduce(
      (acc, view) => {
        acc[view.screenName] = (acc[view.screenName] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostViewed = Object.entries(screenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([screen, views]) => ({ screen, views }));

    // Calculate user metrics
    const uniqueUsers = new Set(
      filteredSessions.map(s => s.userId).filter(Boolean),
    ).size;
    const returningUsers = filteredSessions.filter(s => {
      const userSessions = this.sessions.filter(
        session => session.userId === s.userId,
      );
      return userSessions.length > 1;
    }).length;

    // Calculate performance metrics
    const performanceEvents = filteredEvents.filter(
      e => e.category === 'performance',
    );
    const errorEvents = filteredEvents.filter(e => e.category === 'error');
    const loadTimeEvents = performanceEvents.filter(
      e =>
        e.name === 'performance_metric' && e.properties?.metric === 'load_time',
    );

    const averageLoadTime =
      loadTimeEvents.length > 0
        ? loadTimeEvents.reduce(
            (sum, e) => sum + (e.properties?.value ?? 0),
            0,
          ) / loadTimeEvents.length
        : 0;

    const errorRate =
      filteredEvents.length > 0
        ? (errorEvents.length / filteredEvents.length) * 100
        : 0;
    const crashEvents = errorEvents.filter(e => e.properties?.is_fatal);
    const crashRate =
      filteredSessions.length > 0
        ? (crashEvents.length / filteredSessions.length) * 100
        : 0;

    return {
      sessions: {
        total: totalSessions,
        active: activeSessions,
        averageDuration,
        totalDuration,
      },
      events: {
        total: filteredEvents.length,
        byCategory: eventsByCategory,
        byPriority: eventsByPriority,
      },
      screens: {
        totalViews: filteredScreenViews.length,
        uniqueScreens: Object.keys(screenCounts).length,
        mostViewed,
      },
      users: {
        total: uniqueUsers,
        active: activeSessions,
        returning: returningUsers,
      },
      performance: {
        averageLoadTime,
        errorRate,
        crashRate,
      },
    };
  }

  /**
   * Get events by category
   */
  getEventsByCategory(
    category: AnalyticsEvent['category'],
    limit: number = 100,
  ): AnalyticsEvent[] {
    return this.events
      .filter(event => event.category === category)
      .slice(-limit);
  }

  /**
   * Get user journey for a session
   */
  getUserJourney(sessionId: string): {
    session: UserSession | null;
    screenViews: ScreenView[];
    actions: UserAction[];
    events: AnalyticsEvent[];
  } {
    return {
      session: this.sessions.find(s => s.sessionId === sessionId) ?? null,
      screenViews: this.screenViews.filter(s => s.sessionId === sessionId),
      actions: this.userActions.filter(a => a.sessionId === sessionId),
      events: this.events.filter(e => e.sessionId === sessionId),
    };
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      // In a real implementation, this would send events to an analytics service
      if (__DEV__) {
        this.logger.info(`Flushing ${this.eventQueue.length} analytics events`);
      }

      // Save to local storage
      await this.saveData();

      // Clear the queue
      this.eventQueue = [];
    } catch (error) {
      this.logger.error('Failed to flush analytics events:', error);
    }
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(): AnalyticsExportData {
    return {
      summary: this.getAnalyticsSummary(),
      sessions: this.sessions,
      events: this.events,
      screenViews: this.screenViews,
      userActions: this.userActions,
      config: this.config,
      metadata: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Clear analytics data
   */
  async clearAnalyticsData(): Promise<void> {
    try {
      this.events = [];
      this.screenViews = [];
      this.userActions = [];
      this.sessions = [];
      this.eventQueue = [];

      await AsyncStorage.multiRemove([
        'analytics_events',
        'analytics_sessions',
        'analytics_screen_views',
        'analytics_user_actions',
      ]);

      this.logger.info('Analytics data cleared');
    } catch (error) {
      this.logger.error('Failed to clear analytics data:', error);
    }
  }

  /**
   * Update screen view duration
   */
  private updateScreenViewDuration(screenName: string, duration: number): void {
    const screenView = this.screenViews
      .reverse()
      .find(s => s.screenName === screenName && !s.duration);

    if (screenView) {
      screenView.duration = duration;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<
    Record<string, string | number | boolean>
  > {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      // Add more device info as needed
    };
  }

  /**
   * Get app version
   */
  private async getAppVersion(): Promise<string> {
    // This would typically come from a package or config
    return '1.0.0';
  }

  /**
   * Setup automatic tracking
   */
  private setupAutoTracking(): void {
    if (!this.config.enableAutoTracking) return;

    // Auto-track app state changes
    // This would typically use AppState from react-native
    if (__DEV__) {
      this.logger.info('Auto-tracking enabled');
    }
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    if (!this.config.enablePerformanceTracking) return;

    // Integrate with performance service
    // This is a placeholder for performance event integration
    if (__DEV__) {
      this.logger.info('Performance tracking enabled');
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return;

    // Setup global error handlers
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.trackError(args.join(' '), { source: 'console.error' });
      originalConsoleError.apply(console, args);
    };

    if (__DEV__) {
      this.logger.info('Error tracking enabled');
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval!);
  }

  /**
   * Load stored data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const [events, sessions, screenViews, userActions] =
        await AsyncStorage.multiGet([
          'analytics_events',
          'analytics_sessions',
          'analytics_screen_views',
          'analytics_user_actions',
        ]);

      if (events[1]) this.events = JSON.parse(events[1]);
      if (sessions[1]) this.sessions = JSON.parse(sessions[1]);
      if (screenViews[1]) this.screenViews = JSON.parse(screenViews[1]);
      if (userActions[1]) this.userActions = JSON.parse(userActions[1]);
    } catch (error) {
      this.logger.error('Failed to load stored analytics data:', error);
    }
  }

  /**
   * Save data to storage
   */
  private async saveData(): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['analytics_events', JSON.stringify(this.events.slice(-1000))], // Keep last 1000
        ['analytics_sessions', JSON.stringify(this.sessions.slice(-100))], // Keep last 100
        [
          'analytics_screen_views',
          JSON.stringify(this.screenViews.slice(-500)),
        ], // Keep last 500
        [
          'analytics_user_actions',
          JSON.stringify(this.userActions.slice(-1000)),
        ], // Keep last 1000
      ]);
    } catch (error) {
      this.logger.error('Failed to save analytics data:', error);
    }
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoffTime =
      Date.now() - this.config.dataRetentionDays! * 24 * 60 * 60 * 1000;

    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    this.sessions = this.sessions.filter(
      session => session.startTime > cutoffTime,
    );
    this.screenViews = this.screenViews.filter(
      view => view.timestamp > cutoffTime,
    );
    this.userActions = this.userActions.filter(
      action => action.timestamp > cutoffTime,
    );
  }
}

// Create and export singleton instance
export const enhancedAnalyticsService = EnhancedAnalyticsService.getInstance();
export default enhancedAnalyticsService;
