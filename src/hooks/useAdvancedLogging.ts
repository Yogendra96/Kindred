/**
 * 📊 Advanced Logging Hook
 * React hook for seamless component-level logging with automatic lifecycle tracking
 */

import { useCallback, useEffect, useRef } from 'react';

import { Logger, type LogMetadata } from '../services/AdvancedLoggingService';

export interface UseAdvancedLoggingOptions {
  component: string;
  screen?: string;
  category?: LogMetadata['category'];
  autoTrackLifecycle?: boolean;
  autoTrackPerformance?: boolean;
  autoTrackRenders?: boolean;
  autoTrackMemory?: boolean;
}

export interface AdvancedLoggingHook {
  // Basic logging methods
  trace: (message: string, metadata?: Partial<LogMetadata>) => void;
  debug: (message: string, metadata?: Partial<LogMetadata>) => void;
  info: (message: string, metadata?: Partial<LogMetadata>) => void;
  warn: (message: string, metadata?: Partial<LogMetadata>) => void;
  error: (message: string, metadata?: Partial<LogMetadata>, error?: Error) => void;
  fatal: (message: string, metadata?: Partial<LogMetadata>, error?: Error) => void;

  // Performance tracking
  startTimer: (name: string) => void;
  endTimer: (name: string, metadata?: Partial<LogMetadata>) => void;

  // User action tracking
  trackUserAction: (action: string, metadata?: Partial<LogMetadata>) => void;
  trackButtonPress: (buttonName: string, metadata?: Partial<LogMetadata>) => void;
  trackNavigation: (destination: string, metadata?: Partial<LogMetadata>) => void;
  trackFormSubmission: (
    formName: string,
    success: boolean,
    metadata?: Partial<LogMetadata>,
  ) => void;
  trackError: (errorName: string, error: Error, metadata?: Partial<LogMetadata>) => void;

  // Business logic tracking
  trackBusinessEvent: (event: string, metadata?: Partial<LogMetadata>) => void;
  trackCarbonCalculation: (result: number, method: string, metadata?: Partial<LogMetadata>) => void;
  trackDataFetch: (
    endpoint: string,
    duration: number,
    success: boolean,
    metadata?: Partial<LogMetadata>,
  ) => void;

  // State change tracking
  trackStateChange: (
    stateName: string,
    oldValue: any,
    newValue: any,
    metadata?: Partial<LogMetadata>,
  ) => void;

  // Search and analytics
  search: (query: string) => any[];
  getComponentAnalytics: () => any;
}

export const useAdvancedLogging = (options: UseAdvancedLoggingOptions): AdvancedLoggingHook => {
  const {
    component,
    screen,
    category = 'user',
    autoTrackLifecycle = true,
    autoTrackPerformance = true,
    autoTrackRenders = false,
    autoTrackMemory = false,
  } = options;

  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(Date.now());
  const lastRenderTimeRef = useRef<number>(Date.now());

  // Base metadata for all logs from this component
  const baseMetadata: LogMetadata = {
    component,
    screen: screen || component,
    category,
  };

  // Enhanced logging methods with automatic component context
  const createLogMethod = useCallback(
    (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') => {
      return (message: string, metadata: Partial<LogMetadata> = {}, error?: Error) => {
        const fullMetadata = {
          ...baseMetadata,
          ...metadata,
          renderCount: renderCountRef.current,
          componentAge: Date.now() - mountTimeRef.current,
        };

        if (level === 'error' || level === 'fatal') {
          Logger[level](message, fullMetadata, error);
        } else {
          Logger[level](message, fullMetadata);
        }
      };
    },
    [baseMetadata],
  );

  const trace = useCallback(createLogMethod('trace'), [createLogMethod]);
  const debug = useCallback(createLogMethod('debug'), [createLogMethod]);
  const info = useCallback(createLogMethod('info'), [createLogMethod]);
  const warn = useCallback(createLogMethod('warn'), [createLogMethod]);
  const error = useCallback(createLogMethod('error'), [createLogMethod]);
  const fatal = useCallback(createLogMethod('fatal'), [createLogMethod]);

  // Performance tracking
  const startTimer = useCallback(
    (name: string) => {
      const timerName = `${component}_${name}`;
      Logger.startTimer(timerName);

      debug(`Started timer: ${name}`, {
        action: 'timer_start',
        timerName,
      });
    },
    [component, debug],
  );

  const endTimer = useCallback(
    (name: string, metadata: Partial<LogMetadata> = {}) => {
      const timerName = `${component}_${name}`;
      Logger.endTimer(timerName, {
        ...baseMetadata,
        ...metadata,
        action: 'timer_end',
        timerName,
      });
    },
    [component, baseMetadata],
  );

  // User action tracking
  const trackUserAction = useCallback(
    (action: string, metadata: Partial<LogMetadata> = {}) => {
      info(`User action: ${action}`, {
        ...metadata,
        action: 'user_action',
        userAction: action,
        tags: ['user_interaction', ...(metadata.tags || [])],
      });
    },
    [info],
  );

  const trackButtonPress = useCallback(
    (buttonName: string, metadata: Partial<LogMetadata> = {}) => {
      trackUserAction(`button_press_${buttonName}`, {
        ...metadata,
        buttonName,
        tags: ['button_press', ...(metadata.tags || [])],
      });
    },
    [trackUserAction],
  );

  const trackNavigation = useCallback(
    (destination: string, metadata: Partial<LogMetadata> = {}) => {
      info(`Navigation to: ${destination}`, {
        ...metadata,
        action: 'navigation',
        destination,
        source: component,
        tags: ['navigation', ...(metadata.tags || [])],
      });
    },
    [info, component],
  );

  const trackFormSubmission = useCallback(
    (formName: string, success: boolean, metadata: Partial<LogMetadata> = {}) => {
      const logLevel = success ? info : warn;
      logLevel(`Form submission: ${formName} - ${success ? 'success' : 'failed'}`, {
        ...metadata,
        action: 'form_submission',
        formName,
        success,
        tags: ['form_submission', success ? 'success' : 'error', ...(metadata.tags || [])],
      });
    },
    [info, warn],
  );

  const trackError = useCallback(
    (errorName: string, errorObj: Error, metadata: Partial<LogMetadata> = {}) => {
      error(
        `Component error: ${errorName}`,
        {
          ...metadata,
          action: 'component_error',
          errorName,
          tags: ['component_error', ...(metadata.tags || [])],
        },
        errorObj,
      );
    },
    [error],
  );

  // Business logic tracking
  const trackBusinessEvent = useCallback(
    (event: string, metadata: Partial<LogMetadata> = {}) => {
      info(`Business event: ${event}`, {
        ...metadata,
        action: 'business_event',
        businessEvent: event,
        tags: ['business_logic', ...(metadata.tags || [])],
      });
    },
    [info],
  );

  const trackCarbonCalculation = useCallback(
    (result: number, method: string, metadata: Partial<LogMetadata> = {}) => {
      info(`Carbon calculation completed: ${result} kg CO2`, {
        ...metadata,
        action: 'carbon_calculation',
        carbonResult: result,
        calculationMethod: method,
        category: 'carbon',
        tags: ['carbon_calculation', ...(metadata.tags || [])],
      });
    },
    [info],
  );

  const trackDataFetch = useCallback(
    (endpoint: string, duration: number, success: boolean, metadata: Partial<LogMetadata> = {}) => {
      const logLevel = success ? info : warn;
      logLevel(`Data fetch ${success ? 'completed' : 'failed'}: ${endpoint} (${duration}ms)`, {
        ...metadata,
        action: 'data_fetch',
        endpoint,
        duration,
        success,
        tags: ['data_fetch', success ? 'success' : 'error', ...(metadata.tags || [])],
      });
    },
    [info, warn],
  );

  // State change tracking
  const trackStateChange = useCallback(
    (stateName: string, oldValue: any, newValue: any, metadata: Partial<LogMetadata> = {}) => {
      debug(`State change: ${stateName}`, {
        ...metadata,
        action: 'state_change',
        stateName,
        oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
        newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
        tags: ['state_change', ...(metadata.tags || [])],
      });
    },
    [debug],
  );

  // Search functionality
  const search = useCallback(
    (query: string) => {
      return Logger.search({
        query,
        screen: screen || component,
        component,
        limit: 100,
      });
    },
    [component, screen],
  );

  // Component analytics
  const getComponentAnalytics = useCallback(() => {
    const logs = Logger.search({
      component,
      limit: 1000,
    });

    return {
      totalLogs: logs.length,
      renderCount: renderCountRef.current,
      componentAge: Date.now() - mountTimeRef.current,
      errorCount: logs.filter(log => ['error', 'fatal'].includes(log.level)).length,
      userActionCount: logs.filter(log => log.metadata.tags?.includes('user_interaction')).length,
    };
  }, [component]);

  // Lifecycle tracking
  useEffect(() => {
    if (autoTrackLifecycle) {
      mountTimeRef.current = Date.now();

      Logger.setScreen(screen || component, baseMetadata);

      info('Component mounted', {
        action: 'component_mount',
        mountTime: mountTimeRef.current,
        tags: ['lifecycle'],
      });

      return () => {
        info('Component unmounting', {
          action: 'component_unmount',
          componentAge: Date.now() - mountTimeRef.current,
          totalRenders: renderCountRef.current,
          tags: ['lifecycle'],
        });
      };
    }
  }, [autoTrackLifecycle, screen, component, baseMetadata, info]);

  // Render tracking
  useEffect(() => {
    if (autoTrackRenders) {
      renderCountRef.current += 1;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      lastRenderTimeRef.current = now;

      if (renderCountRef.current > 1) {
        // Skip first render
        debug(`Component render #${renderCountRef.current}`, {
          action: 'component_render',
          renderNumber: renderCountRef.current,
          timeSinceLastRender,
          tags: ['performance', 'render'],
        });

        // Warn about frequent re-renders
        if (timeSinceLastRender < 16) {
          // Less than 16ms (60fps)
          warn('Frequent re-renders detected', {
            action: 'frequent_renders',
            renderCount: renderCountRef.current,
            timeSinceLastRender,
            tags: ['performance', 'warning'],
          });
        }
      }
    }
  });

  // Memory tracking
  useEffect(() => {
    if (autoTrackMemory) {
      const interval = setInterval(() => {
        const memoryUsage = (global as any).performance?.memory?.usedJSHeapSize || 0;

        debug('Memory usage check', {
          action: 'memory_check',
          memoryUsage,
          tags: ['performance', 'memory'],
        });

        // Warn about high memory usage (>100MB)
        if (memoryUsage > 100 * 1024 * 1024) {
          warn('High memory usage detected', {
            action: 'high_memory_usage',
            memoryUsage,
            tags: ['performance', 'warning', 'memory'],
          });
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoTrackMemory, debug, warn]);

  return {
    // Basic logging
    trace,
    debug,
    info,
    warn,
    error,
    fatal,

    // Performance
    startTimer,
    endTimer,

    // User actions
    trackUserAction,
    trackButtonPress,
    trackNavigation,
    trackFormSubmission,
    trackError,

    // Business logic
    trackBusinessEvent,
    trackCarbonCalculation,
    trackDataFetch,

    // State changes
    trackStateChange,

    // Analytics
    search,
    getComponentAnalytics,
  };
};

// Export a simpler version for basic components
export const useBasicLogging = (component: string, category?: LogMetadata['category']) => {
  return useAdvancedLogging({
    component,
    category,
    autoTrackLifecycle: true,
    autoTrackPerformance: false,
    autoTrackRenders: false,
    autoTrackMemory: false,
  });
};

// Export performance-focused version
export const usePerformanceLogging = (component: string) => {
  return useAdvancedLogging({
    component,
    category: 'performance',
    autoTrackLifecycle: true,
    autoTrackPerformance: true,
    autoTrackRenders: true,
    autoTrackMemory: true,
  });
};

export default useAdvancedLogging;
