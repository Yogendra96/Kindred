/**
 * useAdvancedLogging Hook Performance Tests
 * Tests performance characteristics and memory usage of the logging hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAdvancedLogging } from '../../useAdvancedLogging';

describe('useAdvancedLogging Performance Tests', () => {
  beforeEach(() => {
    global.performanceUtils.clearMetrics();
  });

  describe('Hook Initialization Performance', () => {
    it('should initialize within performance thresholds', async () => {
      const { result, metrics } =
        await global.performanceUtils.measureExecutionTime(
          () =>
            renderHook(() =>
              useAdvancedLogging({
                component: 'TestComponent',
                screen: 'TestScreen',
                category: 'performance',
              }),
            ),
          'hook_initialization',
        );

      // Hook should initialize quickly
      expect(metrics.duration).toBeLessThan(10); // Less than 10ms

      // Should not leak memory significantly
      if (metrics.memory.delta) {
        expect(metrics.memory.delta).toBeLessThan(1024 * 100); // Less than 100KB
      }
    });

    it('should handle rapid successive initializations efficiently', async () => {
      const iterations = 100;
      const { result: loadResult, metrics } =
        await global.performanceUtils.measureExecutionTime(() => {
          const hooks = [];
          for (let i = 0; i < iterations; i++) {
            const hook = renderHook(() =>
              useAdvancedLogging({
                component: `TestComponent${i}`,
                screen: `TestScreen${i}`,
                category: 'performance',
              }),
            );
            hooks.push(hook);
          }
          return hooks;
        }, 'rapid_initialization');

      // Batch initialization should be efficient
      expect(metrics.duration).toBeLessThan(1000); // Less than 1 second for 100 hooks
      expect(metrics.duration / iterations).toBeLessThan(10); // Less than 10ms per hook
    });
  });

  describe('Logging Operation Performance', () => {
    it('should log events efficiently', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
        }),
      );

      const logOperation = () => {
        act(() => {
          result.current.info('Performance test log message', {
            testData: 'performance',
            metrics: { value: 123 },
          });
        });
      };

      const { metrics } = await global.performanceUtils.measureExecutionTime(
        logOperation,
        'single_log_operation',
      );

      // Single log operation should be very fast
      expect(metrics.duration).toBeLessThan(5); // Less than 5ms

      global.performanceUtils.assertPerformance(metrics);
    });

    it('should handle high-frequency logging without performance degradation', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
        }),
      );

      const highFrequencyLogging = () => {
        // Simulate 1000 log entries
        for (let i = 0; i < 1000; i++) {
          act(() => {
            result.current.info(`High frequency log ${i}`, {
              iteration: i,
              timestamp: Date.now(),
            });
          });
        }
      };

      const { metrics } = await global.performanceUtils.measureExecutionTime(
        highFrequencyLogging,
        'high_frequency_logging',
      );

      // Should handle 1000 logs efficiently
      expect(metrics.duration).toBeLessThan(500); // Less than 500ms for 1000 logs
      expect(metrics.duration / 1000).toBeLessThan(1); // Less than 1ms per log
    });

    it('should maintain consistent performance across different log levels', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
        }),
      );

      const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      const performanceResults = [];

      for (const level of logLevels) {
        const { metrics } = await global.performanceUtils.measureExecutionTime(
          () => {
            act(() => {
              (result.current as any)[level](
                `${level} level performance test`,
                {
                  level,
                  testData: 'performance',
                },
              );
            });
          },
          `log_level_${level}`,
        );

        performanceResults.push({ level, duration: metrics.duration });
      }

      // All log levels should perform similarly
      const durations = performanceResults.map(r => r.duration);
      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxVariation = Math.max(...durations) - Math.min(...durations);

      expect(maxVariation).toBeLessThan(avgDuration * 0.5); // Variation should be less than 50% of average
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with extended usage', async () => {
      const memoryBefore = global.performanceUtils.trackMemoryUsage();

      const extendedUsageTest = async () => {
        for (let cycle = 0; cycle < 10; cycle++) {
          const { result } = renderHook(() =>
            useAdvancedLogging({
              component: `TestComponent${cycle}`,
              screen: `TestScreen${cycle}`,
              category: 'performance',
            }),
          );

          // Simulate typical usage
          for (let i = 0; i < 100; i++) {
            act(() => {
              result.current.info(`Extended usage log ${cycle}-${i}`, {
                cycle,
                iteration: i,
              });
            });
          }

          // Simulate component unmount
          result.current.cleanup?.();
        }
      };

      await extendedUsageTest();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = global.performanceUtils.trackMemoryUsage();

      if (memoryBefore && memoryAfter) {
        const memoryIncrease = memoryAfter.used - memoryBefore.used;
        // Memory increase should be minimal after cleanup
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
      }
    });

    it('should manage memory efficiently with large log datasets', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
          autoTrackPerformance: true,
        }),
      );

      const memoryBefore = global.performanceUtils.trackMemoryUsage();

      // Generate large amount of log data
      const largeDataTest = () => {
        const largeObject = {
          data: Array.from({ length: 1000 }).fill(
            'large data string for memory testing',
          ),
          metadata: {
            timestamp: Date.now(),
            additional: Array.from({ length: 100 }).fill({
              nested: 'object',
              value: Math.random(),
            }),
          },
        };

        for (let i = 0; i < 50; i++) {
          act(() => {
            result.current.info(`Large data log ${i}`, {
              ...largeObject,
              iteration: i,
            });
          });
        }
      };

      largeDataTest();

      const memoryAfter = global.performanceUtils.trackMemoryUsage();

      if (memoryBefore && memoryAfter) {
        const memoryUsed = memoryAfter.used - memoryBefore.used;
        // Should not use excessive memory even with large datasets
        expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      }
    });
  });

  describe('Concurrent Usage Performance', () => {
    it('should handle multiple concurrent logging hooks efficiently', async () => {
      const concurrentHooks = 20;
      const logsPerHook = 50;

      const concurrentTest = async () => {
        const hooks = Array.from({ length: concurrentHooks }, (_, i) =>
          renderHook(() =>
            useAdvancedLogging({
              component: `ConcurrentComponent${i}`,
              screen: `ConcurrentScreen${i}`,
              category: 'performance',
            }),
          ),
        );

        // Execute logging operations concurrently
        const operations = hooks.map((hook, hookIndex) =>
          Promise.resolve().then(() => {
            for (let logIndex = 0; logIndex < logsPerHook; logIndex++) {
              act(() => {
                hook.result.current.info(
                  `Concurrent log ${hookIndex}-${logIndex}`,
                  {
                    hookIndex,
                    logIndex,
                    timestamp: Date.now(),
                  },
                );
              });
            }
          }),
        );

        await Promise.all(operations);
        return hooks;
      };

      const { metrics } = await global.performanceUtils.measureExecutionTime(
        concurrentTest,
        'concurrent_logging',
      );

      const totalLogs = concurrentHooks * logsPerHook;

      // Should handle concurrent logging efficiently
      expect(metrics.duration).toBeLessThan(2000); // Less than 2 seconds total
      expect(metrics.duration / totalLogs).toBeLessThan(2); // Less than 2ms per log
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track its own performance overhead', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
          autoTrackPerformance: true,
        }),
      );

      // The hook should provide performance analytics
      const analytics = result.current.getComponentAnalytics();

      expect(analytics).toHaveProperty('totalLogs');
      expect(analytics).toHaveProperty('renderCount');
      expect(analytics).toHaveProperty('componentAge');
      expect(analytics).toHaveProperty('errorCount');

      // Performance tracking should itself be performant
      const { metrics } = await global.performanceUtils.measureExecutionTime(
        () => result.current.getComponentAnalytics(),
        'analytics_retrieval',
      );

      expect(metrics.duration).toBeLessThan(5); // Less than 5ms to get analytics
    });

    it('should provide performance insights for optimization', async () => {
      const { result } = renderHook(() =>
        useAdvancedLogging({
          component: 'TestComponent',
          screen: 'TestScreen',
          category: 'performance',
          autoTrackPerformance: true,
        }),
      );

      // Generate various types of logs
      const logTypes = ['info', 'warn', 'error'];
      const logsPerType = 50;

      for (const logType of logTypes) {
        for (let i = 0; i < logsPerType; i++) {
          act(() => {
            (result.current as any)[logType](`${logType} message ${i}`, {
              type: logType,
              iteration: i,
            });
          });
        }
      }

      const analytics = result.current.getComponentAnalytics();

      // Should provide meaningful metrics
      expect(analytics.totalLogs).toBe(logTypes.length * logsPerType);
      expect(analytics.componentAge).toBeGreaterThan(0);

      // Should have performance recommendations
      if (analytics.recommendations) {
        expect(Array.isArray(analytics.recommendations)).toBe(true);
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain performance characteristics over time', async () => {
      const iterations = 10;
      const performanceHistory = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        const { result } = renderHook(() =>
          useAdvancedLogging({
            component: 'RegressionTestComponent',
            screen: 'RegressionTestScreen',
            category: 'performance',
          }),
        );

        const { metrics } = await global.performanceUtils.measureExecutionTime(
          () => {
            for (let i = 0; i < 100; i++) {
              act(() => {
                result.current.info(`Regression test log ${iteration}-${i}`, {
                  iteration,
                  logIndex: i,
                });
              });
            }
          },
          `regression_test_${iteration}`,
        );

        performanceHistory.push(metrics.duration);
      }

      // Calculate performance trend
      const averageDuration =
        performanceHistory.reduce((a, b) => a + b, 0) / iterations;
      const maxDuration = Math.max(...performanceHistory);
      const minDuration = Math.min(...performanceHistory);
      const variation = ((maxDuration - minDuration) / averageDuration) * 100;

      // Performance should be consistent (low variation)
      expect(variation).toBeLessThan(50); // Less than 50% variation
      expect(averageDuration).toBeLessThan(100); // Average should be reasonable
    });
  });

  describe('Performance Test Reporting', () => {
    afterAll(() => {
      // Generate comprehensive performance report
      const report = global.performanceUtils.generateReport();

      console.log('\n🚀 useAdvancedLogging Performance Test Report:');
      console.log(`Total Operations: ${report.summary.totalOperations}`);
      console.log(`Average Duration: ${report.summary.avgDuration}ms`);
      console.log(`Min Duration: ${report.summary.minDuration}ms`);
      console.log(`Max Duration: ${report.summary.maxDuration}ms`);
      console.log(`Performance Violations: ${report.violations}`);

      if (report.violations > 0) {
        console.warn(
          '⚠️  Performance violations detected - review test results',
        );
      } else {
        console.log('✅ All performance tests passed');
      }
    });
  });
});
