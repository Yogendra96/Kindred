// @ts-nocheck
/* eslint-disable */
import { AnalyticsService } from '../services/AnalyticsService';
import { ModernAPMService } from '../services/ModernAPMService';
import loggingService from '../services/LoggerService';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
  updateCount: number;
  lastUpdate: number;
}

interface UseModernAPMOptions {
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
  startTrace: (name: string) => Promise<void>;
  stopTrace: (name: string, attributes?: Record<string, string>) => Promise<void>;
}

/**
 * Modern APM Hook for React Native components
 * Replaces usePerformanceMonitoring
 */
export const useModernAPM = (options: UseModernAPMOptions = {}): PerformanceHookReturn => {
  const {
    componentName = 'UnknownComponent',
    enableRenderTracking = true,
    enableMemoryTracking = true,
    enableAnalytics = true,
    trackSlowRenders = true,
    slowRenderThreshold = 16,
    sampleRate = 1.0,
  } = options;

  const apmService = useRef(ModernAPMService.getInstance());
  const analyticsService = useRef(AnalyticsService.getInstance());
  const logger = useRef(loggingService);

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const updateCount = useRef<number>(0);
  const componentMountTime = useRef<number>(Date.now());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    updateCount: 0,
    lastUpdate: Date.now(),
  });

  const [isSlowRender, setIsSlowRender] = useState<boolean>(false);
  const [performanceScore, setPerformanceScore] = useState<number>(100);

  const shouldSample = useCallback((): boolean => {
    return Math.random() < sampleRate;
  }, [sampleRate]);

  const startMeasurement = useCallback(
    (name: string) => {
      if (!shouldSample()) return () => {};
      const startTime = performance.now();
      return () => {
        const duration = performance.now() - startTime;
        apmService.current.recordMetric({
          name: `${componentName}_${name}`,
          value: duration,
          unit: 'ms',
          severity: 'low',
          context: { component: componentName },
        });

        if (enableAnalytics) {
          analyticsService.current.trackPerformance(`${componentName}_${name}`, duration, 'ms', {
            component: componentName,
          });
        }
      };
    },
    [componentName, enableAnalytics, shouldSample],
  );

  const recordMetric = useCallback(
    (name: string, value: number, unit: string = 'ms') => {
      if (!shouldSample()) return;
      apmService.current.recordMetric({
        name: `${componentName}_${name}`,
        value,
        unit,
        severity: 'low',
        context: { component: componentName },
      });

      if (enableAnalytics) {
        analyticsService.current.trackPerformance(`${componentName}_${name}`, value, unit, {
          component: componentName,
        });
      }
    },
    [componentName, enableAnalytics, shouldSample],
  );

  const trackRender = useCallback(() => {
    if (!enableRenderTracking || !shouldSample()) return;
    const now = performance.now();
    if (renderStartTime.current > 0) {
      const renderTime = now - renderStartTime.current;
      renderCount.current++;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        componentCount: renderCount.current,
        updateCount: updateCount.current,
        lastUpdate: now,
      }));

      const isSlow = renderTime > slowRenderThreshold;
      setIsSlowRender(isSlow);
      apmService.current.recordRenderMetric(componentName, renderTime);

      if (trackSlowRenders && isSlow) {
        logger.current.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        if (enableAnalytics) {
          analyticsService.current.trackError(`Slow render in ${componentName}`, {
            render_time: renderTime,
            threshold: slowRenderThreshold,
          });
        }
      }
      setPerformanceScore(Math.max(0, 100 - (renderTime / slowRenderThreshold) * 50));
    }
    renderStartTime.current = now;
  }, [
    componentName,
    enableRenderTracking,
    slowRenderThreshold,
    trackSlowRenders,
    enableAnalytics,
    shouldSample,
  ]);

  const startTrace = useCallback(async (name: string) => {
    await apmService.current.startTrace(name);
  }, []);

  const stopTrace = useCallback(async (name: string, attributes?: Record<string, string>) => {
    await apmService.current.stopTrace(name, attributes);
  }, []);

  useEffect(() => {
    if (enableAnalytics) {
      analyticsService.current.trackEvent('component_mounted', { component: componentName });
    }
    const appStateSubscription = AppState.addEventListener('change', nextState => {
      if (enableAnalytics) {
        analyticsService.current.trackEvent('app_state_change', {
          component: componentName,
          state: nextState,
        });
      }
    });

    return () => {
      if (enableAnalytics) {
        analyticsService.current.trackEvent('component_unmounted', {
          component: componentName,
          lifetime: Date.now() - componentMountTime.current,
        });
      }
      appStateSubscription.remove();
    };
  }, [componentName, enableAnalytics]);

  useEffect(() => {
    updateCount.current++;
    trackRender();
  });

  return {
    metrics,
    startMeasurement,
    recordMetric,
    trackRender,
    isSlowRender,
    performanceScore,
    startTrace,
    stopTrace,
  };
};
