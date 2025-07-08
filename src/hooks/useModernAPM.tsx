/**
 * React Hook for Modern Application Performance Monitoring
 * Provides easy integration with React Native components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { modernAPMService } from '../services/ModernAPMService';
import {
  CoreVitalType,
  EnhancedPerformanceMetric,
  PerformanceAlert,
  NativeMemoryMetrics,
  SessionPerformanceData,
  PerformanceConfig,
} from '../types/performance';

export interface UseModernAPMOptions {
  screenName?: string;
  autoTrackRender?: boolean;
  trackInteractions?: boolean;
  trackMemory?: boolean;
  userId?: string;
  config?: Partial<PerformanceConfig>;
}

export interface ModernAPMHookReturn {
  // Core Web Vitals tracking
  startScreenRender: (screenName?: string) => void;
  endScreenRender: (screenName?: string, context?: Record<string, unknown>) => void;
  recordCoreVital: (type: CoreVitalType, value: number, context?: Record<string, unknown>) => void;
  recordTouchInteraction: (actionName: string, delay: number) => void;
  recordLayoutShift: (shiftScore: number, context?: Record<string, unknown>) => void;
  
  // Performance metrics
  recordMetric: (metric: Omit<EnhancedPerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'screenName'>) => void;
  
  // Memory tracking
  trackMemory: () => Promise<NativeMemoryMetrics>;
  trackComponentLifecycle: (componentName: string, event: 'mount' | 'unmount' | 'update') => void;
  
  // Real-time data
  sessionSummary: ReturnType<typeof modernAPMService.getSessionSummary> | null;
  realTimeMetrics: ReturnType<typeof modernAPMService.getRealTimeMetrics> | null;
  activeAlerts: PerformanceAlert[];
  
  // Status
  isInitialized: boolean;
  error: string | null;
  
  // Utilities
  exportData: () => SessionPerformanceData;
  refreshMetrics: () => void;
}

export const useModernAPM = (options: UseModernAPMOptions = {}): ModernAPMHookReturn => {
  const {
    screenName = 'unknown',
    autoTrackRender = true,
    trackInteractions = true,
    trackMemory: _enableMemoryTracking = true,
    userId,
    config,
  } = options;
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<ReturnType<typeof modernAPMService.getSessionSummary> | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<ReturnType<typeof modernAPMService.getRealTimeMetrics> | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  
  // Refs
  const initializationAttempted = useRef(false);
  const renderStartTime = useRef<number>(0);
  const _interactionStartTime = useRef<number>(0);
  const metricsRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize APM service
  useEffect(() => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;
    
    const initializeAPM = async () => {
      try {
        await modernAPMService.initialize(config);
        
        if (userId) {
          modernAPMService.setCurrentUser(userId);
        }
        
        setIsInitialized(true);
        setError(null);
        
        // Start metrics refresh interval
        metricsRefreshInterval.current = setInterval(() => {
          refreshMetrics();
        }, 5000); // Refresh every 5 seconds
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize APM';
        setError(errorMessage);
        console.error('Failed to initialize Modern APM:', errorMessage);
      }
    };
    
    initializeAPM();
    
    // Cleanup on unmount
    return () => {
      if (metricsRefreshInterval.current) {
        clearInterval(metricsRefreshInterval.current);
      }
    };
  }, [config, userId]);
  
  // Auto-track screen render if enabled
  useEffect(() => {
    if (!isInitialized || !autoTrackRender) return;
    
    // Start render tracking when component mounts
    startScreenRender(screenName);
    
    // End render tracking when component unmounts or screen changes
    return () => {
      if (renderStartTime.current > 0) {
        endScreenRender(screenName);
      }
    };
  }, [isInitialized, screenName, autoTrackRender]);
  
  // Track app state changes for better context
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        recordMetric({
          name: 'app_foreground',
          value: Date.now(),
          unit: 'timestamp',
          severity: 'low',
          context: { transition: 'to_active' },
        });
      } else if (nextAppState === 'background') {
        recordMetric({
          name: 'app_background',
          value: Date.now(),
          unit: 'timestamp',
          severity: 'low',
          context: { transition: 'to_background' },
        });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isInitialized]);
  
  // Core Web Vitals tracking functions
  const startScreenRender = useCallback((customScreenName?: string) => {
    if (!isInitialized) return;
    
    const screen = customScreenName || screenName;
    renderStartTime.current = performance.now();
    modernAPMService.startScreenRender(screen);
  }, [isInitialized, screenName]);
  
  const endScreenRender = useCallback((customScreenName?: string, context?: Record<string, unknown>) => {
    if (!isInitialized || renderStartTime.current === 0) return;
    
    const screen = customScreenName || screenName;
    modernAPMService.endScreenRender(screen, context);
    renderStartTime.current = 0;
  }, [isInitialized, screenName]);
  
  const recordCoreVital = useCallback((
    type: CoreVitalType,
    value: number,
    context?: Record<string, unknown>
  ) => {
    if (!isInitialized) return;
    
    modernAPMService.recordCoreVital(type, value, screenName, context);
  }, [isInitialized, screenName]);
  
  const recordTouchInteraction = useCallback((actionName: string, delay: number) => {
    if (!isInitialized || !trackInteractions) return;
    
    modernAPMService.recordTouchInteraction(screenName, actionName, delay);
  }, [isInitialized, screenName, trackInteractions]);
  
  const recordLayoutShift = useCallback((shiftScore: number, context?: Record<string, unknown>) => {
    if (!isInitialized) return;
    
    modernAPMService.recordLayoutShift(screenName, shiftScore, context);
  }, [isInitialized, screenName]);
  
  // Performance metrics
  const recordMetric = useCallback((
    metric: Omit<EnhancedPerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'screenName'>
  ) => {
    if (!isInitialized) return;
    
    modernAPMService.recordEnhancedMetric(metric);
  }, [isInitialized]);
  
  // Memory tracking
  const trackMemory = useCallback(async (): Promise<NativeMemoryMetrics> => {
    if (!isInitialized) {
      throw new Error('APM not initialized');
    }
    
    return await modernAPMService.trackNativeMemory();
  }, [isInitialized]);
  
  const trackComponentLifecycle = useCallback((
    componentName: string,
    event: 'mount' | 'unmount' | 'update'
  ) => {
    if (!isInitialized) return;
    
    modernAPMService.trackComponentLifecycle(componentName, event);
  }, [isInitialized]);
  
  // Utilities
  const exportData = useCallback((): SessionPerformanceData => {
    if (!isInitialized) {
      throw new Error('APM not initialized');
    }
    
    return modernAPMService.exportSessionData();
  }, [isInitialized]);
  
  const refreshMetrics = useCallback(() => {
    if (!isInitialized) return;
    
    try {
      setSessionSummary(modernAPMService.getSessionSummary());
      const metrics = modernAPMService.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
      setActiveAlerts(metrics.activeAlerts);
    } catch (err) {
      console.warn('Failed to refresh APM metrics:', err);
    }
  }, [isInitialized]);
  
  // Initial metrics load
  useEffect(() => {
    if (isInitialized) {
      refreshMetrics();
    }
  }, [isInitialized, refreshMetrics]);
  
  return {
    // Core Web Vitals
    startScreenRender,
    endScreenRender,
    recordCoreVital,
    recordTouchInteraction,
    recordLayoutShift,
    
    // Performance metrics
    recordMetric,
    
    // Memory tracking
    trackMemory,
    trackComponentLifecycle,
    
    // Real-time data
    sessionSummary,
    realTimeMetrics,
    activeAlerts,
    
    // Status
    isInitialized,
    error,
    
    // Utilities
    exportData,
    refreshMetrics,
  };
};

/**
 * Hook for tracking component performance automatically
 */
export const useComponentPerformance = (
  componentName: string,
  options: { trackMemory?: boolean; trackRender?: boolean } = {}
) => {
  const { trackMemory: _trackMemory = true, trackRender = true } = options;
  const { trackComponentLifecycle, recordMetric, isInitialized } = useModernAPM();
  
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);
  
  // Track component mount
  useEffect(() => {
    if (!isInitialized) return;
    
    mountTime.current = performance.now();
    trackComponentLifecycle(componentName, 'mount');
    
    if (trackRender) {
      renderStartTime.current = performance.now();
    }
    
    return () => {
      // Track component unmount
      trackComponentLifecycle(componentName, 'unmount');
      
      // Record component lifetime
      const lifetime = performance.now() - mountTime.current;
      recordMetric({
        name: 'component_lifetime',
        value: lifetime,
        unit: 'ms',
        severity: 'low',
        context: {
          componentName,
          lifetime,
        },
      });
    };
  }, [isInitialized, componentName, trackComponentLifecycle, recordMetric]);
  
  // Track render performance
  useEffect(() => {
    if (!isInitialized || !trackRender || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > 16) { // Longer than one frame at 60fps
      recordMetric({
        name: 'component_render_time',
        value: renderTime,
        unit: 'ms',
        severity: renderTime > 50 ? 'high' : renderTime > 32 ? 'medium' : 'low',
        context: {
          componentName,
          renderTime,
          threshold: 16,
        },
      });
    }
    
    renderStartTime.current = 0;
  });
  
  // Track component updates
  const trackUpdate = useCallback((updateContext?: Record<string, unknown>) => {
    if (!isInitialized) return;
    
    trackComponentLifecycle(componentName, 'update');
    
    if (trackRender) {
      renderStartTime.current = performance.now();
    }
    
    recordMetric({
      name: 'component_update',
      value: performance.now(),
      unit: 'timestamp',
      severity: 'low',
      context: {
        componentName,
        ...updateContext,
      },
    });
  }, [isInitialized, componentName, trackComponentLifecycle, recordMetric, trackRender]);
  
  return {
    trackUpdate,
    componentName,
    isTracking: isInitialized,
  };
};

/**
 * Hook for tracking user interactions with performance measurement
 */
export const useInteractionTracking = (screenName: string) => {
  const { recordTouchInteraction, recordMetric, isInitialized } = useModernAPM({ screenName });
  
  const trackInteraction = useCallback((
    actionName: string,
    interactionType: 'touch' | 'swipe' | 'long_press' | 'scroll' = 'touch',
    additionalContext?: Record<string, unknown>
  ) => {
    if (!isInitialized) return;
    
    const startTime = performance.now();
    
    // Return a function to call when interaction completes
    return {
      end: (outcome: 'success' | 'error' | 'cancelled' = 'success') => {
        const duration = performance.now() - startTime;
        
        // Record as touch interaction (FID)
        recordTouchInteraction(actionName, duration);
        
        // Record detailed interaction metric
        recordMetric({
          name: 'user_interaction',
          value: duration,
          unit: 'ms',
          severity: duration > 300 ? 'high' : duration > 100 ? 'medium' : 'low',
          context: {
            actionName,
            interactionType,
            outcome,
            screenName,
            ...additionalContext,
          },
        });
      },
    };
  }, [isInitialized, screenName, recordTouchInteraction, recordMetric]);
  
  return {
    trackInteraction,
    isTracking: isInitialized,
  };
};

/**
 * Hook for tracking navigation performance
 */
export const useNavigationPerformance = () => {
  const { startScreenRender, endScreenRender, recordMetric, isInitialized } = useModernAPM();
  
  const trackNavigation = useCallback((
    fromScreen: string,
    toScreen: string,
    navigationMethod: 'push' | 'replace' | 'goBack' | 'reset' = 'push'
  ) => {
    if (!isInitialized) return;
    
    const navigationStartTime = performance.now();
    
    // End previous screen render if needed
    if (fromScreen !== 'unknown') {
      endScreenRender(fromScreen, {
        navigatedTo: toScreen,
        navigationMethod,
      });
    }
    
    // Start new screen render
    startScreenRender(toScreen);
    
    // Record navigation metric
    recordMetric({
      name: 'navigation_start',
      value: navigationStartTime,
      unit: 'timestamp',
      severity: 'low',
      context: {
        fromScreen,
        toScreen,
        navigationMethod,
        timestamp: navigationStartTime,
      },
    });
    
    return {
      complete: (additionalContext?: Record<string, unknown>) => {
        const navigationDuration = performance.now() - navigationStartTime;
        
        recordMetric({
          name: 'navigation_complete',
          value: navigationDuration,
          unit: 'ms',
          severity: navigationDuration > 1000 ? 'high' : navigationDuration > 500 ? 'medium' : 'low',
          context: {
            fromScreen,
            toScreen,
            navigationMethod,
            duration: navigationDuration,
            ...additionalContext,
          },
        });
      },
    };
  }, [isInitialized, startScreenRender, endScreenRender, recordMetric]);
  
  return {
    trackNavigation,
    isTracking: isInitialized,
  };
};

export default useModernAPM;