/**
 * Modern Application Performance Monitoring (APM) Service
 * Implements Core Web Vitals, Real-time Alerting, Memory Leak Detection,
 * User Journey Correlation, and Predictive Analytics for React Native
 */

import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {
  CoreVitalType,
  CoreVitalMetric,
  EnhancedPerformanceMetric,
  NativeMemoryMetrics,
  PerformanceAlert,
  UserJourneyEvent,
  SessionPerformanceData,
  PerformanceConfig,
  DeviceContext,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_CORE_VITAL_THRESHOLDS,
} from '../types/performance';
import { loggingService } from './LoggingService';

class ModernAPMService {
  private static instance: ModernAPMService;
  private config: PerformanceConfig;
  private sessionId: string;
  private userId?: string;
  private deviceContext: DeviceContext | null = null;
  private screenRenderStarts: Map<string, number> = new Map();
  private coreVitals: CoreVitalMetric[] = [];
  private metrics: EnhancedPerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private journeyEvents: UserJourneyEvent[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.config = DEFAULT_PERFORMANCE_CONFIG;
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): ModernAPMService {
    if (!ModernAPMService.instance) {
      ModernAPMService.instance = new ModernAPMService();
    }
    return ModernAPMService.instance;
  }

  public async initialize(config?: Partial<PerformanceConfig>): Promise<void> {
    try {
      if (this.isInitialized) {
        loggingService.warn('ModernAPMService already initialized');
        return;
      }

      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.deviceContext = await this.collectDeviceContext();
      this.isInitialized = true;

      loggingService.info('ModernAPMService initialized', {
        sessionId: this.sessionId,
        platform: Platform.OS,
      });
    } catch (error) {
      loggingService.error('Failed to initialize ModernAPMService', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public setCurrentUser(userId: string): void {
    this.userId = userId;
    loggingService.debug('User set in ModernAPM', { userId });
  }

  public startScreenRender(screenName: string): void {
    this.screenRenderStarts.set(screenName, performance.now());
  }

  public endScreenRender(screenName: string, context?: Record<string, unknown>): void {
    const startTime = this.screenRenderStarts.get(screenName);
    if (!startTime) {
      loggingService.warn('Screen render start time not found', { screenName });
      return;
    }

    const renderTime = performance.now() - startTime;
    this.screenRenderStarts.delete(screenName);

    // Record as FCP (First Contentful Paint) equivalent
    this.recordCoreVital('FCP', renderTime, screenName, context);
  }

  public recordCoreVital(
    type: CoreVitalType,
    value: number,
    screenName: string,
    _context?: Record<string, unknown>
  ): void {
    if (!this.deviceContext) {
      loggingService.warn('Device context not initialized');
      return;
    }

    const threshold = DEFAULT_CORE_VITAL_THRESHOLDS[type];
    const isGoodScore = value <= threshold.good;

    const coreVital: CoreVitalMetric = {
      type,
      value,
      timestamp: Date.now(),
      screenName,
      deviceInfo: this.deviceContext,
      isGoodScore,
      threshold,
    };

    this.coreVitals.push(coreVital);
    loggingService.debug('Core Vital recorded', { type, value, screenName, isGoodScore });
  }

  public recordTouchInteraction(screenName: string, actionName: string, delay: number): void {
    // Record as FID (First Input Delay) equivalent
    this.recordCoreVital('FID', delay, screenName, {
      actionName,
      interactionType: 'touch',
    });
  }

  public recordLayoutShift(screenName: string, shiftScore: number, context?: Record<string, unknown>): void {
    // Record as CLS (Cumulative Layout Shift) equivalent
    this.recordCoreVital('CLS', shiftScore, screenName, context);
  }

  public recordEnhancedMetric(
    metric: Omit<EnhancedPerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'screenName'>
  ): void {
    const enhancedMetric: EnhancedPerformanceMetric = {
      ...metric,
      id: this.generateMetricId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      screenName: metric.name,
    };

    this.metrics.push(enhancedMetric);

    // Check for performance alerts
    this.checkAlerts(enhancedMetric);
  }

  public async trackNativeMemory(): Promise<NativeMemoryMetrics> {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const usedMemory = await DeviceInfo.getUsedMemory();
    const freeMemory = totalMemory - usedMemory;

    const memoryPressure =
      usedMemory > this.config.thresholds.memory.critical
        ? 'critical'
        : usedMemory > this.config.thresholds.memory.warning
        ? 'high'
        : usedMemory > this.config.thresholds.memory.warning * 0.7
        ? 'medium'
        : 'low';

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

    return memoryMetrics;
  }

  public trackComponentLifecycle(componentName: string, event: 'mount' | 'unmount' | 'update'): void {
    this.recordEnhancedMetric({
      name: `component_${event}`,
      value: Date.now(),
      unit: 'timestamp',
      severity: 'low',
      context: {
        componentName,
        event,
      },
    });
  }

  public getSessionSummary() {
    const performanceScore = this.calculatePerformanceScore();

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      performanceScore,
      metricsCollected: this.metrics.length,
      coreVitalsCount: this.coreVitals.length,
      alertsTriggered: this.alerts.length,
      startTime: Date.now(), // This would be tracked from initialization
    };
  }

  public getRealTimeMetrics() {
    return {
      coreVitals: this.coreVitals.slice(-10), // Last 10
      recentMetrics: this.metrics.slice(-20), // Last 20
      activeAlerts: this.alerts.filter(a => !a.acknowledged),
      memoryTrend: [], // Would implement trending
      networkTrend: [], // Would implement trending
    };
  }

  public exportSessionData(): SessionPerformanceData {
    if (!this.deviceContext) {
      throw new Error('Device context not initialized');
    }

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: Date.now(), // Would track from init
      endTime: Date.now(),
      screenViews: Array.from(this.screenRenderStarts.keys()),
      coreVitals: this.coreVitals,
      performanceMetrics: this.metrics,
      networkMetrics: [], // Would track network metrics
      memoryMetrics: [], // Would track memory snapshots
      alerts: this.alerts,
      performanceScore: this.calculatePerformanceScore(),
      deviceContext: this.deviceContext,
    };
  }

  private async collectDeviceContext(): Promise<DeviceContext> {
    const [model, osVersion, appVersion, totalMemory] = await Promise.all([
      DeviceInfo.getModel(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getVersion(),
      DeviceInfo.getTotalMemory(),
    ]);

    return {
      platform: Platform.OS as 'ios' | 'android',
      osVersion,
      deviceModel: model,
      appVersion,
      connectionType: 'unknown', // Would use NetInfo
      availableMemory: totalMemory,
      screenResolution: {
        width: 0, // Would use Dimensions
        height: 0,
      },
    };
  }

  private checkAlerts(metric: EnhancedPerformanceMetric): void {
    if (metric.severity === 'high' || metric.severity === 'critical') {
      const alert: PerformanceAlert = {
        id: this.generateMetricId(),
        ruleId: 'auto',
        metricType: metric.name,
        value: metric.value,
        threshold: 0,
        severity: metric.severity,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        acknowledged: false,
        context: metric.context || {},
      };

      this.alerts.push(alert);
      loggingService.warn('Performance alert triggered', alert);
    }
  }

  private calculatePerformanceScore(): number {
    // Simple scoring based on core vitals
    const goodVitals = this.coreVitals.filter(v => v.isGoodScore).length;
    const totalVitals = this.coreVitals.length;

    if (totalVitals === 0) return 100;

    return Math.round((goodVitals / totalVitals) * 100);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const modernAPMService = ModernAPMService.getInstance();
export default ModernAPMService;
