/**
 * Enhanced Performance Service
 * Advanced performance monitoring with real-time analytics, memory leak detection,
 * and predictive performance optimization for React Native
 */

import { Platform, Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import {
  EnhancedPerformanceMetric,
  NativeMemoryMetrics,
  EnhancedNetworkMetrics,
  CoreVitalMetric,
  CoreVitalType,
  PerformanceAlertRule,
  PerformanceAlert,
  UserJourneyEvent,
  ComponentLifecycleEvent,
  DeviceContext,
  SessionPerformanceData,
  PerformanceConfig,
  DEFAULT_PERFORMANCE_CONFIG,
} from '../types/performance';
import { loggingService } from './LoggingService';

class EnhancedPerformanceService {
  private static instance: EnhancedPerformanceService;
  private logger = loggingService;
  private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG;
  private sessionId: string;
  private userId?: string;
  private deviceContext: DeviceContext | null = null;

  // Monitoring state
  private isMonitoring: boolean = false;
  private memoryInterval: ReturnType<typeof setInterval> | null = null;

  // Data storage
  private metrics: EnhancedPerformanceMetric[] = [];
  private coreVitals: CoreVitalMetric[] = [];
  private networkMetrics: EnhancedNetworkMetrics[] = [];
  private memorySnapshots: NativeMemoryMetrics[] = [];
  private componentEvents: ComponentLifecycleEvent[] = [];
  private journeyEvents: UserJourneyEvent[] = [];
  private alerts: PerformanceAlert[] = [];
  private alertRules: PerformanceAlertRule[] = [];

  // Performance tracking
  private screenRenderTimes: Map<string, number> = new Map();
  private componentMountTimes: Map<string, number> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultAlertRules();
  }

  public static getInstance(): EnhancedPerformanceService {
    if (!EnhancedPerformanceService.instance) {
      EnhancedPerformanceService.instance = new EnhancedPerformanceService();
    }
    return EnhancedPerformanceService.instance;
  }

  public async initialize(config?: Partial<PerformanceConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.deviceContext = await this.collectDeviceContext();

      this.logger.info('EnhancedPerformanceService initialized', {
        sessionId: this.sessionId,
        platform: Platform.OS,
      });
    } catch (error) {
      this.logger.error('Failed to initialize EnhancedPerformanceService', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public setCurrentUser(userId: string): void {
    this.userId = userId;
  }

  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Performance monitoring already started');
      return;
    }

    this.isMonitoring = true;

    // Start memory monitoring
    if (this.config.features.memoryLeakDetection) {
      this.memoryInterval = setInterval(async () => {
        await this.captureMemorySnapshot();
      }, 5000); // Every 5 seconds
    }

    this.logger.info('Performance monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }

    this.logger.info('Performance monitoring stopped');
  }

  public recordMetric(
    metric: Omit<EnhancedPerformanceMetric, 'id' | 'timestamp' | 'sessionId'>
  ): void {
    const enhancedMetric: EnhancedPerformanceMetric = {
      ...metric,
      id: this.generateMetricId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.metrics.push(enhancedMetric);
    this.checkAlertRules(enhancedMetric);

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }

  public recordCoreVital(
    type: CoreVitalType,
    value: number,
    screenName: string,
    _context?: Record<string, unknown>
  ): void {
    if (!this.deviceContext) {
      this.logger.warn('Device context not initialized');
      return;
    }

    const coreVital: CoreVitalMetric = {
      type,
      value,
      timestamp: Date.now(),
      screenName,
      deviceInfo: this.deviceContext,
      isGoodScore: this.evaluateCoreVital(type, value),
      threshold: this.config.thresholds.coreVitals[type],
    };

    this.coreVitals.push(coreVital);
  }

  public startScreenRender(screenName: string): void {
    this.screenRenderTimes.set(screenName, performance.now());
  }

  public endScreenRender(screenName: string, context?: Record<string, unknown>): void {
    const startTime = this.screenRenderTimes.get(screenName);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.screenRenderTimes.delete(screenName);

    this.recordMetric({
      name: 'screen_render',
      value: renderTime,
      unit: 'ms',
      screenName,
      severity: renderTime > 1000 ? 'high' : renderTime > 500 ? 'medium' : 'low',
      context: { ...context, screenName },
    });

    this.recordCoreVital('FCP', renderTime, screenName, context);
  }

  public trackComponentLifecycle(
    componentName: string,
    event: 'mount' | 'unmount' | 'update',
    props?: Record<string, unknown>
  ): void {
    const lifecycleEvent: ComponentLifecycleEvent = {
      componentName,
      event,
      timestamp: Date.now(),
      props,
      memoryUsage: 0, // Would get from memory tracking
    };

    this.componentEvents.push(lifecycleEvent);

    if (event === 'mount') {
      this.componentMountTimes.set(componentName, Date.now());
    } else if (event === 'unmount') {
      const mountTime = this.componentMountTimes.get(componentName);
      if (mountTime) {
        const lifetime = Date.now() - mountTime;
        this.componentMountTimes.delete(componentName);

        this.recordMetric({
          name: 'component_lifetime',
          value: lifetime,
          unit: 'ms',
          screenName: componentName,
          severity: 'low',
          context: { componentName, lifetime },
        });
      }
    }
  }

  public async trackNativeMemory(): Promise<NativeMemoryMetrics> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = await DeviceInfo.getUsedMemory();
      const freeMemory = totalMemory - usedMemory;

      const memoryPressure = this.determineMemoryPressure(usedMemory);

      const memoryMetrics: NativeMemoryMetrics = {
        totalMemory,
        freeMemory,
        usedMemory,
        availableMemory: freeMemory,
        memoryPressure,
        jsHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        nativeHeapSize: usedMemory,
        imageMemory: 0,
        timestamp: Date.now(),
        platform: Platform.OS as 'ios' | 'android',
      };

      this.memorySnapshots.push(memoryMetrics);
      return memoryMetrics;
    } catch (error) {
      this.logger.error('Failed to track native memory', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    screenName: string = 'unknown'
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        screenName,
        severity: duration > 1000 ? 'high' : duration > 500 ? 'medium' : 'low',
        context: { operationType: 'async', success: true },
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        screenName,
        severity: 'critical',
        context: {
          operationType: 'async',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  public getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      metricsCollected: this.metrics.length,
      coreVitalsCount: this.coreVitals.length,
      alertsTriggered: this.alerts.length,
      performanceScore: this.calculatePerformanceScore(),
      averageRenderTime: this.calculateAverageMetric('screen_render'),
      memoryPressure: this.memorySnapshots.length > 0
        ? this.memorySnapshots[this.memorySnapshots.length - 1].memoryPressure
        : 'low',
    };
  }

  public getRealTimeMetrics() {
    return {
      coreVitals: this.coreVitals.slice(-10),
      recentMetrics: this.metrics.slice(-20),
      activeAlerts: this.alerts.filter(a => !a.acknowledged),
      memoryTrend: this.memorySnapshots.slice(-20),
      networkTrend: this.networkMetrics.slice(-20),
    };
  }

  public exportSessionData(): SessionPerformanceData {
    if (!this.deviceContext) {
      throw new Error('Device context not initialized');
    }

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: Date.now(), // Would track from initialization
      endTime: Date.now(),
      screenViews: Array.from(this.screenRenderTimes.keys()),
      coreVitals: this.coreVitals,
      performanceMetrics: this.metrics,
      networkMetrics: this.networkMetrics,
      memoryMetrics: this.memorySnapshots,
      alerts: this.alerts,
      performanceScore: this.calculatePerformanceScore(),
      deviceContext: this.deviceContext,
    };
  }

  private async captureMemorySnapshot(): Promise<void> {
    try {
      const memoryMetrics = await this.trackNativeMemory();

      // Detect potential memory leaks
      if (this.config.features.memoryLeakDetection) {
        this.detectMemoryLeaks(memoryMetrics);
      }
    } catch (error) {
      this.logger.error('Failed to capture memory snapshot', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private detectMemoryLeaks(currentMemory: NativeMemoryMetrics): void {
    if (this.memorySnapshots.length < 5) return; // Need history

    const recentSnapshots = this.memorySnapshots.slice(-5);
    const memoryGrowth = currentMemory.usedMemory - recentSnapshots[0].usedMemory;
    const growthRate = memoryGrowth / recentSnapshots[0].usedMemory;

    if (growthRate > 0.2) { // 20% growth
      this.recordMetric({
        name: 'potential_memory_leak',
        value: memoryGrowth,
        unit: 'bytes',
        screenName: 'system',
        severity: growthRate > 0.5 ? 'critical' : 'high',
        context: {
          growthRate,
          currentUsage: currentMemory.usedMemory,
          memoryPressure: currentMemory.memoryPressure,
        },
      });
    }
  }

  private async collectDeviceContext(): Promise<DeviceContext> {
    const [model, osVersion, appVersion, totalMemory, batteryLevel] = await Promise.all([
      DeviceInfo.getModel(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getVersion(),
      DeviceInfo.getTotalMemory(),
      DeviceInfo.getBatteryLevel(),
    ]);

    const connectionInfo = await NetInfo.fetch();
    const { width, height } = Dimensions.get('window');

    return {
      platform: Platform.OS as 'ios' | 'android',
      osVersion,
      deviceModel: model,
      appVersion,
      connectionType: connectionInfo.type || 'unknown',
      batteryLevel,
      isLowPowerMode: await DeviceInfo.isPowerSaveMode(),
      availableMemory: totalMemory,
      screenResolution: { width, height },
    };
  }

  private checkAlertRules(metric: EnhancedPerformanceMetric): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      if (rule.metricType !== metric.name) continue;

      const shouldAlert = this.evaluateAlertRule(rule, metric.value);

      if (shouldAlert) {
        const alert: PerformanceAlert = {
          id: this.generateMetricId(),
          ruleId: rule.id,
          metricType: metric.name,
          value: metric.value,
          threshold: rule.threshold,
          severity: rule.severity,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          acknowledged: false,
          context: metric.context || {},
        };

        this.alerts.push(alert);
        this.logger.warn('Performance alert triggered', alert);
      }
    }
  }

  private evaluateAlertRule(rule: PerformanceAlertRule, value: number): boolean {
    switch (rule.comparison) {
      case 'greater':
        return value > rule.threshold;
      case 'less':
        return value < rule.threshold;
      case 'equal':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private evaluateCoreVital(type: CoreVitalType, value: number): boolean {
    const threshold = this.config.thresholds.coreVitals[type];
    return value <= threshold.good;
  }

  private determineMemoryPressure(usedMemory: number): 'low' | 'medium' | 'high' | 'critical' {
    const { warning, critical } = this.config.thresholds.memory;

    if (usedMemory > critical) return 'critical';
    if (usedMemory > warning) return 'high';
    if (usedMemory > warning * 0.7) return 'medium';
    return 'low';
  }

  private calculatePerformanceScore(): number {
    const goodVitals = this.coreVitals.filter(v => v.isGoodScore).length;
    const totalVitals = this.coreVitals.length;

    if (totalVitals === 0) return 100;

    return Math.round((goodVitals / totalVitals) * 100);
  }

  private calculateAverageMetric(metricName: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'slow_render',
        name: 'Slow Screen Render',
        metricType: 'screen_render',
        threshold: 1000,
        comparison: 'greater',
        severity: 'high',
        cooldownMinutes: 5,
        enabled: true,
      },
      {
        id: 'high_memory',
        name: 'High Memory Usage',
        metricType: 'memory_usage',
        threshold: this.config.thresholds.memory.warning,
        comparison: 'greater',
        severity: 'medium',
        cooldownMinutes: 10,
        enabled: true,
      },
    ];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const enhancedPerformanceService = EnhancedPerformanceService.getInstance();
export default EnhancedPerformanceService;
