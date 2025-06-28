import { EnhancedAnalyticsService } from '../services/EnhancedAnalyticsService';
import { EnhancedPerformanceService } from '../services/EnhancedPerformanceService';
import { loggingService } from '../services/LoggingService';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

// Global type declarations
declare global {
  var __DEV__: boolean;
  namespace NodeJS {
    interface Timeout {}
  }
}

// React Native module declaration
declare module 'react-native' {
  export * from 'react-native';
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
  updateCount: number;
  lastUpdate: number;
}

interface UsePerformanceMonitoringOptions {
  componentName?: string;
  enableRenderTracking?: boolean;
  enableMemoryTracking?: boolean;
  enableAnalytics?: boolean;
  trackSlowRenders?: boolean;
  slowRenderThreshold?: number;
  sampleRate?: number;
}

interface PerformanceHookReturn {
  metrics: PerformanceMetrics;
  startMeasurement: (name: string) => () => void;
  recordMetric: (name: string, value: number, unit?: string) => void;
  trackRender: () => void;
  isSlowRender: boolean;
  performanceScore: number;
}

/**
 * Custom hook for performance monitoring in React Native components
 */
export const usePerformanceMonitoring = (
  options: UsePerformanceMonitoringOptions = {},
): PerformanceHookReturn => {
  const {
    componentName = 'UnknownComponent',
    enableRenderTracking = true,
    enableMemoryTracking = true,
    enableAnalytics = true,
    trackSlowRenders = true,
    slowRenderThreshold = 16, // 60fps threshold
    sampleRate = 1.0, // 100% sampling by default
  } = options;

  const performanceService = useRef(EnhancedPerformanceService.getInstance());
  const analyticsService = useRef(EnhancedAnalyticsService.getInstance());
  const logger = useRef(loggingService);

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const updateCount = useRef<number>(0);
  const measurements = useRef<Map<string, number>>(new Map());
  const componentMountTime = useRef<number>(Date.now());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    updateCount: 0,
    lastUpdate: Date.now(),
  });

  const [isSlowRender, setIsSlowRender] = useState<boolean>(false);
  const [performanceScore, setPerformanceScore] = useState<number>(100);

  /**
   * Check if we should sample this measurement
   */
  const shouldSample = useCallback((): boolean => {
    return Math.random() < sampleRate;
  }, [sampleRate]);

  /**
   * Start a performance measurement
   */
  const startMeasurement = useCallback(
    (name: string) => {
      if (!shouldSample()) {
        return () => {}; // Return no-op function
      }

      const startTime = performance.now();
      measurements.current.set(name, startTime);

      return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        performanceService.current.recordMetric(
          `${componentName}_${name}`,
          duration,
          'ms',
          { component: componentName },
        );

        if (enableAnalytics) {
          analyticsService.current.trackPerformance(
            `${componentName}_${name}`,
            duration,
            'ms',
            { component: componentName },
          );
        }

        measurements.current.delete(name);
      };
    },
    [componentName, enableAnalytics, shouldSample],
  );

  /**
   * Record a custom metric
   */
  const recordMetric = useCallback(
    (name: string, value: number, unit: string = 'ms') => {
      if (!shouldSample()) return;

      performanceService.current.recordMetric(
        `${componentName}_${name}`,
        value,
        unit,
        { component: componentName },
      );

      if (enableAnalytics) {
        analyticsService.current.trackPerformance(
          `${componentName}_${name}`,
          value,
          unit,
          { component: componentName },
        );
      }
    },
    [componentName, enableAnalytics, shouldSample],
  );

  /**
   * Track render performance
   */
  const trackRender = useCallback(() => {
    if (!enableRenderTracking || !shouldSample()) return;

    const now = performance.now();

    if (renderStartTime.current > 0) {
      const renderTime = now - renderStartTime.current;
      renderCount.current++;

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        renderTime,
        componentCount: renderCount.current,
        updateCount: updateCount.current,
        lastUpdate: now,
      }));

      // Check for slow render
      const isSlow = renderTime > slowRenderThreshold;
      setIsSlowRender(isSlow);

      // Record performance metrics
      performanceService.current.recordRenderMetric(
        componentName,
        renderTime,
        0, // props count - would need to be passed in
        0, // children count - would need to be passed in
      );

      // Track slow renders
      if (trackSlowRenders && isSlow) {
        logger.current.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(
            2,
          )}ms`,
        );

        if (enableAnalytics) {
          analyticsService.current.trackEvent(
            'slow_render',
            {
              component: componentName,
              render_time: renderTime,
              threshold: slowRenderThreshold,
            },
            'performance',
            'high',
          );
        }
      }

      // Calculate performance score
      const score = Math.max(0, 100 - (renderTime / slowRenderThreshold) * 50);
      setPerformanceScore(score);
    }

    renderStartTime.current = now;
  }, [
    enableRenderTracking,
    componentName,
    slowRenderThreshold,
    trackSlowRenders,
    enableAnalytics,
    shouldSample,
  ]);

  /**
   * Track memory usage
   */
  const trackMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking || !shouldSample()) return;

    try {
      // @ts-ignore - performance.memory is available in some environments
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-ignore
        const memoryInfo = performance.memory;
        const memoryUsage = memoryInfo.usedJSHeapSize;

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));

        recordMetric('memory_usage', memoryUsage, 'bytes');
      }
    } catch (error) {
      // Memory API not available
    }
  }, [enableMemoryTracking, recordMetric, shouldSample]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (enableAnalytics) {
        analyticsService.current.trackEvent(
          'app_state_change',
          {
            component: componentName,
            state: nextAppState,
            component_age: Date.now() - componentMountTime.current,
          },
          'custom',
          'low',
        );
      }
    },
    [componentName, enableAnalytics],
  );

  /**
   * Setup performance monitoring
   */
  useEffect(() => {
    // Track component mount
    if (enableAnalytics) {
      analyticsService.current.trackEvent(
        'component_mounted',
        {
          component: componentName,
        },
        'custom',
        'low',
      );
    }

    // Setup app state listener
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Setup memory tracking interval
    let memoryInterval: NodeJS.Timeout | null = null;
    if (enableMemoryTracking) {
      memoryInterval = setInterval(trackMemoryUsage, 5000); // Every 5 seconds
    }

    // Cleanup function
    return () => {
      // Track component unmount
      if (enableAnalytics) {
        const componentLifetime = Date.now() - componentMountTime.current;
        analyticsService.current.trackEvent(
          'component_unmounted',
          {
            component: componentName,
            lifetime: componentLifetime,
            render_count: renderCount.current,
            update_count: updateCount.current,
          },
          'custom',
          'low',
        );
      }

      // Cleanup subscriptions
      appStateSubscription?.remove();
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }

      // Clear any pending measurements
      measurements.current.clear();
    };
  }, [
    componentName,
    enableAnalytics,
    enableMemoryTracking,
    handleAppStateChange,
    trackMemoryUsage,
  ]);

  /**
   * Track updates
   */
  useEffect(() => {
    updateCount.current++;
    trackRender();
  });

  /**
   * Track initial render
   */
  useEffect(() => {
    renderStartTime.current = performance.now();
  }, []);

  return {
    metrics,
    startMeasurement,
    recordMetric,
    trackRender,
    isSlowRender,
    performanceScore,
  };
};

/**
 * Higher-order component for automatic performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UsePerformanceMonitoringOptions = {},
): React.ComponentType<P> => {
  const ComponentWithPerformanceMonitoring = (props: P) => {
    const componentName =
      options.componentName ||
      WrappedComponent.displayName ||
      WrappedComponent.name ||
      'Component';

    const {
      metrics,
      startMeasurement,
      recordMetric,
      trackRender,
      isSlowRender,
      performanceScore,
    } = usePerformanceMonitoring({
      ...options,
      componentName,
    });

    // Add performance props to the wrapped component
    const enhancedProps = {
      ...props,
      performanceMetrics: metrics,
      startMeasurement,
      recordMetric,
      trackRender,
      isSlowRender,
      performanceScore,
    } as P & {
      performanceMetrics: PerformanceMetrics;
      startMeasurement: (name: string) => () => void;
      recordMetric: (name: string, value: number, unit?: string) => void;
      trackRender: () => void;
      isSlowRender: boolean;
      performanceScore: number;
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  ComponentWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithPerformanceMonitoring;
};

/**
 * Hook for measuring async operations
 */
export const useAsyncPerformance = () => {
  const performanceService = useRef(EnhancedPerformanceService.getInstance());
  const analyticsService = useRef(EnhancedAnalyticsService.getInstance());

  const measureAsync = useCallback(
    async <T extends any>(
      name: string,
      asyncFn: () => Promise<T>,
      context?: Record<string, any>,
    ): Promise<{ result: T; duration: number }> => {
      const { result, duration } =
        await performanceService.current.measureAsync(name, asyncFn, context);

      // Track in analytics
      analyticsService.current.trackPerformance(name, duration, 'ms', context);

      return { result, duration };
    },
    [],
  );

  const measureSync = useCallback(
    <T extends any>(
      name: string,
      syncFn: () => T,
      context?: Record<string, any>,
    ): { result: T; duration: number } => {
      const { result, duration } = performanceService.current.measure(
        name,
        syncFn,
        context,
      );

      // Track in analytics
      analyticsService.current.trackPerformance(name, duration, 'ms', context);

      return { result, duration };
    },
    [],
  );

  return {
    measureAsync,
    measureSync,
  };
};

export default usePerformanceMonitoring;
