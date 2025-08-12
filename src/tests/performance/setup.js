/**
 * Performance Test Setup
 * Sets up performance monitoring and benchmarking utilities
 */

import 'react-native-gesture-handler/jestSetup';

// Performance testing utilities
global.performanceUtils = {
  // Memory usage tracking
  trackMemoryUsage: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
    return null;
  },

  // Execution time measurement
  measureExecutionTime: async (fn, name = 'operation') => {
    const start = Date.now();
    const memoryBefore = global.performanceUtils.trackMemoryUsage();

    let result;
    let error;

    try {
      result = await fn();
    } catch (error_) {
      error = error_;
    }

    const end = Date.now();
    const memoryAfter = global.performanceUtils.trackMemoryUsage();

    const metrics = {
      name,
      duration: end - start,
      timestamp: start,
      memory: {
        before: memoryBefore,
        after: memoryAfter,
        delta:
          memoryAfter && memoryBefore
            ? memoryAfter.used - memoryBefore.used
            : null,
      },
      success: !error,
      error,
      result,
    };

    // Store metrics for analysis
    if (!global.performanceMetrics) {
      global.performanceMetrics = [];
    }
    global.performanceMetrics.push(metrics);

    if (error) throw error;
    return { result, metrics };
  },

  // Render time measurement
  measureRenderTime: (Component, props = {}) => {
    const renderTimes = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      // Simulate component render
      try {
        // This would be actual render in a real test environment
        const mockRender = () => Component(props);
        mockRender();
      } catch (error) {
        // Handle render errors
      }

      const end = Date.now();
      renderTimes.push(end - start);
    }

    return {
      average: renderTimes.reduce((a, b) => a + b, 0) / iterations,
      min: Math.min(...renderTimes),
      max: Math.max(...renderTimes),
      p95: renderTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)],
      iterations,
      rawTimes: renderTimes,
    };
  },

  // Bundle size analysis
  analyzeBundleSize: bundleContent => {
    if (typeof bundleContent === 'string') {
      return {
        size: bundleContent.length,
        gzipEstimate: Math.floor(bundleContent.length * 0.3), // Rough estimate
        lines: bundleContent.split('\n').length,
        timestamp: Date.now(),
      };
    }
    return null;
  },

  // Performance thresholds
  thresholds: {
    maxRenderTime: 16, // 60fps = 16.67ms per frame
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxBundleSize: 2 * 1024 * 1024, // 2MB
    maxAPIResponseTime: 1000, // 1 second
  },

  // Assertion helpers
  assertPerformance: (metrics, thresholds = {}) => {
    const finalThresholds = {
      ...global.performanceUtils.thresholds,
      ...thresholds,
    };

    const violations = [];

    if (metrics.duration > finalThresholds.maxRenderTime) {
      violations.push(
        `Execution time ${metrics.duration}ms exceeds threshold ${finalThresholds.maxRenderTime}ms`,
      );
    }

    if (
      metrics.memory?.delta &&
      metrics.memory.delta > finalThresholds.maxMemoryUsage
    ) {
      violations.push(
        `Memory usage ${metrics.memory.delta} bytes exceeds threshold ${finalThresholds.maxMemoryUsage} bytes`,
      );
    }

    if (violations.length > 0) {
      throw new Error(`Performance violations:\n${violations.join('\n')}`);
    }

    return true;
  },

  // Load testing simulation
  simulateLoad: async (operation, concurrent = 10, iterations = 100) => {
    const results = [];
    const batches = Math.ceil(iterations / concurrent);

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = [];
      const batchSize = Math.min(concurrent, iterations - batch * concurrent);

      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(
          global.performanceUtils.measureExecutionTime(
            operation,
            `load_test_${batch}_${i}`,
          ),
        );
      }

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    const durations = successful.map(r => r.value.metrics.duration);

    return {
      total: iterations,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / iterations) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: durations.sort((a, b) => a - b)[
        Math.floor(durations.length * 0.95)
      ],
      errors: failed.map(r => r.reason),
    };
  },

  // Clear metrics
  clearMetrics: () => {
    global.performanceMetrics = [];
  },

  // Get all metrics
  getAllMetrics: () => {
    return global.performanceMetrics || [];
  },

  // Generate performance report
  generateReport: () => {
    const metrics = global.performanceUtils.getAllMetrics();

    if (metrics.length === 0) {
      return 'No performance metrics collected';
    }

    const totalOperations = metrics.length;
    const avgDuration =
      metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const maxDuration = Math.max(...metrics.map(m => m.duration));
    const minDuration = Math.min(...metrics.map(m => m.duration));

    const memoryMetrics = metrics
      .filter(m => m.memory?.delta)
      .map(m => m.memory.delta);
    const avgMemoryDelta =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((a, b) => a + b, 0) / memoryMetrics.length
        : 0;

    return {
      summary: {
        totalOperations,
        avgDuration: Math.round(avgDuration * 100) / 100,
        minDuration,
        maxDuration,
        avgMemoryDelta: Math.round(avgMemoryDelta),
      },
      violations: metrics.filter(
        m => m.duration > global.performanceUtils.thresholds.maxRenderTime,
      ).length,
      details: metrics,
    };
  },
};

// Initialize metrics storage
global.performanceMetrics = [];

console.log('⚡ Performance test environment initialized');
