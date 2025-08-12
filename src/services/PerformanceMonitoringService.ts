import { Platform } from 'react-native';

import perf from '@react-native-firebase/perf';
import { performance, PerformanceObserver } from 'react-native-performance';

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private performanceObserver: PerformanceObserver | null = null;
  private traces: Map<string, any> = new Map();
  private metrics: Map<string, number> = new Map();

  private constructor() {
    this.initializePerformanceObserver();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance =
        new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private initializePerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.logPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['measure', 'navigation', 'resource'],
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private logPerformanceEntry(entry: any): void {
    const metric = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType,
      timestamp: Date.now(),
    };

    // Store metric for analysis
    this.metrics.set(entry.name, entry.duration);

    // Log to Firebase Analytics if duration is significant
    if (entry.duration > 100) {
      // Log operations taking more than 100ms
      this.logCustomMetric(entry.name, entry.duration);
    }
  }

  // Firebase Performance Monitoring
  public async startTrace(traceName: string): Promise<void> {
    try {
      const trace = await perf().startTrace(traceName);
      this.traces.set(traceName, trace);

      // Also start native performance measurement
      performance.mark(`${traceName}-start`);
    } catch (error) {
      console.error('Error starting trace:', error);
    }
  }

  public async stopTrace(
    traceName: string,
    customAttributes?: Record<string, string>,
  ): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        // Add custom attributes
        if (customAttributes) {
          for (const [key, value] of Object.entries(customAttributes)) {
            trace.putAttribute(key, value);
          }
        }

        await trace.stop();
        this.traces.delete(traceName);
      }

      // Stop native performance measurement
      performance.mark(`${traceName}-end`);
      performance.measure(traceName, `${traceName}-start`, `${traceName}-end`);
    } catch (error) {
      console.error('Error stopping trace:', error);
    }
  }

  public async addTraceMetric(
    traceName: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putMetric(metricName, value);
      }
    } catch (error) {
      console.error('Error adding trace metric:', error);
    }
  }

  // Custom metrics for app-specific performance
  public logCustomMetric(
    metricName: string,
    value: number,
    unit: string = 'ms',
  ): void {
    try {
      // Log to Firebase Performance
      perf()
        .newHttpMetric('https://api.kindred.app', 'GET')
        .then(metric => {
          metric.putAttribute('custom_metric', metricName);
          metric.putAttribute('value', value.toString());
          metric.putAttribute('unit', unit);
          return metric.stop();
        });

      // Store locally for analysis
      this.metrics.set(metricName, value);
    } catch (error) {
      console.error('Error logging custom metric:', error);
    }
  }

  // Screen performance tracking
  public async trackScreenPerformance(screenName: string): Promise<() => void> {
    const startTime = performance.now();
    await this.startTrace(`screen_${screenName}`);

    return async () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      await this.stopTrace(`screen_${screenName}`, {
        screen_name: screenName,
        platform: Platform.OS,
        duration: duration.toString(),
      });

      this.logCustomMetric(`screen_load_${screenName}`, duration);
    };
  }

  // Network request performance
  public async trackNetworkRequest(
    url: string,
    method: string = 'GET',
  ): Promise<any> {
    try {
      const metric = perf().newHttpMetric(url, method);
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
          this.logCustomMetric(`network_${method}_${url}`, duration);
        },
      };
    } catch (error) {
      console.error('Error tracking network request:', error);
      return {
        stop: () => Promise.resolve(),
      };
    }
  }

  // Memory usage tracking
  public trackMemoryUsage(): void {
    if (Platform.OS === 'android') {
      // Android-specific memory tracking
      try {
        const memoryInfo = performance.memory;
        if (memoryInfo) {
          this.logCustomMetric(
            'memory_used_heap',
            memoryInfo.usedJSHeapSize / 1024 / 1024,
            'MB',
          );
          this.logCustomMetric(
            'memory_total_heap',
            memoryInfo.totalJSHeapSize / 1024 / 1024,
            'MB',
          );
          this.logCustomMetric(
            'memory_heap_limit',
            memoryInfo.jsHeapSizeLimit / 1024 / 1024,
            'MB',
          );
        }
      } catch (error) {
        console.warn('Memory tracking not available:', error);
      }
    }
  }

  // FPS monitoring
  public startFPSMonitoring(): () => void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        // Every second
        const fps = frameCount;
        this.logCustomMetric('fps', fps, 'fps');
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }

  // Bundle size tracking
  public trackBundleSize(): void {
    try {
      // This would typically be measured during build time
      // For runtime, we can track loaded modules
      const moduleCount = Object.keys(require.cache || {}).length;
      this.logCustomMetric('loaded_modules', moduleCount, 'count');
    } catch (error) {
      console.warn('Bundle size tracking not available:', error);
    }
  }

  // Get performance summary
  public getPerformanceSummary(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics.clear();
  }

  // Export performance data
  public exportPerformanceData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      metrics: Object.fromEntries(this.metrics),
      traces: [...this.traces.keys()],
    };

    return JSON.stringify(data, null, 2);
  }
}

export default PerformanceMonitoringService.getInstance();

// Convenience hooks and utilities
export const usePerformanceTrace = (traceName: string) => {
  const startTrace = () =>
    PerformanceMonitoringService.getInstance().startTrace(traceName);
  const stopTrace = (attributes?: Record<string, string>) =>
    PerformanceMonitoringService.getInstance().stopTrace(traceName, attributes);

  return { startTrace, stopTrace };
};

export const withPerformanceTracking = <T extends any[]>(
  fn: (...args: T) => Promise<any>,
  traceName: string,
) => {
  return async (...args: T) => {
    const service = PerformanceMonitoringService.getInstance();
    await service.startTrace(traceName);

    try {
      const result = await fn(...args);
      await service.stopTrace(traceName, { status: 'success' });
      return result;
    } catch (error) {
      await service.stopTrace(traceName, {
        status: 'error',
        error: String(error),
      });
      throw error;
    }
  };
};
