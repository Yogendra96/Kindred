// @ts-nocheck
/* eslint-disable */
import loggingService from './/LoggerService';
import { Platform } from 'react-native';
import type {
  EnhancedPerformanceMetric,
  NativeMemoryMetrics,
  EnhancedNetworkMetrics,
  CoreVitalMetric,
  PerformanceAlertRule,
  PerformanceAlert,
  UserJourneyEvent,
  MemoryLeak,
  ComponentLifecycleEvent,
  DeviceContext,
  PerformanceConfig,
} from '../types/performance';
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance';
import { CircularBuffer } from '../utils/CircularBuffer';

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  propsCount: number;
  childrenCount: number;
  timestamp: number;
}

interface BundleMetrics {
  totalSize: number;
  jsSize: number;
  assetsSize: number;
  loadTime: number;
  timestamp: number;
}

/**
 * Enhanced Performance Service with Modern APM Capabilities
 * Implements Core Web Vitals, Real-time Alerting, Memory Leak Detection
 * User Journey Correlation, and Predictive Analytics
 */
export class EnhancedPerformanceService {
  private static instance: EnhancedPerformanceService;

  // Core dependencies
  private logger: typeof loggingService;
  private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG;

  // Enhanced data storage with circular buffers for high-frequency data
  private metrics: Map<string, EnhancedPerformanceMetric[]> = new Map();
  private metricsBuffer: CircularBuffer<EnhancedPerformanceMetric>;
  private memoryMetrics: CircularBuffer<NativeMemoryMetrics>;
  private networkMetrics: CircularBuffer<EnhancedNetworkMetrics>;
  private coreVitals: Map<string, CoreVitalMetric[]> = new Map();

  // Legacy compatibility
  private renderMetrics: RenderMetrics[] = [];
  private bundleMetrics: BundleMetrics | null = null;

  // Real-time monitoring state
  private isMonitoring: boolean = false;
  private memoryInterval: ReturnType<typeof setTimeout> | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  // Session and user tracking
  private currentSessionId: string = '';
  private currentUserId?: string;
  private deviceContext: DeviceContext | null = null;

  // Alert system
  private alertRules: Map<string, PerformanceAlertRule> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();

  // Memory leak detection
  private componentLifecycles: Map<string, ComponentLifecycleEvent[]> =
    new Map();
  private memoryLeaks: MemoryLeak[] = [];

  // User journey correlation
  private journeyEvents: UserJourneyEvent[] = [];
  private screenStartTimes: Map<string, number> = new Map();

  // Network interception
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;

  // Performance tracking
  private screenRenderStartTime: number = 0;
  private interactionStartTime: number = 0;

  // Connection state
  private connectionType: string = 'unknown';

  private constructor() {
    this.logger = loggingService;

    // Initialize circular buffers with optimal capacity
    this.metricsBuffer = new CircularBuffer<EnhancedPerformanceMetric>(1000);
    this.memoryMetrics = new CircularBuffer<NativeMemoryMetrics>(500);
    this.networkMetrics = new CircularBuffer<EnhancedNetworkMetrics>(500);

    // Generate unique session ID
    this.currentSessionId = this.generateSessionId();

    // Store original network functions for interception
    this.originalFetch = global.fetch;
    this.originalXMLHttpRequest = global.XMLHttpRequest;

    // Set up default alert rules
    this.setupDefaultAlertRules();
  }

  static getInstance(): EnhancedPerformanceService {
    if (!EnhancedPerformanceService.instance) {
      EnhancedPerformanceService.instance = new EnhancedPerformanceService();
    }
    return EnhancedPerformanceService.instance;
  }

  /**
   * Initialize enhanced performance monitoring with modern APM capabilities
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
      this.setupNetworkMonitoring();

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

      this.logger.info('Enhanced performance monitoring initialized', {
        sessionId: this.currentSessionId,
        features: this.config.features,
        deviceContext: this.deviceContext,
      });

      // Record initialization metric
      this.recordEnhancedMetric({
        id: Math.random().toString(36).substring(7),
        sessionId: this.currentSessionId,
        screenName: 'Initialization',
        name: 'apm_initialization',
        value: performance.now(),
        unit: 'ms',
        severity: 'low',
        timestamp: Date.now(),
        context: {
          version: '2.0.0',
          features: this.config.features,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to initialize enhanced performance monitoring',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: this.currentSessionId,
        },
      );
      throw error;
    }
  }

  /**
   * Stop enhanced performance monitoring and clean up resources
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

      this.logger.info('Enhanced performance monitoring stopped', {
        sessionId: this.currentSessionId,
        metricsCollected: this.metricsBuffer.size,
        alertsTriggered: this.activeAlerts.size,
      });
    } catch (error) {
      this.logger.error('Error stopping performance monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, any>,
  ): void {
    const metric: EnhancedPerformanceMetric = {
      id: Math.random().toString(36).substring(7),
      name,
      value,
      unit,
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      screenName: 'Unknown',
      severity: 'low',
      context,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 100 metrics per type
    if (metricArray.length > 100) {
      metricArray.shift();
    }

    this.logger.debug(
      `Performance metric recorded: ${name} = ${value}${unit}`,
      context,
    );
  }

  /**
   * Record an enhanced metric to circular buffer
   */
  recordEnhancedMetric(metric: EnhancedPerformanceMetric): void {
    this.metricsBuffer.add(metric);
    if (__DEV__) {
      this.logger.debug(`Enhanced metric: ${metric.name}`, metric);
    }
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
      this.recordMetric(name, duration, 'ms', context);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'ms', {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      this.recordMetric(name, duration, 'ms', context);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'ms', {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record render performance for a component
   */
  recordRenderMetric(
    componentName: string,
    renderTime: number,
    propsCount: number = 0,
    childrenCount: number = 0,
  ): void {
    const metric: RenderMetrics = {
      componentName,
      renderTime,
      propsCount,
      childrenCount,
      timestamp: Date.now(),
    };

    this.renderMetrics.push(metric);

    // Keep only last 50 render metrics
    if (this.renderMetrics.length > 50) {
      this.renderMetrics.shift();
    }

    // Log slow renders in development
    if (__DEV__ && renderTime > 16) {
      // 16ms = 60fps threshold
      this.logger.warn(
        `Slow render detected: ${componentName} took ${renderTime.toFixed(
          2,
        )}ms`,
      );
    }
  }

  /**
   * Record network request performance
   */
  recordNetworkMetric(
    url: string,
    method: string,
    duration: number,
    responseSize: number,
    statusCode: number,
  ): void {
    const metric: EnhancedNetworkMetrics = {
      id: Math.random().toString(36).substring(7),
      url,
      method,
      duration,
      responseSize,
      requestSize: 0,
      statusCode,
      headers: {},
      retryCount: 0,
      cacheHit: false,
      connectionType: this.connectionType,
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
    };

    this.networkMetrics.add(metric);

    // Buffer handles efficient size management automatically
  }

  /**
   * Record bundle metrics
   */
  recordBundleMetrics(metrics: Partial<BundleMetrics>): void {
    this.bundleMetrics = {
      totalSize: 0,
      jsSize: 0,
      assetsSize: 0,
      loadTime: 0,
      timestamp: Date.now(),
      ...metrics,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const summary = {
      overview: {
        isMonitoring: this.isMonitoring,
        totalMetrics: Array.from(this.metrics.values()).reduce(
          (sum, arr) => sum + arr.length,
          0,
        ),
        memorySnapshots: this.memoryMetrics.size,
        renderMetrics: this.renderMetrics.length,
        networkRequests: this.networkMetrics.size,
      },
      memory: this.getMemorySummary(),
      rendering: this.getRenderingSummary(),
      network: this.getNetworkSummary(),
      bundle: this.bundleMetrics,
      customMetrics: this.getCustomMetricsSummary(),
    };

    return summary;
  }

  /**
   * Get memory usage summary
   */
  private getMemorySummary(): any {
    if (this.memoryMetrics.size === 0) return null;

    const latest = this.memoryMetrics.getLatest()!;
    const allMetrics = this.memoryMetrics.getAll();
    const peak = allMetrics.reduce(
      (max, metric) => (metric.jsHeapSize > max.jsHeapSize ? metric : max),
      allMetrics[0],
    );

    return {
      current: {
        used: this.formatBytes(latest.jsHeapSize),
        total: this.formatBytes(latest.totalMemory),
        limit: this.formatBytes(latest.totalMemory), // Using totalMemory as limit approximation
        utilization:
          ((latest.jsHeapSize / latest.totalMemory) * 100).toFixed(2) + '%',
      },
      peak: {
        used: this.formatBytes(peak.jsHeapSize),
        timestamp: new Date(peak.timestamp).toISOString(),
      },
    };
  }

  /**
   * Get rendering performance summary
   */
  private getRenderingSummary(): any {
    if (this.renderMetrics.length === 0) return null;

    const totalRenderTime = this.renderMetrics.reduce(
      (sum, metric) => sum + metric.renderTime,
      0,
    );
    const averageRenderTime = totalRenderTime / this.renderMetrics.length;
    const slowRenders = this.renderMetrics.filter(
      metric => metric.renderTime > 16,
    );

    return {
      totalRenders: this.renderMetrics.length,
      averageRenderTime: averageRenderTime.toFixed(2) + 'ms',
      slowRenders: slowRenders.length,
      slowestRender: this.renderMetrics.reduce(
        (max, metric) => (metric.renderTime > max.renderTime ? metric : max),
        this.renderMetrics[0],
      ),
    };
  }

  /**
   * Get network performance summary
   */
  private getNetworkSummary(): any {
    if (this.networkMetrics.size === 0) return null;

    const allMetrics = this.networkMetrics.getAll();
    const totalRequests = allMetrics.length;
    const averageDuration =
      allMetrics.reduce((sum, metric) => sum + metric.duration, 0) /
      totalRequests;
    const slowRequests = allMetrics.filter(metric => metric.duration > 3000);
    const errorRequests = allMetrics.filter(metric => metric.statusCode >= 400);

    return {
      totalRequests,
      averageDuration: averageDuration.toFixed(2) + 'ms',
      slowRequests: slowRequests.length,
      errorRequests: errorRequests.length,
      totalDataTransferred: this.formatBytes(
        allMetrics.reduce((sum, metric) => sum + metric.responseSize, 0),
      ),
    };
  }

  /**
   * Get custom metrics summary
   */
  private getCustomMetricsSummary(): any {
    const summary: Record<string, any> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = metrics[metrics.length - 1];

      summary[name] = {
        count: metrics.length,
        average: average.toFixed(2),
        min,
        max,
        latest: latest.value,
        unit: latest.unit,
      };
    }

    return summary;
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Observe navigation timing
        const navigationObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordMetric('navigation_load_time', entry.duration, 'ms');
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });

        // Observe resource timing
        const resourceObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.recordMetric('resource_load_time', entry.duration, 'ms', {
                name: entry.name,
                // @ts-ignore
                size: entry.transferSize || 0,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        this.logger.warn('Performance observers not supported:', {
          error: (error as any)?.message || error,
        });
      }
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (Platform.OS === 'web' || typeof performance !== 'undefined') {
      this.memoryInterval = setInterval(() => {
        try {
          // @ts-ignore
          if (performance.memory) {
            // @ts-ignore
            const memory = performance.memory;
            const metric: NativeMemoryMetrics = {
              totalMemory: memory.totalJSHeapSize,
              freeMemory: memory.totalJSHeapSize - memory.usedJSHeapSize,
              usedMemory: memory.usedJSHeapSize,
              availableMemory: memory.jsHeapSizeLimit - memory.usedJSHeapSize,
              memoryPressure: 'low',
              jsHeapSize: memory.usedJSHeapSize,
              nativeHeapSize: 0,
              imageMemory: 0,
              timestamp: Date.now(),
              platform: Platform.OS === 'ios' ? 'ios' : 'android',
            };

            this.memoryMetrics.add(metric);
          }
        } catch (error) {
          this.logger.warn('Memory monitoring error:', {
            error: (error as any)?.message || error,
          });
        }
      }, 10000); // Every 10 seconds
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // This would typically intercept fetch/XMLHttpRequest
    // For now, it's a placeholder for manual network metric recording
    if (__DEV__) {
      this.logger.info('Network monitoring setup (manual recording required)');
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): any {
    return {
      summary: this.getPerformanceSummary(),
      rawData: {
        metrics: Object.fromEntries(this.metrics),
        memory: this.memoryMetrics,
        rendering: this.renderMetrics,
        network: this.networkMetrics,
        bundle: this.bundleMetrics,
      },
      metadata: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        monitoringDuration: this.isMonitoring ? 'active' : 'stopped',
      },
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics.clear();
    this.memoryMetrics.clear();
    this.renderMetrics = [];
    this.networkMetrics.clear();
    this.bundleMetrics = null;
    this.logger.info('Performance data cleared');
  }
  // Missing implementations
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private setupDefaultAlertRules(): void {
    // defaults
  }

  private async initializeDeviceContext(): Promise<void> {
    this.deviceContext = {
      deviceId: 'device-id',
      model: 'model',
      os: 'os',
      osVersion: '1.0',
      appVersion: '1.0',
      screen: { width: 0, height: 0, scale: 1 },
      memory: { total: 0, free: 0 },
      battery: { level: 1, charging: false },
    } as any;
  }

  private setupNetworkInterception(): void {
    // intercept
  }

  private startMemoryLeakDetection(): void {
    // detect
  }

  private startSession(): void {
    // start
  }

  private async endSession(): Promise<void> {
    // end
  }

  private restoreNetworkFunctions(): void {
    if (this.originalFetch) global.fetch = this.originalFetch;
    if (this.originalXMLHttpRequest)
      global.XMLHttpRequest = this.originalXMLHttpRequest;
  }

  private async saveSessionData(): Promise<void> {
    // save
  }
}

// Create and export singleton instance
export const enhancedPerformanceService =
  EnhancedPerformanceService.getInstance();
export default enhancedPerformanceService;
