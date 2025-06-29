/**
 * Enhanced Performance Monitoring Types
 * Modern APM interfaces for React Native with Core Web Vitals equivalents
 */

// Core Web Vitals for React Native
export interface ReactNativeCoreVitals {
  screenRenderTime: number; // FCP equivalent - Time to first meaningful paint
  interactionReadyTime: number; // TTI equivalent - Time until screen is interactive
  touchResponseTime: number; // FID equivalent - First input delay
  layoutStabilityScore: number; // CLS equivalent - Layout shift score
  largestElementTime: number; // LCP equivalent - Largest component render time
}

export type CoreVitalType = 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTI';

export interface CoreVitalMetric {
  type: CoreVitalType;
  value: number;
  timestamp: number;
  screenName: string;
  deviceInfo: DeviceContext;
  isGoodScore: boolean;
  threshold: CoreVitalThreshold;
}

export interface CoreVitalThreshold {
  good: number;
  needsImprovement: number;
  poor: number;
}

// Enhanced Performance Metrics
export interface EnhancedPerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  screenName: string;
  context?: Record<string, any>;
  tags?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Native Memory Tracking
export interface NativeMemoryMetrics {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  availableMemory: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  jsHeapSize: number;
  nativeHeapSize: number;
  imageMemory: number;
  timestamp: number;
  platform: 'ios' | 'android';
}

// Enhanced Network Metrics
export interface EnhancedNetworkMetrics {
  id: string;
  url: string;
  method: string;
  duration: number;
  requestSize: number;
  responseSize: number;
  statusCode: number;
  headers: Record<string, string>;
  errorType?: string;
  retryCount: number;
  cacheHit: boolean;
  connectionType: string;
  timestamp: number;
  sessionId: string;
}

// Memory Leak Detection
export interface MemoryLeak {
  type: 'component' | 'event-listener' | 'image' | 'network' | 'timer';
  componentName?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  memoryGrowth: number;
  timestamp: number;
  stackTrace?: string;
  recommendations: string[];
}

export interface ComponentLifecycleEvent {
  componentName: string;
  event: 'mount' | 'unmount' | 'update';
  timestamp: number;
  props?: Record<string, any>;
  memoryUsage: number;
}

// Real-time Alerting
export interface PerformanceAlertRule {
  id: string;
  name: string;
  metricType: string;
  threshold: number;
  comparison: 'greater' | 'less' | 'equal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
  enabled: boolean;
  conditions?: AlertCondition[];
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface PerformanceAlert {
  id: string;
  ruleId: string;
  metricType: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  sessionId: string;
  acknowledged: boolean;
  resolvedAt?: number;
  context: Record<string, any>;
}

// User Journey Correlation
export interface UserJourneyEvent {
  eventId: string;
  sessionId: string;
  userId?: string;
  eventType: 'screen_view' | 'user_action' | 'performance_event';
  screenName: string;
  action?: string;
  timestamp: number;
  performanceMetrics?: EnhancedPerformanceMetric[];
  context?: Record<string, any>;
}

export interface JourneyPerformanceInsight {
  sessionId: string;
  totalDuration: number;
  screenTransitions: number;
  averageScreenLoadTime: number;
  slowestScreen: string;
  performanceScore: number;
  coreVitalsScore: number;
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
}

export interface PerformanceBottleneck {
  type: 'render' | 'network' | 'memory' | 'navigation';
  screenName: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  metrics: EnhancedPerformanceMetric[];
}

// Device Context
export interface DeviceContext {
  platform: 'ios' | 'android';
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  connectionType: string;
  batteryLevel?: number;
  isLowPowerMode?: boolean;
  availableMemory: number;
  screenResolution: { width: number; height: number };
}

// Performance Trends
export interface PerformanceTrend {
  metricType: string;
  timeRange: TimeRange;
  dataPoints: TrendDataPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  averageValue: number;
  percentile95: number;
  percentile99: number;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
  sessionCount: number;
}

export interface TimeRange {
  start: number;
  end: number;
  granularity: 'minute' | 'hour' | 'day' | 'week';
}

// Session Performance Data
export interface SessionPerformanceData {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  screenViews: string[];
  coreVitals: CoreVitalMetric[];
  performanceMetrics: EnhancedPerformanceMetric[];
  networkMetrics: EnhancedNetworkMetrics[];
  memoryMetrics: NativeMemoryMetrics[];
  alerts: PerformanceAlert[];
  performanceScore: number;
  deviceContext: DeviceContext;
}

// Predictive Analytics
export interface PerformancePrediction {
  metricType: string;
  predictedValue: number;
  confidence: number;
  timeframe: number; // milliseconds into future
  factors: PredictionFactor[];
  recommendation: string;
}

export interface PredictionFactor {
  factor: string;
  influence: number; // -1 to 1
  description: string;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'render' | 'network' | 'memory' | 'bundle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  expectedImprovement: number;
  affectedScreens: string[];
}

// Configuration
export interface PerformanceConfig {
  sampling: {
    enabled: boolean;
    rate: number; // 0-1
    userBased: boolean;
  };
  retention: {
    realTimeHours: number;
    aggregatedDays: number;
    trendsWeeks: number;
  };
  thresholds: {
    coreVitals: Record<CoreVitalType, CoreVitalThreshold>;
    memory: {
      warning: number;
      critical: number;
    };
    network: {
      slowRequest: number;
      verySlowRequest: number;
    };
  };
  features: {
    realTimeAlerting: boolean;
    memoryLeakDetection: boolean;
    userJourneyCorrelation: boolean;
    predictiveAnalytics: boolean;
    networkInterception: boolean;
  };
}

// Circular Buffer for High-Frequency Data
export interface CircularBuffer<T> {
  capacity: number;
  size: number;
  data: T[];
  head: number;
  tail: number;
  add(item: T): void;
  getAll(): T[];
  getLast(count: number): T[];
  clear(): void;
}

// APM Integration
export interface APMProvider {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  sendMetric(metric: EnhancedPerformanceMetric): Promise<void>;
  sendAlert(alert: PerformanceAlert): Promise<void>;
  sendSessionData(session: SessionPerformanceData): Promise<void>;
}

export interface APMConfig {
  providers: APMProvider[];
  batchSize: number;
  batchTimeout: number;
  retryAttempts: number;
  enableCompression: boolean;
}

// Export default configuration
export const DEFAULT_CORE_VITAL_THRESHOLDS: Record<
  CoreVitalType,
  CoreVitalThreshold
> = {
  FCP: { good: 1800, needsImprovement: 3000, poor: 3000 }, // milliseconds
  LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
  FID: { good: 100, needsImprovement: 300, poor: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  TTI: { good: 3800, needsImprovement: 7300, poor: 7300 },
};

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  sampling: {
    enabled: true,
    rate: 1.0,
    userBased: false,
  },
  retention: {
    realTimeHours: 2,
    aggregatedDays: 30,
    trendsWeeks: 12,
  },
  thresholds: {
    coreVitals: DEFAULT_CORE_VITAL_THRESHOLDS,
    memory: {
      warning: 150 * 1024 * 1024, // 150MB
      critical: 300 * 1024 * 1024, // 300MB
    },
    network: {
      slowRequest: 1000, // 1 second
      verySlowRequest: 3000, // 3 seconds
    },
  },
  features: {
    realTimeAlerting: true,
    memoryLeakDetection: true,
    userJourneyCorrelation: true,
    predictiveAnalytics: true,
    networkInterception: true,
  },
};
