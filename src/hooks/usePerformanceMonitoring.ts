import { useEffect, useRef, useState } from 'react';

/**
 * Configuration for performance monitoring
 */
export interface PerformanceMonitoringConfig {
  /** Threshold in milliseconds for slow operations */
  threshold?: number;
  /** Whether to enable memory monitoring */
  enableMemoryTracking?: boolean;
  /** Whether to enable render time tracking */
  enableRenderTracking?: boolean;
  /** Callback for slow operations */
  onSlowOperation?: (duration: number, type: string) => void;
  /** Callback for memory warnings */
  onMemoryWarning?: (usage: number) => void;
}

/**
 * Performance metrics returned by the hook
 */
export interface PerformanceMetrics {
  /** Current render time in milliseconds */
  renderTime: number;
  /** Average render time over recent renders */
  averageRenderTime: number;
  /** Memory usage in MB (estimate) */
  memoryUsage: number;
  /** Number of renders in current session */
  renderCount: number;
  /** Whether the last operation was slow */
  isSlowRender: boolean;
  /** Start timing for a custom operation */
  startTiming: (operationName: string) => void;
  /** End timing for a custom operation */
  endTiming: (operationName: string) => number;
  /** Reset performance metrics */
  reset: () => void;
}

/**
 * Advanced Performance Monitoring Hook
 *
 * Tracks render performance, memory usage, and custom operations.
 * Provides real-time metrics and alerts for performance issues.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { renderTime, isSlowRender, startTiming, endTiming } = usePerformanceMonitoring({
 *     threshold: 16, // 60fps target
 *     onSlowOperation: (time) => console.warn(`Slow render: ${time}ms`),
 *   });
 *
 *   const handleExpensiveOperation = async () => {
 *     startTiming('data-fetch');
 *     await fetchData();
 *     const duration = endTiming('data-fetch');
 *     console.log(`Fetch took ${duration}ms`);
 *   };
 *
 *   return <View>...</View>;
 * };
 * ```
 */
export const usePerformanceMonitoring = (
  config: PerformanceMonitoringConfig = {},
): PerformanceMetrics => {
  const {
    threshold = 16, // 60fps target
    enableMemoryTracking = true,
    enableRenderTracking = true,
    onSlowOperation,
    onMemoryWarning,
  } = config;

  // State for metrics
  const [renderTime, setRenderTime] = useState(0);
  const [averageRenderTime, setAverageRenderTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [isSlowRender, setIsSlowRender] = useState(false);

  // Refs for tracking
  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const customTimings = useRef<Map<string, number>>(new Map());
  const memoryCheckInterval = useRef<NodeJS.Timeout>();

  // Start render timing
  useEffect(() => {
    if (!enableRenderTracking) return;

    renderStartTime.current = performance.now();
  });

  // End render timing and calculate metrics
  useEffect(() => {
    if (!enableRenderTracking) return;

    const endTime = performance.now();
    const currentRenderTime = endTime - renderStartTime.current;

    // Update render metrics
    setRenderTime(currentRenderTime);
    setRenderCount(prev => prev + 1);

    // Track render times for average calculation
    renderTimes.current.push(currentRenderTime);
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift(); // Keep only last 100 renders
    }

    // Calculate average render time
    const average =
      renderTimes.current.reduce((sum, time) => sum + time, 0) /
      renderTimes.current.length;
    setAverageRenderTime(average);

    // Check if render is slow
    const isSlow = currentRenderTime > threshold;
    setIsSlowRender(isSlow);

    // Trigger slow operation callback
    if (isSlow && onSlowOperation) {
      onSlowOperation(currentRenderTime, 'render');
    }
  });

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryTracking) return;

    const checkMemory = () => {
      // Estimate memory usage (React Native specific approach)
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        const usageInMB = memInfo.usedJSHeapSize / (1024 * 1024);
        setMemoryUsage(usageInMB);

        // Check for memory warnings
        const memoryThreshold = 50; // 50MB threshold
        if (usageInMB > memoryThreshold && onMemoryWarning) {
          onMemoryWarning(usageInMB);
        }
      } else {
        // Fallback for environments without memory API
        setMemoryUsage(0);
      }
    };

    // Check memory every 5 seconds
    memoryCheckInterval.current = setInterval(checkMemory, 5000);
    checkMemory(); // Initial check

    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, [enableMemoryTracking, onMemoryWarning]);

  // Custom timing functions
  const startTiming = (operationName: string): void => {
    customTimings.current.set(operationName, performance.now());
  };

  const endTiming = (operationName: string): number => {
    const startTime = customTimings.current.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    customTimings.current.delete(operationName);

    // Check if operation is slow
    if (duration > threshold && onSlowOperation) {
      onSlowOperation(duration, operationName);
    }

    return duration;
  };

  // Reset function
  const reset = (): void => {
    setRenderTime(0);
    setAverageRenderTime(0);
    setMemoryUsage(0);
    setRenderCount(0);
    setIsSlowRender(false);
    renderTimes.current = [];
    customTimings.current.clear();
  };

  return {
    renderTime,
    averageRenderTime,
    memoryUsage,
    renderCount,
    isSlowRender,
    startTiming,
    endTiming,
    reset,
  };
};

/**
 * React Hook for measuring async operation performance
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const measureAsync = useAsyncPerformance();
 *
 *   const handleDataFetch = async () => {
 *     const duration = await measureAsync('api-call', async () => {
 *       return await fetch('/api/data');
 *     });
 *     console.log(`API call took ${duration}ms`);
 *   };
 *
 *   return <Button onPress={handleDataFetch}>Fetch Data</Button>;
 * };
 * ```
 */
export const useAsyncPerformance = () => {
  return async <T>(
    operationName: string,
    operation: () => Promise<T>,
    onComplete?: (duration: number) => void,
  ): Promise<T> => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      if (onComplete) {
        onComplete(duration);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `Operation ${operationName} failed after ${duration}ms:`,
        error,
      );
      throw error;
    }
  };
};

/**
 * Hook for tracking component lifecycle performance
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { mountTime, updateTime, unmountTime } = useLifecyclePerformance();
 *
 *   console.log(`Component mounted in ${mountTime}ms`);
 *
 *   return <View>...</View>;
 * };
 * ```
 */
export const useLifecyclePerformance = () => {
  const [mountTime, setMountTime] = useState(0);
  const [updateTime, setUpdateTime] = useState(0);
  const [unmountTime, setUnmountTime] = useState(0);

  const mountStartTime = useRef(performance.now());
  const updateStartTime = useRef(0);

  // Measure mount time
  useEffect(() => {
    const duration = performance.now() - mountStartTime.current;
    setMountTime(duration);
  }, []);

  // Measure update time
  useEffect(() => {
    updateStartTime.current = performance.now();
  });

  useEffect(() => {
    if (updateStartTime.current > 0) {
      const duration = performance.now() - updateStartTime.current;
      setUpdateTime(duration);
    }
  });

  // Measure unmount time
  useEffect(() => {
    return () => {
      const duration = performance.now() - performance.now(); // This will be very small
      setUnmountTime(duration);
    };
  }, []);

  return {
    mountTime,
    updateTime,
    unmountTime,
  };
};

export default usePerformanceMonitoring;
