/**
 * Modern Application Performance Monitoring (APM) Service
 * Implements Core Web Vitals, Real-time Alerting, Memory Leak Detection,
 * User Journey Correlation, and Predictive Analytics for React Native
 */

import { Platform, Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loggingService } from './LoggingService';
import {
  EnhancedPerformanceMetric,
  NativeMemoryMetrics,
  EnhancedNetworkMetrics,
  CoreVitalMetric,
  CoreVitalType,
  PerformanceAlertRule,
  PerformanceAlert,
  UserJourneyEvent,
  JourneyPerformanceInsight,
  MemoryLeak,
  ComponentLifecycleEvent,
  DeviceContext,
  SessionPerformanceData,
  PerformanceConfig,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_CORE_VITAL_THRESHOLDS,
  PerformancePrediction,
  OptimizationRecommendation,
} from '../types/performance';
import { CircularBuffer } from '../utils/CircularBuffer';

export class ModernAPMService {
  private static instance: ModernAPMService;
  
  // Core dependencies
  private logger: typeof loggingService;
  private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG;
  
  // Enhanced data storage with circular buffers
  private metricsBuffer: CircularBuffer<EnhancedPerformanceMetric>;
  private memoryMetrics: CircularBuffer<NativeMemoryMetrics>;
  private networkMetrics: CircularBuffer<EnhancedNetworkMetrics>;
  private coreVitals: Map<string, CoreVitalMetric[]> = new Map();
  
  // Session and user tracking
  private currentSessionId: string = '';
  private currentUserId?: string;
  private currentScreenName: string = 'unknown';
  private deviceContext: DeviceContext | null = null;
  
  // Alert system
  private alertRules: Map<string, PerformanceAlertRule> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private alertCooldowns: Map<string, number> = new Map();
  
  // Memory leak detection
  private componentLifecycles: Map<string, ComponentLifecycleEvent[]> = new Map();
  private memoryLeaks: MemoryLeak[] = [];
  private memoryBaseline: number = 0;
  private memoryGrowthThreshold: number = 50 * 1024 * 1024; // 50MB
  
  // User journey correlation
  private journeyEvents: UserJourneyEvent[] = [];
  private screenStartTimes: Map<string, number> = new Map();
  
  // Network interception
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;
  
  // Performance tracking
  private isMonitoring: boolean = false;
  private memoryInterval: ReturnType<typeof setTimeout> | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  
  // Connection state
  private connectionType: string = 'unknown';

  private constructor() {
    this.logger = loggingService;
    
    // Initialize circular buffers with optimal capacity for mobile
    this.metricsBuffer = new CircularBuffer<EnhancedPerformanceMetric>(1000);
    this.memoryMetrics = new CircularBuffer<NativeMemoryMetrics>(500);
    this.networkMetrics = new CircularBuffer<EnhancedNetworkMetrics>(500);
    
    // Generate unique session ID
    this.currentSessionId = this.generateSessionId();
    
    // Store original network functions for interception
    this.originalFetch = global.fetch;
    this.originalXMLHttpRequest = global.XMLHttpRequest;
    
    // Set up default alert rules
    this.setupDefaultAlertRules();
  }

  static getInstance(): ModernAPMService {
    if (!ModernAPMService.instance) {
      ModernAPMService.instance = new ModernAPMService();
    }
    return ModernAPMService.instance;
  }

  // ===== INITIALIZATION & LIFECYCLE =====
  
  /**
   * Initialize modern APM with comprehensive monitoring
   */
  async initialize(config?: Partial<PerformanceConfig>): Promise<void> {
    try {
      // Merge custom config with defaults
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Initialize device context
      await this.initializeDeviceContext();
      
      // Set up monitoring systems
      this.setupPerformanceObservers();
      this.startMemoryMonitoring();
      
      // Initialize features based on config
      if (this.config.features.networkInterception) {
        this.setupNetworkInterception();
      }
      
      if (this.config.features.memoryLeakDetection) {
        this.startMemoryLeakDetection();
      }
      
      // Start session tracking
      this.startSession();
      
      this.isMonitoring = true;
      
      this.logger.info('Modern APM initialized', {
        sessionId: this.currentSessionId,
        features: this.config.features,
        deviceContext: this.deviceContext,
      });
      
      // Record initialization metric
      this.recordEnhancedMetric({
        name: 'apm_initialization',
        value: performance.now(),
        unit: 'ms',
        severity: 'low',
        context: {
          version: '2.0.0',
          features: this.config.features,
        },
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize Modern APM', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.currentSessionId,
      });
      throw error;
    }
  }
  
  /**
   * Stop monitoring and clean up resources
   */
  async stop(): Promise<void> {
    try {
      this.isMonitoring = false;
      
      // End current session
      await this.endSession();
      
      // Clean up intervals and observers
      if (this.memoryInterval) {
        clearInterval(this.memoryInterval);
        this.memoryInterval = null;
      }
      
      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = null;
      }
      
      // Restore original network functions
      if (this.config.features.networkInterception) {
        this.restoreNetworkFunctions();
      }
      
      // Save final session data
      await this.saveSessionData();
      
      this.logger.info('Modern APM stopped', {
        sessionId: this.currentSessionId,
        metricsCollected: this.metricsBuffer.size,
        alertsTriggered: this.activeAlerts.size,
      });
      
    } catch (error) {
      this.logger.error('Error stopping Modern APM', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

  // ===== CORE WEB VITALS IMPLEMENTATION =====
  
  /**
   * Record Core Web Vital metric with React Native equivalents
   */
  recordCoreVital(
    type: CoreVitalType,
    value: number,
    screenName?: string,
    context?: Record<string, any>
  ): void {
    if (!this.isMonitoring) return;
    
    const screen = screenName || this.currentScreenName;
    const threshold = DEFAULT_CORE_VITAL_THRESHOLDS[type];
    const isGoodScore = value <= threshold.good;
    
    const metric: CoreVitalMetric = {
      type,
      value,
      timestamp: Date.now(),
      screenName: screen,
      deviceInfo: this.deviceContext!,
      isGoodScore,
      threshold,
    };
    
    // Store in core vitals collection
    if (!this.coreVitals.has(screen)) {
      this.coreVitals.set(screen, []);
    }
    this.coreVitals.get(screen)!.push(metric);
    
    // Also record as enhanced metric
    this.recordEnhancedMetric({
      name: `core_vital_${type.toLowerCase()}`,
      value,
      unit: type === 'CLS' ? 'score' : 'ms',
      severity: isGoodScore ? 'low' : value <= threshold.needsImprovement ? 'medium' : 'high',
      context: {
        screenName: screen,
        isGoodScore,
        threshold,
        ...context,
      },
    });
    
    this.logger.debug('Core Web Vital recorded', {
      type,
      value,
      screenName: screen,
      isGoodScore,
      sessionId: this.currentSessionId,
    });
  }
  
  /**
   * Start tracking screen render performance (FCP equivalent)
   */
  startScreenRender(screenName: string): void {
    const startTime = performance.now();
    this.screenStartTimes.set(screenName, startTime);
    this.currentScreenName = screenName;
    
    // Record journey event
    this.recordJourneyEvent({
      eventType: 'screen_view',
      screenName,
      action: 'start_render',
      context: { renderStartTime: startTime },
    });
    
    this.logger.debug('Screen render started', {
      screenName,
      startTime,
      sessionId: this.currentSessionId,
    });
  }
  
  /**
   * End screen render tracking and record FCP
   */
  endScreenRender(screenName: string, context?: Record<string, any>): void {
    const startTime = this.screenStartTimes.get(screenName);
    if (!startTime) {
      this.logger.warn('Screen render end called without start', { screenName });
      return;
    }
    
    const renderTime = performance.now() - startTime;
    
    // Record as Core Web Vital (FCP)
    this.recordCoreVital('FCP', renderTime, screenName, context);
    
    // Clean up tracking
    this.screenStartTimes.delete(screenName);
    
    // Record journey event
    this.recordJourneyEvent({
      eventType: 'screen_view',
      screenName,
      action: 'render_complete',
      context: { renderTime, ...context },
    });
    
    this.logger.debug('Screen render completed', {
      screenName,
      renderTime,
      sessionId: this.currentSessionId,
    });
  }
  
  /**
   * Record interaction ready time (TTI equivalent)
   */
  recordInteractionReady(screenName: string, readyTime: number): void {
    this.recordCoreVital('TTI', readyTime, screenName, {
      interactionType: 'ready',
    });
  }
  
  /**
   * Record touch interaction delay (FID equivalent)
   */
  recordTouchInteraction(screenName: string, actionName: string, delay: number): void {
    this.recordCoreVital('FID', delay, screenName, {
      action: actionName,
      interactionType: 'touch',
    });
  }
  
  /**
   * Record layout stability score (CLS equivalent)
   */
  recordLayoutShift(screenName: string, shiftScore: number, context?: Record<string, any>): void {
    this.recordCoreVital('CLS', shiftScore, screenName, {
      layoutEvent: true,
      ...context,
    });
  }
  
  /**
   * Record largest element render time (LCP equivalent)
   */
  recordLargestElement(screenName: string, renderTime: number, elementType: string): void {
    this.recordCoreVital('LCP', renderTime, screenName, {
      elementType,
      largestElement: true,
    });
  }

  // ===== ENHANCED METRICS SYSTEM =====
  
  /**
   * Record enhanced performance metric with full context
   */
  recordEnhancedMetric(
    metric: Omit<EnhancedPerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'screenName'>
  ): void {
    if (!this.isMonitoring) return;
    
    const enhancedMetric: EnhancedPerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      screenName: this.currentScreenName,
      ...metric,
    };
    
    // Add to circular buffer for real-time access
    this.metricsBuffer.add(enhancedMetric);
    
    // Evaluate alerts
    this.evaluateAlerts(enhancedMetric);
    
    // Log if severity is medium or higher
    if (metric.severity !== 'low') {
      this.logger.info('Performance metric recorded', {
        name: metric.name,
        value: metric.value,
        severity: metric.severity,
        sessionId: this.currentSessionId,
      });
    }
  }
  
  /**
   * Get core vitals report for a screen or overall
   */
  getCoreVitalsReport(screenName?: string): {
    screenName: string;
    metrics: CoreVitalMetric[];
    score: number;
    summary: Record<CoreVitalType, { avg: number; p95: number; good: number; total: number }>;
  }[] {
    const screens = screenName ? [screenName] : Array.from(this.coreVitals.keys());
    
    return screens.map(screen => {
      const metrics = this.coreVitals.get(screen) || [];
      const score = this.calculateCoreVitalScore(metrics);
      
      const summary = {} as Record<CoreVitalType, { avg: number; p95: number; good: number; total: number }>;
      
      (['FCP', 'LCP', 'FID', 'CLS', 'TTI'] as CoreVitalType[]).forEach(type => {
        const typeMetrics = metrics.filter(m => m.type === type);
        if (typeMetrics.length > 0) {
          const values = typeMetrics.map(m => m.value).sort((a, b) => a - b);
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const p95Index = Math.floor(values.length * 0.95);
          const p95 = values[p95Index] || values[values.length - 1];
          const good = typeMetrics.filter(m => m.isGoodScore).length;
          
          summary[type] = { avg, p95, good, total: typeMetrics.length };
        }
      });
      
      return { screenName: screen, metrics, score, summary };
    });
  }

  // ===== NATIVE MEMORY MONITORING =====
  
  /**
   * Track native memory usage with comprehensive metrics
   */
  async trackNativeMemory(): Promise<NativeMemoryMetrics> {\n    try {\n      const [totalMemory, freeMemory, usedMemory] = await Promise.all([\n        DeviceInfo.getTotalMemory(),\n        DeviceInfo.getFreeDiskStorage(), // This is disk storage, not memory\n        DeviceInfo.getUsedMemory?.() || Promise.resolve(0),\n      ]);\n      \n      // Get JS heap size from performance API\n      const jsHeapSize = (performance as any).memory?.usedJSHeapSize || 0;\n      \n      // Calculate memory pressure\n      const availableMemory = totalMemory - usedMemory;\n      const memoryPressure = this.calculateMemoryPressure(usedMemory, totalMemory);\n      \n      const memoryMetrics: NativeMemoryMetrics = {\n        totalMemory,\n        freeMemory: availableMemory, // Corrected to use available memory\n        usedMemory,\n        availableMemory,\n        memoryPressure,\n        jsHeapSize,\n        nativeHeapSize: Math.max(0, usedMemory - jsHeapSize),\n        imageMemory: 0, // TODO: Implement image memory tracking\n        timestamp: Date.now(),\n        platform: Platform.OS as 'ios' | 'android',\n      };\n      \n      // Add to circular buffer\n      this.memoryMetrics.add(memoryMetrics);\n      \n      // Record as enhanced metric\n      this.recordEnhancedMetric({\n        name: 'memory_usage',\n        value: usedMemory,\n        unit: 'bytes',\n        severity: memoryPressure === 'critical' ? 'critical' : \n                 memoryPressure === 'high' ? 'high' : 'low',\n        context: {\n          memoryPressure,\n          totalMemory,\n          availableMemory,\n          jsHeapSize,\n          platform: Platform.OS,\n        },\n      });\n      \n      // Update device context\n      if (this.deviceContext) {\n        this.deviceContext.availableMemory = availableMemory;\n      }\n      \n      // Detect memory leaks\n      if (this.config.features.memoryLeakDetection) {\n        this.detectMemoryLeaks(memoryMetrics);\n      }\n      \n      return memoryMetrics;\n      \n    } catch (error) {\n      this.logger.error('Failed to track native memory', {\n        error: error instanceof Error ? error.message : 'Unknown error',\n      });\n      \n      // Return fallback metrics\n      return {\n        totalMemory: 0,\n        freeMemory: 0,\n        usedMemory: 0,\n        availableMemory: 0,\n        memoryPressure: 'low',\n        jsHeapSize: 0,\n        nativeHeapSize: 0,\n        imageMemory: 0,\n        timestamp: Date.now(),\n        platform: Platform.OS as 'ios' | 'android',\n      };\n    }\n  }\n  \n  /**\n   * Start automatic memory monitoring\n   */\n  private startMemoryMonitoring(): void {\n    if (this.memoryInterval) {\n      clearInterval(this.memoryInterval);\n    }\n    \n    // Monitor memory every 10 seconds\n    this.memoryInterval = setInterval(async () => {\n      if (this.isMonitoring) {\n        await this.trackNativeMemory();\n      }\n    }, 10000);\n    \n    // Get baseline memory usage\n    setTimeout(async () => {\n      const baseline = await this.trackNativeMemory();\n      this.memoryBaseline = baseline.usedMemory;\n    }, 1000);\n  }\n  \n  /**\n   * Calculate memory pressure level\n   */\n  private calculateMemoryPressure(\n    usedMemory: number,\n    totalMemory: number\n  ): 'low' | 'medium' | 'high' | 'critical' {\n    const usagePercentage = (usedMemory / totalMemory) * 100;\n    \n    if (usagePercentage > 90) return 'critical';\n    if (usagePercentage > 75) return 'high';\n    if (usagePercentage > 60) return 'medium';\n    return 'low';\n  }\n\n  // ===== NETWORK INTERCEPTION & MONITORING =====\n  \n  /**\n   * Set up network request interception\n   */\n  private setupNetworkInterception(): void {\n    if (!this.config.features.networkInterception) return;\n    \n    // Intercept fetch\n    global.fetch = async (url: string | Request, options?: RequestInit) => {\n      const startTime = performance.now();\n      const requestUrl = typeof url === 'string' ? url : url.url;\n      const method = options?.method || 'GET';\n      const requestSize = this.calculateRequestSize(options);\n      \n      try {\n        const response = await this.originalFetch(url, options);\n        const duration = performance.now() - startTime;\n        const responseSize = this.calculateResponseSize(response);\n        \n        // Record network metric\n        this.recordNetworkMetric({\n          url: requestUrl,\n          method,\n          duration,\n          requestSize,\n          responseSize,\n          statusCode: response.status,\n          headers: this.extractHeaders(response),\n          retryCount: 0,\n          cacheHit: this.isCacheHit(response),\n        });\n        \n        return response;\n      } catch (error) {\n        const duration = performance.now() - startTime;\n        \n        this.recordNetworkMetric({\n          url: requestUrl,\n          method,\n          duration,\n          requestSize,\n          responseSize: 0,\n          statusCode: 0,\n          headers: {},\n          errorType: error instanceof Error ? error.name : 'Unknown',\n          retryCount: 0,\n          cacheHit: false,\n        });\n        \n        throw error;\n      }\n    };\n    \n    this.logger.debug('Network interception enabled');\n  }\n  \n  /**\n   * Record network performance metric\n   */\n  recordNetworkMetric(\n    metric: Omit<EnhancedNetworkMetrics, 'id' | 'timestamp' | 'sessionId' | 'connectionType'>\n  ): void {\n    const networkMetric: EnhancedNetworkMetrics = {\n      id: this.generateMetricId(),\n      timestamp: Date.now(),\n      sessionId: this.currentSessionId,\n      connectionType: this.connectionType,\n      ...metric,\n    };\n    \n    // Add to circular buffer\n    this.networkMetrics.add(networkMetric);\n    \n    // Record as enhanced metric\n    this.recordEnhancedMetric({\n      name: 'network_request',\n      value: metric.duration,\n      unit: 'ms',\n      severity: metric.duration > this.config.thresholds.network.verySlowRequest ? 'high' :\n               metric.duration > this.config.thresholds.network.slowRequest ? 'medium' : 'low',\n      context: {\n        url: metric.url,\n        method: metric.method,\n        statusCode: metric.statusCode,\n        requestSize: metric.requestSize,\n        responseSize: metric.responseSize,\n        connectionType: this.connectionType,\n        cacheHit: metric.cacheHit,\n        errorType: metric.errorType,\n      },\n    });\n  }\n\n  // ===== MEMORY LEAK DETECTION =====\n  \n  /**\n   * Start memory leak detection\n   */\n  private startMemoryLeakDetection(): void {\n    // This will be called during memory monitoring\n    this.logger.debug('Memory leak detection enabled');\n  }\n  \n  /**\n   * Detect potential memory leaks\n   */\n  private detectMemoryLeaks(currentMemory: NativeMemoryMetrics): void {\n    if (this.memoryBaseline === 0) {\n      this.memoryBaseline = currentMemory.usedMemory;\n      return;\n    }\n    \n    const memoryGrowth = currentMemory.usedMemory - this.memoryBaseline;\n    \n    // Check for significant memory growth\n    if (memoryGrowth > this.memoryGrowthThreshold) {\n      const leak: MemoryLeak = {\n        type: 'memory',\n        description: `Detected ${Math.round(memoryGrowth / 1024 / 1024)}MB memory growth since baseline`,\n        severity: memoryGrowth > this.memoryGrowthThreshold * 2 ? 'critical' : 'high',\n        memoryGrowth,\n        timestamp: Date.now(),\n        recommendations: [\n          'Check for retained references in components',\n          'Verify event listeners are properly removed',\n          'Review image caching and cleanup',\n          'Check for memory-intensive operations',\n        ],\n      };\n      \n      this.memoryLeaks.push(leak);\n      \n      // Record as metric\n      this.recordEnhancedMetric({\n        name: 'memory_leak_detected',\n        value: memoryGrowth,\n        unit: 'bytes',\n        severity: leak.severity,\n        context: {\n          type: leak.type,\n          description: leak.description,\n          baseline: this.memoryBaseline,\n          current: currentMemory.usedMemory,\n        },\n      });\n      \n      this.logger.warn('Potential memory leak detected', {\n        memoryGrowth,\n        baseline: this.memoryBaseline,\n        current: currentMemory.usedMemory,\n        severity: leak.severity,\n      });\n    }\n  }\n  \n  /**\n   * Track component lifecycle for leak detection\n   */\n  trackComponentLifecycle(\n    componentName: string,\n    event: 'mount' | 'unmount' | 'update',\n    props?: Record<string, any>\n  ): void {\n    if (!this.isMonitoring) return;\n    \n    const lifecycleEvent: ComponentLifecycleEvent = {\n      componentName,\n      event,\n      timestamp: Date.now(),\n      props,\n      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,\n    };\n    \n    if (!this.componentLifecycles.has(componentName)) {\n      this.componentLifecycles.set(componentName, []);\n    }\n    \n    this.componentLifecycles.get(componentName)!.push(lifecycleEvent);\n    \n    // Keep only recent events per component\n    const events = this.componentLifecycles.get(componentName)!;\n    if (events.length > 20) {\n      this.componentLifecycles.set(componentName, events.slice(-10));\n    }\n    \n    // Check for potential component memory leaks\n    if (event === 'unmount') {\n      this.checkComponentMemoryLeak(componentName);\n    }\n  }\n  \n  /**\n   * Check for component-specific memory leaks\n   */\n  private checkComponentMemoryLeak(componentName: string): void {\n    const events = this.componentLifecycles.get(componentName) || [];\n    const mountEvents = events.filter(e => e.event === 'mount');\n    const unmountEvents = events.filter(e => e.event === 'unmount');\n    \n    // Check if there are more mounts than unmounts (potential leak)\n    if (mountEvents.length > unmountEvents.length + 1) {\n      const leak: MemoryLeak = {\n        type: 'component',\n        componentName,\n        description: `Component ${componentName} may have memory leaks (${mountEvents.length} mounts, ${unmountEvents.length} unmounts)`,\n        severity: 'medium',\n        memoryGrowth: 0,\n        timestamp: Date.now(),\n        recommendations: [\n          'Check if component is properly unmounting',\n          'Verify event listeners are cleaned up in useEffect cleanup',\n          'Check for retained references to component instance',\n          'Review subscriptions and timers cleanup',\n        ],\n      };\n      \n      this.memoryLeaks.push(leak);\n      \n      this.logger.warn('Component memory leak detected', {\n        componentName,\n        mountEvents: mountEvents.length,\n        unmountEvents: unmountEvents.length,\n      });\n    }\n  }\n\n  // ===== REAL-TIME ALERTING SYSTEM =====\n  \n  /**\n   * Define custom alert rules\n   */\n  definePerformanceAlert(rule: PerformanceAlertRule): void {\n    this.alertRules.set(rule.id, rule);\n    this.logger.debug('Performance alert rule defined', {\n      ruleId: rule.id,\n      name: rule.name,\n      threshold: rule.threshold,\n    });\n  }\n  \n  /**\n   * Evaluate alerts for a metric\n   */\n  private evaluateAlerts(metric: EnhancedPerformanceMetric): void {\n    for (const [ruleId, rule] of this.alertRules) {\n      if (!rule.enabled) continue;\n      \n      // Check if this metric matches the rule\n      if (rule.metricType !== metric.name) continue;\n      \n      // Check cooldown\n      const lastAlertTime = this.alertCooldowns.get(ruleId) || 0;\n      const cooldownPeriod = rule.cooldownMinutes * 60 * 1000;\n      if (Date.now() - lastAlertTime < cooldownPeriod) continue;\n      \n      // Evaluate threshold\n      const thresholdMet = this.evaluateThreshold(metric.value, rule.threshold, rule.comparison);\n      \n      if (thresholdMet) {\n        this.triggerAlert(rule, metric);\n      }\n    }\n  }\n  \n  /**\n   * Evaluate threshold condition\n   */\n  private evaluateThreshold(\n    value: number,\n    threshold: number,\n    comparison: 'greater' | 'less' | 'equal'\n  ): boolean {\n    switch (comparison) {\n      case 'greater':\n        return value > threshold;\n      case 'less':\n        return value < threshold;\n      case 'equal':\n        return Math.abs(value - threshold) < 0.001;\n      default:\n        return false;\n    }\n  }\n  \n  /**\n   * Trigger performance alert\n   */\n  private triggerAlert(rule: PerformanceAlertRule, metric: EnhancedPerformanceMetric): void {\n    const alert: PerformanceAlert = {\n      id: this.generateMetricId(),\n      ruleId: rule.id,\n      metricType: rule.metricType,\n      value: metric.value,\n      threshold: rule.threshold,\n      severity: rule.severity,\n      timestamp: Date.now(),\n      sessionId: this.currentSessionId,\n      acknowledged: false,\n      context: {\n        screenName: metric.screenName,\n        metricContext: metric.context,\n        deviceInfo: this.deviceContext,\n      },\n    };\n    \n    this.activeAlerts.set(alert.id, alert);\n    this.alertCooldowns.set(rule.id, Date.now());\n    \n    // Log alert\n    this.logger.warn('Performance alert triggered', {\n      alertId: alert.id,\n      ruleName: rule.name,\n      metricType: rule.metricType,\n      value: metric.value,\n      threshold: rule.threshold,\n      severity: rule.severity,\n      sessionId: this.currentSessionId,\n    });\n    \n    // Record alert as metric\n    this.recordEnhancedMetric({\n      name: 'performance_alert',\n      value: metric.value,\n      unit: metric.unit,\n      severity: rule.severity,\n      context: {\n        alertId: alert.id,\n        ruleName: rule.name,\n        ruleId: rule.id,\n        originalMetric: metric.name,\n      },\n    });\n  }\n  \n  /**\n   * Acknowledge an alert\n   */\n  acknowledgeAlert(alertId: string): void {\n    const alert = this.activeAlerts.get(alertId);\n    if (alert) {\n      alert.acknowledged = true;\n      this.logger.info('Performance alert acknowledged', {\n        alertId,\n        ruleId: alert.ruleId,\n      });\n    }\n  }\n  \n  /**\n   * Resolve an alert\n   */\n  resolveAlert(alertId: string): void {\n    const alert = this.activeAlerts.get(alertId);\n    if (alert) {\n      alert.resolvedAt = Date.now();\n      this.activeAlerts.delete(alertId);\n      \n      this.logger.info('Performance alert resolved', {\n        alertId,\n        ruleId: alert.ruleId,\n        duration: alert.resolvedAt - alert.timestamp,\n      });\n    }\n  }\n\n  // ===== USER JOURNEY CORRELATION =====\n  \n  /**\n   * Record user journey event\n   */\n  private recordJourneyEvent(\n    event: Omit<UserJourneyEvent, 'eventId' | 'sessionId' | 'timestamp'>\n  ): void {\n    const journeyEvent: UserJourneyEvent = {\n      eventId: this.generateMetricId(),\n      sessionId: this.currentSessionId,\n      userId: this.currentUserId,\n      timestamp: Date.now(),\n      ...event,\n    };\n    \n    this.journeyEvents.push(journeyEvent);\n    \n    // Keep only recent events (last 100 events)\n    if (this.journeyEvents.length > 100) {\n      this.journeyEvents = this.journeyEvents.slice(-50);\n    }\n  }\n  \n  /**\n   * Set current user for journey correlation\n   */\n  setCurrentUser(userId: string): void {\n    this.currentUserId = userId;\n    \n    this.recordEnhancedMetric({\n      name: 'user_session_start',\n      value: Date.now(),\n      unit: 'timestamp',\n      severity: 'low',\n      context: {\n        userId,\n        previousUserId: this.currentUserId,\n      },\n    });\n  }\n  \n  /**\n   * Get journey performance insights for current session\n   */\n  getJourneyInsights(): JourneyPerformanceInsight {\n    const sessionEvents = this.journeyEvents.filter(e => e.sessionId === this.currentSessionId);\n    const screenViews = sessionEvents.filter(e => e.eventType === 'screen_view');\n    \n    // Calculate screen transition performance\n    const screenTransitions = screenViews.length - 1;\n    const coreVitalsData = Array.from(this.coreVitals.values()).flat();\n    \n    const screenLoadTimes = coreVitalsData\n      .filter(cv => cv.type === 'FCP')\n      .map(cv => cv.value);\n    \n    const averageScreenLoadTime = screenLoadTimes.length > 0\n      ? screenLoadTimes.reduce((sum, time) => sum + time, 0) / screenLoadTimes.length\n      : 0;\n    \n    const slowestScreenData = coreVitalsData\n      .filter(cv => cv.type === 'FCP')\n      .sort((a, b) => b.value - a.value)[0];\n    \n    const slowestScreen = slowestScreenData?.screenName || 'none';\n    \n    // Calculate performance score\n    const performanceScore = this.calculatePerformanceScore();\n    const coreVitalsScore = this.calculateCoreVitalScore(coreVitalsData);\n    \n    // Identify bottlenecks\n    const bottlenecks = this.identifyBottlenecks();\n    \n    return {\n      sessionId: this.currentSessionId,\n      totalDuration: Date.now() - parseInt(this.currentSessionId.split('_')[1]),\n      screenTransitions,\n      averageScreenLoadTime,\n      slowestScreen,\n      performanceScore,\n      coreVitalsScore,\n      bottlenecks,\n      recommendations: this.generateRecommendations(bottlenecks),\n    };\n  }\n\n  // ===== HELPER METHODS =====\n  \n  private generateSessionId(): string {\n    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;\n  }\n  \n  private generateMetricId(): string {\n    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;\n  }\n  \n  private async initializeDeviceContext(): Promise<void> {\n    try {\n      const [deviceModel, osVersion, appVersion, connectionState] = await Promise.all([\n        DeviceInfo.getModel(),\n        DeviceInfo.getSystemVersion(),\n        DeviceInfo.getVersion(),\n        NetInfo.fetch(),\n      ]);\n      \n      const screenSize = Dimensions.get('screen');\n      \n      this.deviceContext = {\n        platform: Platform.OS as 'ios' | 'android',\n        osVersion,\n        deviceModel,\n        appVersion,\n        connectionType: connectionState.type || 'unknown',\n        availableMemory: 0, // Will be updated by memory monitoring\n        screenResolution: {\n          width: screenSize.width,\n          height: screenSize.height,\n        },\n      };\n      \n      this.connectionType = connectionState.type || 'unknown';\n      \n      // Update connection type when it changes\n      NetInfo.addEventListener((state: NetInfoState) => {\n        this.connectionType = state.type || 'unknown';\n        if (this.deviceContext) {\n          this.deviceContext.connectionType = this.connectionType;\n        }\n      });\n      \n    } catch (error) {\n      this.logger.error('Failed to initialize device context', {\n        error: error instanceof Error ? error.message : 'Unknown error',\n      });\n    }\n  }\n  \n  private setupDefaultAlertRules(): void {\n    // Screen render time alert (FCP)\n    this.alertRules.set('slow_screen_render', {\n      id: 'slow_screen_render',\n      name: 'Slow Screen Render',\n      metricType: 'core_vital_fcp',\n      threshold: 3000, // 3 seconds\n      comparison: 'greater',\n      severity: 'high',\n      cooldownMinutes: 5,\n      enabled: true,\n    });\n    \n    // Memory pressure alert\n    this.alertRules.set('high_memory_usage', {\n      id: 'high_memory_usage',\n      name: 'High Memory Usage',\n      metricType: 'memory_usage',\n      threshold: this.config.thresholds.memory.warning,\n      comparison: 'greater',\n      severity: 'medium',\n      cooldownMinutes: 10,\n      enabled: true,\n    });\n    \n    // Network request timeout alert\n    this.alertRules.set('slow_network_request', {\n      id: 'slow_network_request',\n      name: 'Slow Network Request',\n      metricType: 'network_request',\n      threshold: this.config.thresholds.network.slowRequest,\n      comparison: 'greater',\n      severity: 'medium',\n      cooldownMinutes: 2,\n      enabled: true,\n    });\n    \n    // Touch interaction delay alert (FID)\n    this.alertRules.set('slow_touch_response', {\n      id: 'slow_touch_response',\n      name: 'Slow Touch Response',\n      metricType: 'core_vital_fid',\n      threshold: 300, // 300ms\n      comparison: 'greater',\n      severity: 'medium',\n      cooldownMinutes: 3,\n      enabled: true,\n    });\n  }\n  \n  private setupPerformanceObservers(): void {\n    // Set up performance observers if available\n    if (typeof PerformanceObserver !== 'undefined') {\n      try {\n        this.performanceObserver = new PerformanceObserver((list) => {\n          const entries = list.getEntries();\n          entries.forEach((entry) => {\n            if (entry.entryType === 'measure' || entry.entryType === 'mark') {\n              this.recordEnhancedMetric({\n                name: `performance_${entry.entryType}`,\n                value: entry.duration || entry.startTime,\n                unit: 'ms',\n                severity: 'low',\n                context: {\n                  entryName: entry.name,\n                  entryType: entry.entryType,\n                },\n              });\n            }\n          });\n        });\n        \n        this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });\n      } catch (error) {\n        this.logger.warn('PerformanceObserver not supported', {\n          error: error instanceof Error ? error.message : 'Unknown error',\n        });\n      }\n    }\n  }\n  \n  private startSession(): void {\n    this.recordEnhancedMetric({\n      name: 'session_start',\n      value: Date.now(),\n      unit: 'timestamp',\n      severity: 'low',\n      context: {\n        sessionId: this.currentSessionId,\n        deviceContext: this.deviceContext,\n      },\n    });\n  }\n  \n  private async endSession(): Promise<void> {\n    const sessionDuration = Date.now() - parseInt(this.currentSessionId.split('_')[1]);\n    \n    this.recordEnhancedMetric({\n      name: 'session_end',\n      value: sessionDuration,\n      unit: 'ms',\n      severity: 'low',\n      context: {\n        sessionId: this.currentSessionId,\n        duration: sessionDuration,\n        metricsCollected: this.metricsBuffer.size,\n        alertsTriggered: this.activeAlerts.size,\n        screensVisited: this.coreVitals.size,\n      },\n    });\n  }\n  \n  private async saveSessionData(): Promise<void> {\n    try {\n      const sessionData: SessionPerformanceData = {\n        sessionId: this.currentSessionId,\n        userId: this.currentUserId,\n        startTime: parseInt(this.currentSessionId.split('_')[1]),\n        endTime: Date.now(),\n        screenViews: Array.from(this.coreVitals.keys()),\n        coreVitals: Array.from(this.coreVitals.values()).flat(),\n        performanceMetrics: this.metricsBuffer.getAll(),\n        networkMetrics: this.networkMetrics.getAll(),\n        memoryMetrics: this.memoryMetrics.getAll(),\n        alerts: Array.from(this.activeAlerts.values()),\n        performanceScore: this.calculatePerformanceScore(),\n        deviceContext: this.deviceContext!,\n      };\n      \n      // Save to AsyncStorage with compression for mobile\n      const storageKey = `apm_session_${this.currentSessionId}`;\n      const compressedData = JSON.stringify(sessionData);\n      \n      await AsyncStorage.setItem(storageKey, compressedData);\n      \n      // Clean up old sessions based on retention policy\n      await this.cleanupOldSessions();\n      \n      this.logger.debug('Session data saved', {\n        sessionId: this.currentSessionId,\n        dataSize: compressedData.length,\n        metricsCount: sessionData.performanceMetrics.length,\n      });\n      \n    } catch (error) {\n      this.logger.error('Failed to save session data', {\n        error: error instanceof Error ? error.message : 'Unknown error',\n        sessionId: this.currentSessionId,\n      });\n    }\n  }\n  \n  private calculatePerformanceScore(): number {\n    // Calculate weighted performance score from 0-100\n    const allCoreVitals = Array.from(this.coreVitals.values()).flat();\n    if (allCoreVitals.length === 0) return 100;\n    \n    const goodScores = allCoreVitals.filter(cv => cv.isGoodScore).length;\n    const coreVitalScore = (goodScores / allCoreVitals.length) * 100;\n    \n    // Factor in memory pressure (20% weight)\n    const latestMemory = this.memoryMetrics.getLatest();\n    const memoryScore = latestMemory ? \n      (latestMemory.memoryPressure === 'low' ? 100 :\n       latestMemory.memoryPressure === 'medium' ? 75 :\n       latestMemory.memoryPressure === 'high' ? 50 : 25) : 100;\n    \n    // Factor in network performance (20% weight)\n    const recentNetworkMetrics = this.networkMetrics.getLast(10);\n    const avgNetworkTime = recentNetworkMetrics.length > 0 ?\n      recentNetworkMetrics.reduce((sum, m) => sum + m.duration, 0) / recentNetworkMetrics.length : 0;\n    \n    const networkScore = avgNetworkTime === 0 ? 100 :\n      avgNetworkTime < 500 ? 100 :\n      avgNetworkTime < 1000 ? 80 :\n      avgNetworkTime < 2000 ? 60 : 40;\n    \n    // Calculate weighted score\n    const finalScore = Math.round(\n      coreVitalScore * 0.6 +\n      memoryScore * 0.2 +\n      networkScore * 0.2\n    );\n    \n    return Math.max(0, Math.min(100, finalScore));\n  }\n  \n  private calculateCoreVitalScore(vitals: CoreVitalMetric[]): number {\n    if (vitals.length === 0) return 100;\n    \n    const goodScores = vitals.filter(cv => cv.isGoodScore).length;\n    return Math.round((goodScores / vitals.length) * 100);\n  }\n  \n  private identifyBottlenecks(): any[] {\n    const bottlenecks: any[] = [];\n    \n    // Identify slow screens\n    const fcpMetrics = Array.from(this.coreVitals.values()).flat()\n      .filter(cv => cv.type === 'FCP');\n    \n    const slowScreens = fcpMetrics.filter(cv => !cv.isGoodScore);\n    slowScreens.forEach(cv => {\n      bottlenecks.push({\n        type: 'render',\n        screenName: cv.screenName,\n        description: `Slow screen render: ${cv.value}ms`,\n        impact: cv.value > 5000 ? 'critical' : 'high',\n        recommendation: 'Optimize component rendering and reduce bundle size',\n        metrics: [cv],\n      });\n    });\n    \n    // Identify network bottlenecks\n    const slowNetworkRequests = this.networkMetrics.getAll()\n      .filter(nm => nm.duration > this.config.thresholds.network.slowRequest);\n    \n    if (slowNetworkRequests.length > 0) {\n      bottlenecks.push({\n        type: 'network',\n        screenName: this.currentScreenName,\n        description: `${slowNetworkRequests.length} slow network requests detected`,\n        impact: 'medium',\n        recommendation: 'Optimize API calls, implement caching, and use compression',\n        metrics: slowNetworkRequests,\n      });\n    }\n    \n    // Identify memory bottlenecks\n    if (this.memoryLeaks.length > 0) {\n      bottlenecks.push({\n        type: 'memory',\n        screenName: this.currentScreenName,\n        description: `${this.memoryLeaks.length} potential memory leaks detected`,\n        impact: 'high',\n        recommendation: 'Review component lifecycles and cleanup procedures',\n        metrics: this.memoryLeaks,\n      });\n    }\n    \n    return bottlenecks;\n  }\n  \n  private generateRecommendations(bottlenecks: any[]): string[] {\n    const recommendations: string[] = [];\n    \n    bottlenecks.forEach(bottleneck => {\n      switch (bottleneck.type) {\n        case 'render':\n          recommendations.push('Implement React.memo for expensive components');\n          recommendations.push('Use lazy loading for heavy screens');\n          recommendations.push('Optimize image loading and caching');\n          break;\n        case 'network':\n          recommendations.push('Implement request caching and deduplication');\n          recommendations.push('Use compression for API responses');\n          recommendations.push('Optimize API endpoint performance');\n          break;\n        case 'memory':\n          recommendations.push('Review component cleanup in useEffect');\n          recommendations.push('Implement proper event listener removal');\n          recommendations.push('Use weak references where appropriate');\n          break;\n      }\n    });\n    \n    return [...new Set(recommendations)]; // Remove duplicates\n  }\n  \n  private async cleanupOldSessions(): Promise<void> {\n    try {\n      const allKeys = await AsyncStorage.getAllKeys();\n      const sessionKeys = allKeys.filter(key => key.startsWith('apm_session_'));\n      \n      // Sort by timestamp (newest first)\n      const sortedKeys = sessionKeys.sort((a, b) => {\n        const timestampA = parseInt(a.split('_')[2]);\n        const timestampB = parseInt(b.split('_')[2]);\n        return timestampB - timestampA;\n      });\n      \n      // Keep only sessions within retention period\n      const retentionPeriod = this.config.retention.aggregatedDays * 24 * 60 * 60 * 1000;\n      const cutoffTime = Date.now() - retentionPeriod;\n      \n      const keysToDelete = sortedKeys.filter(key => {\n        const timestamp = parseInt(key.split('_')[2]);\n        return timestamp < cutoffTime;\n      });\n      \n      if (keysToDelete.length > 0) {\n        await AsyncStorage.multiRemove(keysToDelete);\n        this.logger.info('Cleaned up old APM session data', {\n          deletedSessions: keysToDelete.length,\n          retentionDays: this.config.retention.aggregatedDays,\n        });\n      }\n      \n    } catch (error) {\n      this.logger.error('Failed to cleanup old APM sessions', {\n        error: error instanceof Error ? error.message : 'Unknown error',\n      });\n    }\n  }\n  \n  private restoreNetworkFunctions(): void {\n    global.fetch = this.originalFetch;\n    global.XMLHttpRequest = this.originalXMLHttpRequest;\n  }\n  \n  // Network utility methods\n  private calculateRequestSize(options?: RequestInit): number {\n    if (!options?.body) return 0;\n    \n    if (typeof options.body === 'string') {\n      return new Blob([options.body]).size;\n    }\n    \n    if (options.body instanceof FormData) {\n      // Rough estimate for FormData\n      return 1024; // Default estimate\n    }\n    \n    return 0;\n  }\n  \n  private calculateResponseSize(response: Response): number {\n    const contentLength = response.headers.get('content-length');\n    return contentLength ? parseInt(contentLength, 10) : 0;\n  }\n  \n  private extractHeaders(response: Response): Record<string, string> {\n    const headers: Record<string, string> = {};\n    response.headers.forEach((value, key) => {\n      // Only capture important headers to avoid memory issues\n      if (['content-type', 'content-length', 'cache-control', 'etag'].includes(key.toLowerCase())) {\n        headers[key] = value;\n      }\n    });\n    return headers;\n  }\n  \n  private isCacheHit(response: Response): boolean {\n    const cacheControl = response.headers.get('cache-control');\n    const etag = response.headers.get('etag');\n    const lastModified = response.headers.get('last-modified');\n    \n    return !!(cacheControl && (etag || lastModified));\n  }\n\n  // ===== PUBLIC API METHODS =====\n  \n  /**\n   * Get current session performance summary\n   */\n  getSessionSummary(): {\n    sessionId: string;\n    duration: number;\n    performanceScore: number;\n    coreVitalsScore: number;\n    metricsCollected: number;\n    alertsTriggered: number;\n    screensVisited: number;\n    memoryUsage: NativeMemoryMetrics | undefined;\n  } {\n    const sessionDuration = Date.now() - parseInt(this.currentSessionId.split('_')[1]);\n    const allCoreVitals = Array.from(this.coreVitals.values()).flat();\n    \n    return {\n      sessionId: this.currentSessionId,\n      duration: sessionDuration,\n      performanceScore: this.calculatePerformanceScore(),\n      coreVitalsScore: this.calculateCoreVitalScore(allCoreVitals),\n      metricsCollected: this.metricsBuffer.size,\n      alertsTriggered: this.activeAlerts.size,\n      screensVisited: this.coreVitals.size,\n      memoryUsage: this.memoryMetrics.getLatest(),\n    };\n  }\n  \n  /**\n   * Get real-time metrics for dashboard\n   */\n  getRealTimeMetrics(): {\n    coreVitals: CoreVitalMetric[];\n    recentMetrics: EnhancedPerformanceMetric[];\n    activeAlerts: PerformanceAlert[];\n    memoryTrend: NativeMemoryMetrics[];\n    networkTrend: EnhancedNetworkMetrics[];\n  } {\n    return {\n      coreVitals: Array.from(this.coreVitals.values()).flat().slice(-20),\n      recentMetrics: this.metricsBuffer.getLast(50),\n      activeAlerts: Array.from(this.activeAlerts.values()),\n      memoryTrend: this.memoryMetrics.getLast(20),\n      networkTrend: this.networkMetrics.getLast(20),\n    };\n  }\n  \n  /**\n   * Export session data for analysis\n   */\n  exportSessionData(): SessionPerformanceData {\n    return {\n      sessionId: this.currentSessionId,\n      userId: this.currentUserId,\n      startTime: parseInt(this.currentSessionId.split('_')[1]),\n      endTime: Date.now(),\n      screenViews: Array.from(this.coreVitals.keys()),\n      coreVitals: Array.from(this.coreVitals.values()).flat(),\n      performanceMetrics: this.metricsBuffer.getAll(),\n      networkMetrics: this.networkMetrics.getAll(),\n      memoryMetrics: this.memoryMetrics.getAll(),\n      alerts: Array.from(this.activeAlerts.values()),\n      performanceScore: this.calculatePerformanceScore(),\n      deviceContext: this.deviceContext!,\n    };\n  }\n  \n  /**\n   * Get memory leak report\n   */\n  getMemoryLeakReport(): {\n    leaks: MemoryLeak[];\n    componentLifecycles: Map<string, ComponentLifecycleEvent[]>;\n    recommendations: string[];\n  } {\n    return {\n      leaks: this.memoryLeaks,\n      componentLifecycles: this.componentLifecycles,\n      recommendations: this.generateMemoryLeakRecommendations(),\n    };\n  }\n  \n  private generateMemoryLeakRecommendations(): string[] {\n    const recommendations = [\n      'Implement proper cleanup in useEffect hooks',\n      'Remove event listeners on component unmount',\n      'Use weak references for cached data',\n      'Implement image memory management',\n      'Review subscription cleanup patterns',\n      'Monitor component mount/unmount patterns',\n      'Use React DevTools Profiler for memory analysis',\n    ];\n    \n    return recommendations;\n  }\n}\n\n// Create and export singleton instance\nexport const modernAPMService = ModernAPMService.getInstance();\nexport default modernAPMService;