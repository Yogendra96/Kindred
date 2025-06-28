import { loggingService } from './LoggingService';
import { Platform } from 'react-native';

// Global type declarations
declare global {
  var __DEV__: boolean;
  namespace NodeJS {
    interface Timeout {}
  }
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  propsCount: number;
  childrenCount: number;
  timestamp: number;
}

interface NetworkMetrics {
  url: string;
  method: string;
  duration: number;
  responseSize: number;
  statusCode: number;
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
 * Enhanced Performance Service with comprehensive monitoring
 */
export class EnhancedPerformanceService {
  private static instance: EnhancedPerformanceService;
  // Basic performance monitoring without external dependencies
  private logger: typeof loggingService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];
  private renderMetrics: RenderMetrics[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private bundleMetrics: BundleMetrics | null = null;
  private isMonitoring: boolean = false;
  private memoryInterval: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.logger = loggingService;
  }

  static getInstance(): EnhancedPerformanceService {
    if (!EnhancedPerformanceService.instance) {
      EnhancedPerformanceService.instance = new EnhancedPerformanceService();
    }
    return EnhancedPerformanceService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    try {
      this.setupPerformanceObservers();
      this.startMemoryMonitoring();
      this.setupNetworkMonitoring();
      this.isMonitoring = true;
      this.logger.info('Enhanced performance monitoring initialized');
    } catch (error) {
      this.logger.error('Failed to initialize performance monitoring', {
        error: error.message,
      });
    }
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    this.logger.info('Performance monitoring stopped');
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
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
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

    if (__DEV__) {
      this.logger.debug(
        `Performance metric recorded: ${name} = ${value}${unit}`,
        context,
      );
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
        error: error.message,
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
        error: error.message,
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
    const metric: NetworkMetrics = {
      url,
      method,
      duration,
      responseSize,
      statusCode,
      timestamp: Date.now(),
    };

    this.networkMetrics.push(metric);

    // Keep only last 100 network metrics
    if (this.networkMetrics.length > 100) {
      this.networkMetrics.shift();
    }

    // Log slow network requests
    if (__DEV__ && duration > 3000) {
      // 3 seconds threshold
      this.logger.warn(
        `Slow network request: ${method} ${url} took ${duration}ms`,
      );
    }
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

    if (__DEV__) {
      this.logger.info('Bundle metrics recorded:', this.bundleMetrics);
    }
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
        memorySnapshots: this.memoryMetrics.length,
        renderMetrics: this.renderMetrics.length,
        networkRequests: this.networkMetrics.length,
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
    if (this.memoryMetrics.length === 0) return null;

    const latest = this.memoryMetrics[this.memoryMetrics.length - 1];
    const peak = this.memoryMetrics.reduce(
      (max, metric) =>
        metric.usedJSHeapSize > max.usedJSHeapSize ? metric : max,
      this.memoryMetrics[0],
    );

    return {
      current: {
        used: this.formatBytes(latest.usedJSHeapSize),
        total: this.formatBytes(latest.totalJSHeapSize),
        limit: this.formatBytes(latest.jsHeapSizeLimit),
        utilization:
          ((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(2) +
          '%',
      },
      peak: {
        used: this.formatBytes(peak.usedJSHeapSize),
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
    if (this.networkMetrics.length === 0) return null;

    const totalRequests = this.networkMetrics.length;
    const averageDuration =
      this.networkMetrics.reduce((sum, metric) => sum + metric.duration, 0) /
      totalRequests;
    const slowRequests = this.networkMetrics.filter(
      metric => metric.duration > 3000,
    );
    const errorRequests = this.networkMetrics.filter(
      metric => metric.statusCode >= 400,
    );

    return {
      totalRequests,
      averageDuration: averageDuration.toFixed(2) + 'ms',
      slowRequests: slowRequests.length,
      errorRequests: errorRequests.length,
      totalDataTransferred: this.formatBytes(
        this.networkMetrics.reduce(
          (sum, metric) => sum + metric.responseSize,
          0,
        ),
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
                size: entry.transferSize,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        this.logger.warn('Performance observers not supported:', error);
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
            const metric: MemoryMetrics = {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              timestamp: Date.now(),
            };

            this.memoryMetrics.push(metric);

            // Keep only last 100 memory snapshots
            if (this.memoryMetrics.length > 100) {
              this.memoryMetrics.shift();
            }
          }
        } catch (error) {
          this.logger.warn('Memory monitoring error:', error);
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
    this.memoryMetrics = [];
    this.renderMetrics = [];
    this.networkMetrics = [];
    this.bundleMetrics = null;
    this.logger.info('Performance data cleared');
  }
}

// Create and export singleton instance
export const enhancedPerformanceService =
  EnhancedPerformanceService.getInstance();
export default enhancedPerformanceService;
