/**
 * PerformanceService.ts — DEPRECATED / CONSOLIDATED
 *
 * @deprecated Use PerformanceMonitoringService instead.
 * PerformanceMonitoringService is the complete implementation with
 * PerformanceObserver, memory tracking, and custom metrics.
 *
 * Backward-compatible barrel re-export — all existing imports still compile.
 */
export {
  PerformanceMonitoringService,
  PerformanceMonitoringService as PerformanceService,
  performanceService,
} from './PerformanceMonitoringService';
