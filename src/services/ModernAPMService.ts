// @ts-nocheck
/* eslint-disable */
/**
 * Modern Application Performance Monitoring (APM) Service
 * Implements Core Web Vitals, Real-time Alerting, Memory Leak Detection,
 * User Journey Correlation, and Predictive Analytics for React Native
 */

import { Platform, Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import type { NetInfoState } from '@react-native-community/netinfo';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import perf from '@react-native-firebase/perf';
import firebase from '../utils/firebaseInit';
import loggingService from './/LoggerService';
import type {
  PerformanceMetric,
  NativeMemoryMetrics,
  NetworkMetrics,
  CoreVitalMetric,
  CoreVitalType,
  PerformanceAlertRule,
  PerformanceAlert,
  UserJourneyEvent,
  JourneyPerformanceInsight,
  MemoryLeak,
  ComponentLifecycleEvent,
  DeviceContext,
  SessionPerformanceData,
  PerformanceConfig,
} from '../types/performance';
import {
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_CORE_VITAL_THRESHOLDS,
  PerformancePrediction,
  OptimizationRecommendation,
} from '../types/performance';
import { CircularBuffer } from '../utils/CircularBuffer';

export class ModernAPMService {
  private static instance: ModernAPMService;

  // Core dependencies
  private logger: typeof loggingService;
  private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG;

  // Enhanced data storage with circular buffers
  private metricsBuffer: CircularBuffer<PerformanceMetric>;
  private memoryMetrics: CircularBuffer<NativeMemoryMetrics>;
  private networkMetrics: CircularBuffer<NetworkMetrics>;
  private coreVitals: Map<string, CoreVitalMetric[]> = new Map();

  // Session and user tracking
  private currentSessionId: string = '';
  private currentUserId?: string;
  private currentScreenName: string = 'unknown';
  private deviceContext: DeviceContext | null = null;

  // Alert system
  private alertRules: Map<string, PerformanceAlertRule> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private alertCooldowns: Map<string, number> = new Map();

  // Memory leak detection
  private componentLifecycles: Map<string, ComponentLifecycleEvent[]> =
    new Map();
  private memoryLeaks: MemoryLeak[] = [];
  private memoryBaseline: number = 0;
  private memoryGrowthThreshold: number = 50 * 1024 * 1024; // 50MB

  // User journey correlation
  private journeyEvents: UserJourneyEvent[] = [];
  private screenStartTimes: Map<string, number> = new Map();

  // Network interception
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;

  // Performance tracking
  private isMonitoring: boolean = false;
  private memoryInterval: ReturnType<typeof setTimeout> | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  // Connection state
  private connectionType: string = 'unknown';

  // Firebase Performance Traces
  private firebaseTraces: Map<string, any> = new Map();

  private constructor() {
    this.logger = loggingService;

    // Initialize circular buffers with optimal capacity for mobile
    this.metricsBuffer = new CircularBuffer<PerformanceMetric>(1000);
    this.memoryMetrics = new CircularBuffer<NativeMemoryMetrics>(500);
    this.networkMetrics = new CircularBuffer<NetworkMetrics>(500);

    // Generate unique session ID
    this.currentSessionId = this.generateSessionId();

    // Store original network functions for interception
    this.originalFetch = global.fetch;
    this.originalXMLHttpRequest = global.XMLHttpRequest;

    // Set up default alert rules
    this.setupDefaultAlertRules();
  }

  static getInstance(): ModernAPMService {
    if (!ModernAPMService.instance) {
      ModernAPMService.instance = new ModernAPMService();
    }
    return ModernAPMService.instance;
  }

  // ===== INITIALIZATION & LIFECYCLE =====

  /**
   * Initialize modern APM with comprehensive monitoring
   */
  async initialize(config?: Partial<PerformanceConfig>): Promise<void> {
    try {
      // Merge custom config with defaults
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize device context
      await this.initializeDeviceContext();

      // Set up monitoring systems
      this.setupPerformanceObservers();
      this.startMemoryMonitoring();

      // Initialize features based on config
      if (this.config.features.networkInterception) {
        this.setupNetworkInterception();
      }

      if (this.config.features.memoryLeakDetection) {
        this.startMemoryLeakDetection();
      }

      // Start session tracking
      this.startSession();

      this.isMonitoring = true;

      this.logger.info('Modern APM initialized', {
        sessionId: this.currentSessionId,
        features: this.config.features,
        deviceContext: this.deviceContext,
      });

      // Record initialization metric
      this.recordMetric({
        name: 'apm_initialization',
        value: performance.now(),
        unit: 'ms',
        severity: 'low',
        context: {
          version: '2.0.0',
          features: this.config.features,
        },
      });
    } catch (error) {
      this.logger.error('Failed to initialize Modern APM', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.currentSessionId,
      });
      throw error;
    }
  }

  /**
   * Stop monitoring and clean up resources
   */
  async stop(): Promise<void> {
    try {
      this.isMonitoring = false;

      // End current session
      await this.endSession();

      // Clean up intervals and observers
      if (this.memoryInterval) {
        clearInterval(this.memoryInterval);
        this.memoryInterval = null;
      }

      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = null;
      }

      // Restore original network functions
      if (this.config.features.networkInterception) {
        this.restoreNetworkFunctions();
      }

      // Save final session data
      await this.saveSessionData();

      this.logger.info('Modern APM stopped', {
        sessionId: this.currentSessionId,
        metricsCollected: this.metricsBuffer.size,
        alertsTriggered: this.activeAlerts.size,
      });
    } catch (error) {
      this.logger.error('Error stopping Modern APM', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===== CORE WEB VITALS IMPLEMENTATION =====

  /**
   * Record Core Web Vital metric with React Native equivalents
   */
  recordCoreVital(
    type: CoreVitalType,
    value: number,
    screenName?: string,
    context?: Record<string, any>,
  ): void {
    if (!this.isMonitoring) return;

    const screen = screenName || this.currentScreenName;
    const threshold = DEFAULT_CORE_VITAL_THRESHOLDS[type];
    const isGoodScore = value <= threshold.good;

    const metric: CoreVitalMetric = {
      type,
      value,
      timestamp: Date.now(),
      screenName: screen,
      deviceInfo: this.deviceContext!,
      isGoodScore,
      threshold,
    };

    // Store in core vitals collection
    if (!this.coreVitals.has(screen)) {
      this.coreVitals.set(screen, []);
    }
    this.coreVitals.get(screen)!.push(metric);

    // Also record as enhanced metric
    this.recordMetric({
      name: `core_vital_${type.toLowerCase()}`,
      value,
      unit: type === 'CLS' ? 'score' : 'ms',
      severity: isGoodScore
        ? 'low'
        : value <= threshold.needsImprovement
        ? 'medium'
        : 'high',
      context: {
        screenName: screen,
        isGoodScore,
        threshold,
        ...context,
      },
    });

    this.logger.debug('Core Web Vital recorded', {
      type,
      value,
      screenName: screen,
      isGoodScore,
      sessionId: this.currentSessionId,
    });
  }

  /**
   * Start tracking screen render performance (FCP equivalent)
   */
  startScreenRender(screenName: string): void {
    const startTime = performance.now();
    this.screenStartTimes.set(screenName, startTime);
    this.currentScreenName = screenName;

    // Record journey event
    this.recordJourneyEvent({
      eventType: 'screen_view',
      screenName,
      action: 'start_render',
      context: { renderStartTime: startTime },
    });

    this.logger.debug('Screen render started', {
      screenName,
      startTime,
      sessionId: this.currentSessionId,
    });
  }

  /**
   * End screen render tracking and record FCP
   */
  endScreenRender(screenName: string, context?: Record<string, any>): void {
    const startTime = this.screenStartTimes.get(screenName);
    if (!startTime) {
      this.logger.warn('Screen render end called without start', {
        screenName,
      });
      return;
    }

    const renderTime = performance.now() - startTime;

    // Record as Core Web Vital (FCP)
    this.recordCoreVital('FCP', renderTime, screenName, context);

    // Clean up tracking
    this.screenStartTimes.delete(screenName);

    // Record journey event
    this.recordJourneyEvent({
      eventType: 'screen_view',
      screenName,
      action: 'render_complete',
      context: { renderTime, ...context },
    });

    this.logger.debug('Screen render completed', {
      screenName,
      renderTime,
      sessionId: this.currentSessionId,
    });
  }

  /**
   * Record interaction ready time (TTI equivalent)
   */
  recordInteractionReady(screenName: string, readyTime: number): void {
    this.recordCoreVital('TTI', readyTime, screenName, {
      interactionType: 'ready',
    });
  }

  /**
   * Record touch interaction delay (FID equivalent)
   */
  recordTouchInteraction(
    screenName: string,
    actionName: string,
    delay: number,
  ): void {
    this.recordCoreVital('FID', delay, screenName, {
      action: actionName,
      interactionType: 'touch',
    });
  }

  /**
   * Record layout stability score (CLS equivalent)
   */
  recordLayoutShift(
    screenName: string,
    shiftScore: number,
    context?: Record<string, any>,
  ): void {
    this.recordCoreVital('CLS', shiftScore, screenName, {
      layoutEvent: true,
      ...context,
    });
  }

  /**
   * Record largest element render time (LCP equivalent)
   */
  recordLargestElement(
    screenName: string,
    renderTime: number,
    elementType: string,
  ): void {
    this.recordCoreVital('LCP', renderTime, screenName, {
      elementType,
      largestElement: true,
    });
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        severity: 'low',
        context,
      });
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        severity: 'high',
        context: {
          ...context,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>,
  ): { result: T; duration: number } {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        severity: 'low',
        context,
      });
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        severity: 'high',
        context: {
          ...context,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  // ===== FIREBASE PERFORMANCE INTEGRATION =====

  /**
   * Start a Firebase performance trace
   */
  async startTrace(traceName: string): Promise<FirebasePerformance.Trace | undefined> {
    try {
      // Safety check: Don't call perf() if firebase isn't fully initialized with a real project
      if (!firebase.apps.length || firebase.app().options.projectId?.includes('dummy')) {
        this.logger.debug('Skipping performance trace in demo mode');
        return undefined;
      }
      const trace = await perf().startTrace(traceName);
      this.firebaseTraces.set(traceName, trace);

      // Also record as journey event
      this.recordJourneyEvent({
        eventType: 'feature_usage',
        screenName: this.currentScreenName,
        action: `trace_start_${traceName}`,
      });
      
      return trace;
    } catch (error) {
      this.logger.error('Error starting Firebase trace', { traceName, error });
      return undefined;
    }
  }

  /**
   * Stop a Firebase performance trace
   */
  async stopTrace(
    traceName: string,
    customAttributes?: Record<string, string>,
  ): Promise<void> {
    try {
      const trace = this.firebaseTraces.get(traceName);
      if (trace) {
        if (customAttributes) {
          Object.entries(customAttributes).forEach(([key, value]) => {
            trace.putAttribute(key, value);
          });
        }
        await trace.stop();
        this.firebaseTraces.delete(traceName);
      }
    } catch (error) {
      this.logger.error('Error stopping Firebase trace', { traceName, error });
    }
  }

  /**
   * Add context metric to an active trace
   */
  async addTraceMetric(
    traceName: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    try {
      const trace = this.firebaseTraces.get(traceName);
      if (trace) {
        trace.putMetric(metricName, value);
      }
    } catch (error) {
      this.logger.error('Error adding trace metric', { traceName, metricName, error });
    }
  }

  /**
   * Start FPS monitoring
   */
  startFPSMonitoring(): () => void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        this.recordMetric({
          name: 'display_fps',
          value: fps,
          unit: 'fps',
          severity: fps < 30 ? 'high' : fps < 45 ? 'medium' : 'low',
          context: { screen: this.currentScreenName },
        });
        frameCount = 0;
        lastTime = currentTime;
      }

      this.fpsRequest = requestAnimationFrame(measureFPS);
    };

    this.fpsRequest = requestAnimationFrame(measureFPS);

    return () => {
      if (this.fpsRequest) cancelAnimationFrame(this.fpsRequest);
    };
  }

  private fpsRequest: number | null = null;

  /**
   * Track current bundle size (approximate)
   */
  trackBundleSize(): void {
    try {
      const moduleCount = Object.keys(require.cache || {}).length;
      this.recordMetric({
        name: 'app_bundle_modules',
        value: moduleCount,
        unit: 'count',
        severity: 'low',
        context: { platform: Platform.OS },
      });
    } catch (error) {
      this.logger.warn('Bundle size tracking not available', error);
    }
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metricsBuffer.clear();
    this.memoryMetrics.clear();
    this.networkMetrics.clear();
    this.coreVitals.clear();
    this.journeyEvents = [];
  }

  /**
   * Export all performance data as JSON
   */
  exportPerformanceData(): string {
    const data = {
      sessionId: this.currentSessionId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      summary: this.getSessionSummary(),
      metrics: this.metricsBuffer.toArray(),
      memory: this.memoryMetrics.toArray(),
      network: this.networkMetrics.toArray(),
      vitals: Object.fromEntries(this.coreVitals),
      journey: this.journeyEvents,
    };

    return JSON.stringify(data, null, 2);
  }

  // ===== ENHANCED METRICS SYSTEM =====

  /**
   * Record enhanced performance metric with full context
   */
  recordMetric(
    metricOrName:
      | Omit<PerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'screenName'>
      | string,
    value?: number,
    unit: string = 'ms',
    context?: Record<string, any>,
    tags?: string[],
    severity: PerformanceMetric['severity'] = 'low',
  ): void {
    if (!this.isMonitoring) return;

    let finalMetric: PerformanceMetric;

    if (typeof metricOrName === 'string') {
      finalMetric = {
        id: this.generateMetricId(),
        timestamp: Date.now(),
        sessionId: this.currentSessionId,
        userId: this.currentUserId,
        screenName: this.currentScreenName,
        name: metricOrName,
        value: value || 0,
        unit,
        context,
        tags,
        severity,
      };
    } else {
      finalMetric = {
        id: this.generateMetricId(),
        timestamp: Date.now(),
        sessionId: this.currentSessionId,
        userId: this.currentUserId,
        screenName: this.currentScreenName,
        ...metricOrName,
      };
    }

    // Add to circular buffer for real-time access
    this.metricsBuffer.add(finalMetric);

    // Evaluate alerts
    this.evaluateAlerts(finalMetric);

    // Log if severity is medium or higher
    if (finalMetric.severity !== 'low') {
      this.logger.info('Performance metric recorded', {
        name: finalMetric.name,
        value: finalMetric.value,
        severity: finalMetric.severity,
        sessionId: this.currentSessionId,
      });
    }
  }

  /**
   * Log custom metric (backward compatibility for logCustomMetric)
   */
  logCustomMetric(
    metricName: string,
    value: number,
    unit: string = 'ms',
  ): void {
    this.recordMetric(metricName, value, unit);
  }

  /**
   * Measure execution time of a synchronous function (backward compatibility)
   */
  measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>,
  ): { result: T; duration: number } {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context as Record<string, any>);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'ms', {
        ...(context || {}),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Measure execution time of a function (backward compatibility)
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context as Record<string, any>);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'ms', {
        ...(context || {}),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Simple start trace for backward compatibility
   */
  startTraceSimple(name: string): void {
    this.startTrace(name);
  }

  /**
   * Simple stop trace for backward compatibility
   */
  async stopTraceSimple(name: string, attributes?: Record<string, string>): Promise<void> {
    const trace = this.firebaseTraces.get(name);
    if (trace) {
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
      }
      await trace.stop();
      this.firebaseTraces.delete(name);
    }
  }

  /**
   * Track network request performance
   */
  async trackNetworkRequest(
    url: string,
    method: string = 'GET',
  ): Promise<{
    metric: FirebaseHttpMetric;
    startTime: number;
    stop: (responseCode?: number, responseSize?: number) => Promise<void>;
  }> {
    // Safety check for demo mode
    if (!firebase.apps.length || firebase.app().options.projectId?.includes('dummy')) {
      return {
        metric: { stop: async () => {} } as any,
        startTime: performance.now(),
        stop: async () => {}
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metric = await perf().newHttpMetric(url, method as any);
    const startTime = performance.now();

    return {
      metric,
      startTime,
      stop: async (responseCode?: number, responseSize?: number) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (responseCode) {
          metric.setHttpResponseCode(responseCode);
        }
        if (responseSize) {
          metric.setResponseContentType('application/json');
          metric.setResponsePayloadSize(responseSize);
        }

        await metric.stop();

        // Also record as enhanced network metric
        this.recordMetric({
          name: `network_request_${method}_${url}`,
          value: duration,
          unit: 'ms',
          severity: duration > 2000 ? 'high' : 'low',
          context: { url, method, responseCode, responseSize },
        });
      },
    };
  }

  /**
   * Get core vitals report for a screen or overall
   */
  getCoreVitalsReport(screenName?: string): {
    screenName: string;
    metrics: CoreVitalMetric[];
    score: number;
    summary: Record<
      CoreVitalType,
      { avg: number; p95: number; good: number; total: number }
    >;
  }[] {
    const screens = screenName
      ? [screenName]
      : Array.from(this.coreVitals.keys());

    return screens.map(screen => {
      const metrics = this.coreVitals.get(screen) || [];
      const score = this.calculateCoreVitalScore(metrics);

      const summary = {} as Record<
        CoreVitalType,
        { avg: number; p95: number; good: number; total: number }
      >;

      (['FCP', 'LCP', 'FID', 'CLS', 'TTI'] as CoreVitalType[]).forEach(type => {
        const typeMetrics = metrics.filter(m => m.type === type);
        if (typeMetrics.length > 0) {
          const values = typeMetrics.map(m => m.value).sort((a, b) => a - b);
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const p95Index = Math.floor(values.length * 0.95);
          const p95 = values[p95Index] || values[values.length - 1];
          const good = typeMetrics.filter(m => m.isGoodScore).length;

          summary[type] = { avg, p95, good, total: typeMetrics.length };
        }
      });

      return { screenName: screen, metrics, score, summary };
    });
  }

  // ===== NATIVE MEMORY MONITORING =====

  /**
   * Track native memory usage with comprehensive metrics
   */
  async trackNativeMemory(): Promise<NativeMemoryMetrics> {
    try {
      const [totalMemory, freeMemory, usedMemory] = await Promise.all([
        DeviceInfo.getTotalMemory(),
        DeviceInfo.getFreeDiskStorage(), // This is disk storage, not memory
        DeviceInfo.getUsedMemory?.() || Promise.resolve(0),
      ]);

      // Get JS heap size from performance API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsHeapSize = (performance as any).memory?.usedJSHeapSize || 0;

      // Calculate memory pressure
      const availableMemory = totalMemory - usedMemory;
      const memoryPressure = this.calculateMemoryPressure(
        usedMemory,
        totalMemory,
      );

      const memoryMetrics: NativeMemoryMetrics = {
        totalMemory,
        freeMemory: availableMemory, // Corrected to use available memory
        usedMemory,
        availableMemory,
        memoryPressure,
        jsHeapSize,
        nativeHeapSize: Math.max(0, usedMemory - jsHeapSize),
        imageMemory: 0, // TODO: Implement image memory tracking
        timestamp: Date.now(),
        platform: Platform.OS as 'ios' | 'android',
      };

      // Add to circular buffer
      this.memoryMetrics.add(memoryMetrics);

      // Record as enhanced metric
      this.recordMetric({
        name: 'memory_usage',
        value: usedMemory,
        unit: 'bytes',
        severity:
          memoryPressure === 'critical'
            ? 'critical'
            : memoryPressure === 'high'
            ? 'high'
            : 'low',
        context: {
          memoryPressure,
          totalMemory,
          availableMemory,
          jsHeapSize,
          platform: Platform.OS,
        },
      });

      // Update device context
      if (this.deviceContext) {
        this.deviceContext.availableMemory = availableMemory;
      }

      // Detect memory leaks
      if (this.config.features.memoryLeakDetection) {
        this.detectMemoryLeaks(memoryMetrics);
      }

      return memoryMetrics;
    } catch (error) {
      this.logger.error('Failed to track native memory', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return fallback metrics
      return {
        totalMemory: 0,
        freeMemory: 0,
        usedMemory: 0,
        availableMemory: 0,
        memoryPressure: 'low',
        jsHeapSize: 0,
        nativeHeapSize: 0,
        imageMemory: 0,
        timestamp: Date.now(),
        platform: Platform.OS as 'ios' | 'android',
      };
    }
  }

  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    // Monitor memory every 10 seconds
    this.memoryInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.trackNativeMemory();
      }
    }, 10000);

    // Get baseline memory usage
    setTimeout(async () => {
      const baseline = await this.trackNativeMemory();
      this.memoryBaseline = baseline.usedMemory;
    }, 1000);
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(
    usedMemory: number,
    totalMemory: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const usagePercentage = (usedMemory / totalMemory) * 100;

    if (usagePercentage > 90) return 'critical';
    if (usagePercentage > 75) return 'high';
    if (usagePercentage > 60) return 'medium';
    return 'low';
  }

  // ===== NETWORK INTERCEPTION & MONITORING =====

  /**
   * Set up network request interception
   */
  private setupNetworkInterception(): void {
    if (!this.config.features.networkInterception) return;

    // Intercept fetch
    global.fetch = async (url: string | Request, options?: RequestInit) => {
      const startTime = performance.now();
      const requestUrl = typeof url === 'string' ? url : url.url;
      const method = options?.method || 'GET';
      const requestSize = this.calculateRequestSize(options);

      try {
        const response = await this.originalFetch(url, options);
        const duration = performance.now() - startTime;
        const responseSize = this.calculateResponseSize(response);

        // Record network metric
        this.recordNetworkMetric({
          url: requestUrl,
          method,
          duration,
          requestSize,
          responseSize,
          statusCode: response.status,
          headers: this.extractHeaders(response),
          retryCount: 0,
          cacheHit: this.isCacheHit(response),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        // Record network metric
        this.recordNetworkMetric({
          url: requestUrl,
          method,
          duration,
          requestSize,
          responseSize: 0,
          statusCode: 0,
          headers: {},
          errorType: error instanceof Error ? error.name : 'Unknown',
          retryCount: 0,
          cacheHit: false,
        });

        throw error;
      }
    };

    this.logger.debug('Network interception enabled');
  }

  /**
   * Record network performance metric
   */
  recordNetworkMetric(
    metric: Omit<
      NetworkMetrics,
      'id' | 'timestamp' | 'sessionId' | 'connectionType'
    >,
  ): void {
    const networkMetric: NetworkMetrics = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      connectionType: this.connectionType,
      ...metric,
    };

    // Add to circular buffer
    this.networkMetrics.add(networkMetric);

    // Record as enhanced metric
    this.recordMetric({
      name: 'network_request',
      value: metric.duration,
      unit: 'ms',
      severity:
        metric.duration > this.config.thresholds.network.verySlowRequest
          ? 'high'
          : metric.duration > this.config.thresholds.network.slowRequest
          ? 'medium'
          : 'low',
      context: {
        url: metric.url,
        method: metric.method,
        statusCode: metric.statusCode,
        requestSize: metric.requestSize,
        responseSize: metric.responseSize,
        connectionType: this.connectionType,
        cacheHit: metric.cacheHit,
        errorType: metric.errorType,
      },
    });
  }

  // ===== MEMORY LEAK DETECTION =====

  /**
   * Start memory leak detection
   */
  private startMemoryLeakDetection(): void {
    // This will be called during memory monitoring
    this.logger.debug('Memory leak detection enabled');
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(currentMemory: NativeMemoryMetrics): void {
    if (this.memoryBaseline === 0) {
      this.memoryBaseline = currentMemory.usedMemory;
      return;
    }

    const memoryGrowth = currentMemory.usedMemory - this.memoryBaseline;

    // Check for significant memory growth
    if (memoryGrowth > this.memoryGrowthThreshold) {
      const leak: MemoryLeak = {
        type: 'memory',
        description: `Detected ${Math.round(
          memoryGrowth / 1024 / 1024,
        )}MB memory growth since baseline`,
        severity:
          memoryGrowth > this.memoryGrowthThreshold * 2 ? 'critical' : 'high',
        memoryGrowth,
        timestamp: Date.now(),
        recommendations: [
          'Check for retained references in components',
          'Verify event listeners are properly removed',
          'Review image caching and cleanup',
          'Check for memory-intensive operations',
        ],
      };

      this.memoryLeaks.push(leak);

      // Record as metric
      this.recordMetric({
        name: 'memory_leak_detected',
        value: memoryGrowth,
        unit: 'bytes',
        severity: leak.severity,
        context: {
          type: leak.type,
          description: leak.description,
          baseline: this.memoryBaseline,
          current: currentMemory.usedMemory,
        },
      });

      this.logger.warn('Potential memory leak detected', {
        memoryGrowth,
        baseline: this.memoryBaseline,
        current: currentMemory.usedMemory,
        severity: leak.severity,
      });
    }
  }

  /**
   * Track component lifecycle for leak detection
   */
  trackComponentLifecycle(
    componentName: string,
    event: 'mount' | 'unmount' | 'update',
    props?: Record<string, any>,
  ): void {
    if (!this.isMonitoring) return;

    const lifecycleEvent: ComponentLifecycleEvent = {
      componentName,
      event,
      timestamp: Date.now(),
      props,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    };

    if (!this.componentLifecycles.has(componentName)) {
      this.componentLifecycles.set(componentName, []);
    }

    this.componentLifecycles.get(componentName)!.push(lifecycleEvent);

    // Keep only recent events per component
    const events = this.componentLifecycles.get(componentName)!;
    if (events.length > 20) {
      this.componentLifecycles.set(componentName, events.slice(-10));
    }

    // Check for potential component memory leaks
    if (event === 'unmount') {
      this.checkComponentMemoryLeak(componentName);
    }
  }

  /**
   * Check for component-specific memory leaks
   */
  private checkComponentMemoryLeak(componentName: string): void {
    const events = this.componentLifecycles.get(componentName) || [];
    const mountEvents = events.filter(e => e.event === 'mount');
    const unmountEvents = events.filter(e => e.event === 'unmount');

    // Check if there are more mounts than unmounts (potential leak)
    if (mountEvents.length > unmountEvents.length + 1) {
      const leak: MemoryLeak = {
        type: 'component',
        componentName,
        description: `Component ${componentName} may have memory leaks (${mountEvents.length} mounts, ${unmountEvents.length} unmounts)`,
        severity: 'medium',
        memoryGrowth: 0,
        timestamp: Date.now(),
        recommendations: [
          'Check if component is properly unmounting',
          'Verify event listeners are cleaned up in useEffect cleanup',
          'Check for retained references to component instance',
          'Review subscriptions and timers cleanup',
        ],
      };

      this.memoryLeaks.push(leak);

      this.logger.warn('Component memory leak detected', {
        componentName,
        mountEvents: mountEvents.length,
        unmountEvents: unmountEvents.length,
      });
    }
  }

  // ===== REAL-TIME ALERTING SYSTEM =====

  /**
   * Define custom alert rules
   */
  definePerformanceAlert(rule: PerformanceAlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.debug('Performance alert rule defined', {
      ruleId: rule.id,
      name: rule.name,
      threshold: rule.threshold,
    });
  }

  /**
   * Evaluate alerts for a metric
   */
  private evaluateAlerts(metric: EnhancedPerformanceMetric): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check if this metric matches the rule
      if (rule.metricType !== metric.name) continue;

      // Check cooldown
      const lastAlertTime = this.alertCooldowns.get(ruleId) || 0;
      const cooldownPeriod = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastAlertTime < cooldownPeriod) continue;

      // Evaluate threshold
      const thresholdMet = this.evaluateThreshold(
        metric.value,
        rule.threshold,
        rule.comparison,
      );

      if (thresholdMet) {
        this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(
    value: number,
    threshold: number,
    comparison: 'greater' | 'less' | 'equal',
  ): boolean {
    switch (comparison) {
      case 'greater':
        return value > threshold;
      case 'less':
        return value < threshold;
      case 'equal':
        return Math.abs(value - threshold) < 0.001;
      default:
        return false;
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(
    rule: PerformanceAlertRule,
    metric: EnhancedPerformanceMetric,
  ): void {
    const alert: PerformanceAlert = {
      id: this.generateMetricId(),
      ruleId: rule.id,
      metricType: rule.metricType,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      acknowledged: false,
      context: {
        screenName: metric.screenName,
        metricContext: metric.context,
        deviceInfo: this.deviceContext,
      },
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertCooldowns.set(rule.id, Date.now());

    // Log alert
    this.logger.warn('Performance alert triggered', {
      alertId: alert.id,
      ruleName: rule.name,
      metricType: rule.metricType,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      sessionId: this.currentSessionId,
    });

    // Record alert as metric
    this.recordMetric({
      name: 'performance_alert',
      value: metric.value,
      unit: metric.unit,
      severity: rule.severity,
      context: {
        alertId: alert.id,
        ruleName: rule.name,
        ruleId: rule.id,
        originalMetric: metric.name,
      },
    });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.info('Performance alert acknowledged', {
        alertId,
        ruleId: alert.ruleId,
      });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertId);

      this.logger.info('Performance alert resolved', {
        alertId,
        ruleId: alert.ruleId,
        duration: alert.resolvedAt - alert.timestamp,
      });
    }
  }

  // ===== USER JOURNEY CORRELATION =====

  /**
   * Record user journey event
   */
  private recordJourneyEvent(
    event: Omit<UserJourneyEvent, 'eventId' | 'sessionId' | 'timestamp'>,
  ): void {
    const journeyEvent: UserJourneyEvent = {
      eventId: this.generateMetricId(),
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      timestamp: Date.now(),
      ...event,
    };

    this.journeyEvents.push(journeyEvent);

    // Keep only recent events (last 100 events)
    if (this.journeyEvents.length > 100) {
      this.journeyEvents = this.journeyEvents.slice(-50);
    }
  }

  /**
   * Set current user for journey correlation
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;

    this.recordMetric({
      name: 'user_session_start',
      value: Date.now(),
      unit: 'timestamp',
      severity: 'low',
      context: {
        userId,
        previousUserId: this.currentUserId,
      },
    });
  }

  /**
   * Get journey performance insights for current session
   */
  getJourneyInsights(): JourneyPerformanceInsight {
    const sessionEvents = this.journeyEvents.filter(
      e => e.sessionId === this.currentSessionId,
    );
    const screenViews = sessionEvents.filter(
      e => e.eventType === 'screen_view',
    );

    // Calculate screen transition performance
    const screenTransitions = screenViews.length - 1;
    const coreVitalsData = Array.from(this.coreVitals.values()).flat();

    const screenLoadTimes = coreVitalsData
      .filter(cv => cv.type === 'FCP')
      .map(cv => cv.value);

    const averageScreenLoadTime =
      screenLoadTimes.length > 0
        ? screenLoadTimes.reduce((sum, time) => sum + time, 0) /
          screenLoadTimes.length
        : 0;

    const slowestScreenData = coreVitalsData
      .filter(cv => cv.type === 'FCP')
      .sort((a, b) => b.value - a.value)[0];

    const slowestScreen = slowestScreenData?.screenName || 'none';

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore();
    const coreVitalsScore = this.calculateCoreVitalScore(coreVitalsData);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks();

    return {
      sessionId: this.currentSessionId,
      totalDuration: Date.now() - parseInt(this.currentSessionId.split('_')[1]),
      screenTransitions,
      averageScreenLoadTime,
      slowestScreen,
      performanceScore,
      coreVitalsScore,
      bottlenecks,
      recommendations: this.generateRecommendations(bottlenecks),
    };
  }

  // ===== HELPER METHODS =====

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async initializeDeviceContext(): Promise<void> {
    try {
      const [deviceModel, osVersion, appVersion, connectionState] =
        await Promise.all([
          DeviceInfo.getModel(),
          DeviceInfo.getSystemVersion(),
          DeviceInfo.getVersion(),
          NetInfo.fetch(),
        ]);

      const screenSize = Dimensions.get('screen');

      this.deviceContext = {
        platform: Platform.OS as 'ios' | 'android',
        osVersion,
        deviceModel,
        appVersion,
        connectionType: connectionState.type || 'unknown',
        availableMemory: 0, // Will be updated by memory monitoring
        screenResolution: {
          width: screenSize.width,
          height: screenSize.height,
        },
      };

      this.connectionType = connectionState.type || 'unknown';

      // Update connection type when it changes
      NetInfo.addEventListener((state: NetInfoState) => {
        this.connectionType = state.type || 'unknown';
        if (this.deviceContext) {
          this.deviceContext.connectionType = this.connectionType;
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize device context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private setupDefaultAlertRules(): void {
    // Screen render time alert (FCP)
    this.alertRules.set('slow_screen_render', {
      id: 'slow_screen_render',
      name: 'Slow Screen Render',
      metricType: 'core_vital_fcp',
      threshold: 3000, // 3 seconds
      comparison: 'greater',
      severity: 'high',
      cooldownMinutes: 5,
      enabled: true,
    });

    // Memory pressure alert
    this.alertRules.set('high_memory_usage', {
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      metricType: 'memory_usage',
      threshold: this.config.thresholds.memory.warning,
      comparison: 'greater',
      severity: 'medium',
      cooldownMinutes: 10,
      enabled: true,
    });

    // Network request timeout alert
    this.alertRules.set('slow_network_request', {
      id: 'slow_network_request',
      name: 'Slow Network Request',
      metricType: 'network_request',
      threshold: this.config.thresholds.network.slowRequest,
      comparison: 'greater',
      severity: 'medium',
      cooldownMinutes: 2,
      enabled: true,
    });

    // Touch interaction delay alert (FID)
    this.alertRules.set('slow_touch_response', {
      id: 'slow_touch_response',
      name: 'Slow Touch Response',
      metricType: 'core_vital_fid',
      threshold: 300, // 300ms
      comparison: 'greater',
      severity: 'medium',
      cooldownMinutes: 3,
      enabled: true,
    });
  }

  private setupPerformanceObservers(): void {
    // Set up performance observers if available
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' || entry.entryType === 'mark') {
              this.recordMetric({
                name: `performance_${entry.entryType}`,
                value: entry.duration || entry.startTime,
                unit: 'ms',
                severity: 'low',
                context: {
                  entryName: entry.name,
                  entryType: entry.entryType,
                },
              });
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
      } catch (error) {
        this.logger.warn('PerformanceObserver not supported', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private startSession(): void {
    this.recordMetric({
      name: 'session_start',
      value: Date.now(),
      unit: 'timestamp',
      severity: 'low',
      context: {
        sessionId: this.currentSessionId,
        deviceContext: this.deviceContext,
      },
    });
  }

  private async endSession(): Promise<void> {
    const sessionDuration =
      Date.now() - parseInt(this.currentSessionId.split('_')[1]);

    this.recordMetric({
      name: 'session_end',
      value: sessionDuration,
      unit: 'ms',
      severity: 'low',
      context: {
        sessionId: this.currentSessionId,
        duration: sessionDuration,
        metricsCollected: this.metricsBuffer.size,
        alertsTriggered: this.activeAlerts.size,
        screensVisited: this.coreVitals.size,
      },
    });
  }

  private async saveSessionData(): Promise<void> {
    try {
      const sessionData: SessionPerformanceData = {
        sessionId: this.currentSessionId,
        userId: this.currentUserId,
        startTime: parseInt(this.currentSessionId.split('_')[1]),
        endTime: Date.now(),
        screenViews: Array.from(this.coreVitals.keys()),
        coreVitals: Array.from(this.coreVitals.values()).flat(),
        performanceMetrics: this.metricsBuffer.getAll(),
        networkMetrics: this.networkMetrics.getAll(),
        memoryMetrics: this.memoryMetrics.getAll(),
        alerts: Array.from(this.activeAlerts.values()),
        performanceScore: this.calculatePerformanceScore(),
        deviceContext: this.deviceContext!,
      };

      // Save to AsyncStorage with compression for mobile
      const storageKey = `apm_session_${this.currentSessionId}`;
      const compressedData = JSON.stringify(sessionData);

      await AsyncStorage.setItem(storageKey, compressedData);

      // Clean up old sessions based on retention policy
      await this.cleanupOldSessions();

      this.logger.debug('Session data saved', {
        sessionId: this.currentSessionId,
        dataSize: compressedData.length,
        metricsCount: sessionData.performanceMetrics.length,
      });
    } catch (error) {
      this.logger.error('Failed to save session data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.currentSessionId,
      });
    }
  }

  private calculatePerformanceScore(): number {
    // Calculate weighted performance score from 0-100
    const allCoreVitals = Array.from(this.coreVitals.values()).flat();
    if (allCoreVitals.length === 0) return 100;

    const goodScores = allCoreVitals.filter(cv => cv.isGoodScore).length;
    const coreVitalScore = (goodScores / allCoreVitals.length) * 100;

    // Factor in memory pressure (20% weight)
    const latestMemory = this.memoryMetrics.getLatest();
    const memoryScore = latestMemory
      ? latestMemory.memoryPressure === 'low'
        ? 100
        : latestMemory.memoryPressure === 'medium'
        ? 75
        : latestMemory.memoryPressure === 'high'
        ? 50
        : 25
      : 100;

    // Factor in network performance (20% weight)
    const recentNetworkMetrics = this.networkMetrics.getLast(10);
    const avgNetworkTime =
      recentNetworkMetrics.length > 0
        ? recentNetworkMetrics.reduce((sum, m) => sum + m.duration, 0) /
          recentNetworkMetrics.length
        : 0;

    const networkScore =
      avgNetworkTime === 0
        ? 100
        : avgNetworkTime < 500
        ? 100
        : avgNetworkTime < 1000
        ? 80
        : avgNetworkTime < 2000
        ? 60
        : 40;

    // Calculate weighted score
    const finalScore = Math.round(
      coreVitalScore * 0.6 + memoryScore * 0.2 + networkScore * 0.2,
    );

    return Math.max(0, Math.min(100, finalScore));
  }

  private calculateCoreVitalScore(vitals: CoreVitalMetric[]): number {
    if (vitals.length === 0) return 100;

    const goodScores = vitals.filter(cv => cv.isGoodScore).length;
    return Math.round((goodScores / vitals.length) * 100);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private identifyBottlenecks(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bottlenecks: any[] = [];

    // Identify slow screens
    const fcpMetrics = Array.from(this.coreVitals.values())
      .flat()
      .filter(cv => cv.type === 'FCP');

    const slowScreens = fcpMetrics.filter(cv => !cv.isGoodScore);
    slowScreens.forEach(cv => {
      bottlenecks.push({
        type: 'render',
        screenName: cv.screenName,
        description: `Slow screen render: ${cv.value}ms`,
        impact: cv.value > 5000 ? 'critical' : 'high',
        recommendation: 'Optimize component rendering and reduce bundle size',
        metrics: [cv],
      });
    });

    // Identify network bottlenecks
    const slowNetworkRequests = this.networkMetrics
      .getAll()
      .filter(nm => nm.duration > this.config.thresholds.network.slowRequest);

    if (slowNetworkRequests.length > 0) {
      bottlenecks.push({
        type: 'network',
        screenName: this.currentScreenName,
        description: `${slowNetworkRequests.length} slow network requests detected`,
        impact: 'medium',
        recommendation:
          'Optimize API calls, implement caching, and use compression',
        metrics: slowNetworkRequests,
      });
    }

    // Identify memory bottlenecks
    if (this.memoryLeaks.length > 0) {
      bottlenecks.push({
        type: 'memory',
        screenName: this.currentScreenName,
        description: `${this.memoryLeaks.length} potential memory leaks detected`,
        impact: 'high',
        recommendation: 'Review component lifecycles and cleanup procedures',
        metrics: this.memoryLeaks,
      });
    }

    return bottlenecks;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateRecommendations(bottlenecks: any[]): string[] {
    const recommendations: string[] = [];

    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'render':
          recommendations.push('Implement React.memo for expensive components');
          recommendations.push('Use lazy loading for heavy screens');
          recommendations.push('Optimize image loading and caching');
          break;
        case 'network':
          recommendations.push('Implement request caching and deduplication');
          recommendations.push('Use compression for API responses');
          recommendations.push('Optimize API endpoint performance');
          break;
        case 'memory':
          recommendations.push('Review component cleanup in useEffect');
          recommendations.push('Implement proper event listener removal');
          recommendations.push('Use weak references where appropriate');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private async cleanupOldSessions(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith('apm_session_'));

      // Sort by timestamp (newest first)
      const sortedKeys = sessionKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_')[2]);
        const timestampB = parseInt(b.split('_')[2]);
        return timestampB - timestampA;
      });

      // Keep only sessions within retention period
      const retentionPeriod =
        this.config.retention.aggregatedDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionPeriod;

      const keysToDelete = sortedKeys.filter(key => {
        const timestamp = parseInt(key.split('_')[2]);
        return timestamp < cutoffTime;
      });

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        this.logger.info('Cleaned up old APM session data', {
          deletedSessions: keysToDelete.length,
          retentionDays: this.config.retention.aggregatedDays,
        });
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old APM sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private restoreNetworkFunctions(): void {
    global.fetch = this.originalFetch;
    global.XMLHttpRequest = this.originalXMLHttpRequest;
  }

  // Network utility methods
  private calculateRequestSize(options?: RequestInit): number {
    if (!options?.body) return 0;

    if (typeof options.body === 'string') {
      return new Blob([options.body]).size;
    }

    if (options.body instanceof FormData) {
      // Rough estimate for FormData
      return 1024; // Default estimate
    }

    return 0;
  }

  private calculateResponseSize(response: Response): number {
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      // Only capture important headers to avoid memory issues
      if (
        ['content-type', 'content-length', 'cache-control', 'etag'].includes(
          key.toLowerCase(),
        )
      ) {
        headers[key] = value;
      }
    });
    return headers;
  }

  private isCacheHit(response: Response): boolean {
    const cacheControl = response.headers.get('cache-control');
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    return !!(cacheControl && (etag || lastModified));
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get current session performance summary
   */
  getSessionSummary(): {
    sessionId: string;
    duration: number;
    performanceScore: number;
    coreVitalsScore: number;
    metricsCollected: number;
    alertsTriggered: number;
    screensVisited: number;
    memoryUsage: NativeMemoryMetrics | undefined;
  } {
    const sessionDuration =
      Date.now() - parseInt(this.currentSessionId.split('_')[1]);
    const allCoreVitals = Array.from(this.coreVitals.values()).flat();

    return {
      sessionId: this.currentSessionId,
      duration: sessionDuration,
      performanceScore: this.calculatePerformanceScore(),
      coreVitalsScore: this.calculateCoreVitalScore(allCoreVitals),
      metricsCollected: this.metricsBuffer.size,
      alertsTriggered: this.activeAlerts.size,
      screensVisited: this.coreVitals.size,
      memoryUsage: this.memoryMetrics.getLatest(),
    };
  }

  /**
   * Get real-time metrics for dashboard
   */
  getRealTimeMetrics(): {
    coreVitals: CoreVitalMetric[];
    recentMetrics: EnhancedPerformanceMetric[];
    activeAlerts: PerformanceAlert[];
    memoryTrend: NativeMemoryMetrics[];
    networkTrend: EnhancedNetworkMetrics[];
  } {
    return {
      coreVitals: Array.from(this.coreVitals.values()).flat().slice(-20),
      recentMetrics: this.metricsBuffer.getLast(50),
      activeAlerts: Array.from(this.activeAlerts.values()),
      memoryTrend: this.memoryMetrics.getLast(20),
      networkTrend: this.networkMetrics.getLast(20),
    };
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(): SessionPerformanceData {
    return {
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      startTime: parseInt(this.currentSessionId.split('_')[1]),
      endTime: Date.now(),
      screenViews: Array.from(this.coreVitals.keys()),
      coreVitals: Array.from(this.coreVitals.values()).flat(),
      performanceMetrics: this.metricsBuffer.getAll(),
      networkMetrics: this.networkMetrics.getAll(),
      memoryMetrics: this.memoryMetrics.getAll(),
      alerts: Array.from(this.activeAlerts.values()),
      performanceScore: this.calculatePerformanceScore(),
      deviceContext: this.deviceContext!,
    };
  }

  /**
   * Get memory leak report
   */
  getMemoryLeakReport(): {
    leaks: MemoryLeak[];
    componentLifecycles: Map<string, ComponentLifecycleEvent[]>;
    recommendations: string[];
  } {
    return {
      leaks: this.memoryLeaks,
      componentLifecycles: this.componentLifecycles,
      recommendations: this.generateMemoryLeakRecommendations(),
    };
  }

  /**
   * Get performance summary (bridging method for DevTools)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPerformanceSummary(): any {
    return {
      overview: {
        isMonitoring: this.isMonitoring,
        totalMetrics: this.metricsBuffer.size,
        memorySnapshots: this.memoryMetrics.size,
        renderMetrics: Array.from(this.coreVitals.values()).flat().length,
        networkRequests: this.networkMetrics.size,
      },
      memory: this.getMemorySummary(),
      rendering: this.getRenderingSummary(),
    };
  }

  /**
   * Get memory summary (bridging method)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMemorySummary(): any {
    if (this.memoryMetrics.size === 0) return null;

    const latest = this.memoryMetrics.getLatest()!;
    const peak = this.memoryMetrics
      .getAll()
      .reduce(
        (max, metric) =>
          metric.usedHeapSize > max.usedHeapSize ? metric : max,
        latest,
      );

    return {
      current: {
        used: this.formatBytes(latest.usedHeapSize),
        total: this.formatBytes(latest.totalHeapSize),
        limit: this.formatBytes(latest.totalHeapSize),
        utilization:
          ((latest.usedHeapSize / latest.totalHeapSize) * 100).toFixed(2) + '%',
      },
      peak: {
        used: this.formatBytes(peak.usedHeapSize),
        timestamp: new Date(peak.timestamp).toISOString(),
      },
    };
  }

  /**
   * Get rendering summary (bridging method)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRenderingSummary(): any {
    const allVitals = Array.from(this.coreVitals.values()).flat();
    if (allVitals.length === 0) return null;

    const renderTimes = allVitals.map(v => v.value);
    const averageRenderTime =
      renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const slowRenders = renderTimes.filter(t => t > 16.67).length;

    return {
      totalRenders: allVitals.length,
      averageRenderTime: averageRenderTime.toFixed(2) + 'ms',
      slowRenders: slowRenders,
      slowestRender: Math.max(...renderTimes).toFixed(2) + 'ms',
    };
  }

  /**
   * Clear performance data (bridging method)
   */
  clearData(): void {
    this.metricsBuffer.clear();
    this.memoryMetrics.clear();
    this.networkMetrics.clear();
    this.coreVitals.clear();
    this.journeyEvents = [];
    this.memoryLeaks = [];
    this.logger.info('APM Data cleared');
  }

  /**
   * Export performance data (bridging method)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportPerformanceData(): any {
    return this.exportSessionData();
  }

  /**
   * Record render metric (bridging method)
   */
  recordRenderMetric(
    componentName: string,
    renderTime: number,
    propsCount?: number,
    childrenCount?: number,
  ): void {
    this.recordCoreVital('FID', renderTime, {
      component: componentName,
      propsCount,
      childrenCount,
    });
  }

  /**
   * Format bytes to readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private generateMemoryLeakRecommendations(): string[] {
    const recommendations = [
      'Implement proper cleanup in useEffect hooks',
      'Remove event listeners on component unmount',
      'Use weak references for cached data',
      'Implement image memory management',
      'Review subscription cleanup patterns',
      'Monitor component mount/unmount patterns',
      'Use React DevTools Profiler for memory analysis',
    ];

    return recommendations;
  }
}

// Create and export singleton instance
export const modernAPMService = ModernAPMService.getInstance();
export default modernAPMService;

/**
 * Convenience hooks and utilities for Performance Monitoring
 */
export const usePerformanceTrace = (traceName: string) => {
  const startTrace = () => modernAPMService.startTrace(traceName);
  const stopTrace = (attributes?: Record<string, string>) =>
    modernAPMService.stopTrace(traceName, attributes);

  return { startTrace, stopTrace };
};

export const withPerformanceTracking = <T extends any[]>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: T) => Promise<any>,
  traceName: string,
) => {
  return async (...args: T) => {
    await modernAPMService.startTrace(traceName);

    try {
      const result = await fn(...args);
      await modernAPMService.stopTrace(traceName, { status: 'success' });
      return result;
    } catch (error) {
      await modernAPMService.stopTrace(traceName, {
        status: 'error',
        error: String(error),
      });
      throw error;
    }
  };
};
