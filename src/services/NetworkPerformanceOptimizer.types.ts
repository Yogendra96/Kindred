/**
 * 🌐 Network Performance Optimizer - Type Definitions
 * Following KISS principle: Simple, focused types for network optimization
 * File size target: <100 lines for easy maintenance
 */

// Core Network Performance Types
export interface NetworkAnalysisResult {
  readonly latency: number; // ms
  readonly throughput: number; // bytes per second
  readonly reliability: number; // 0-1 success rate
  readonly requestMetrics: RequestMetrics[];
  readonly optimizations: NetworkOptimization[];
  readonly cacheEfficiency: CacheEfficiency;
  readonly connectionQuality: ConnectionQuality;
}

export interface RequestMetrics {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly responseTime: number; // ms
  readonly size: number; // bytes
  readonly statusCode: number;
  readonly fromCache: boolean;
  readonly retries: number;
  readonly timestamp: number;
}

export interface NetworkOptimization {
  readonly type: OptimizationType;
  readonly description: string;
  readonly expectedImprovement: number; // percentage
  readonly effort: 'low' | 'medium' | 'high';
  readonly implementation: string;
  readonly priority: number; // 1-10
}

export interface CacheEfficiency {
  readonly hitRate: number; // 0-1
  readonly missCount: number;
  readonly totalRequests: number;
  readonly cacheSize: number; // bytes
  readonly evictions: number;
}

export interface ConnectionQuality {
  readonly type: ConnectionType;
  readonly strength: number; // 0-1
  readonly bandwidth: number; // bytes per second
  readonly packetLoss: number; // 0-1
  readonly jitter: number; // ms
}

// Configuration Types
export interface NetworkOptimizerConfig {
  readonly caching: CachingConfig;
  readonly retry: RetryConfig;
  readonly compression: CompressionConfig;
  readonly batching: BatchingConfig;
  readonly monitoring: MonitoringConfig;
  readonly optimization: AutoOptimizationConfig;
}

export interface CachingConfig {
  readonly enabled: boolean;
  readonly maxSize: number; // bytes
  readonly ttl: number; // ms
  readonly strategy: CacheStrategy;
  readonly compression: boolean;
  readonly persistToDisk: boolean;
}

export interface RetryConfig {
  readonly enabled: boolean;
  readonly maxRetries: number;
  readonly backoffStrategy: 'linear' | 'exponential' | 'fixed';
  readonly initialDelay: number; // ms
  readonly maxDelay: number; // ms
  readonly retryConditions: RetryCondition[];
}

export interface CompressionConfig {
  readonly enabled: boolean;
  readonly algorithm: 'gzip' | 'brotli' | 'deflate';
  readonly level: number; // 1-9
  readonly minSize: number; // bytes - minimum size to compress
}

export interface BatchingConfig {
  readonly enabled: boolean;
  readonly maxBatchSize: number; // number of requests
  readonly maxWaitTime: number; // ms
  readonly batchableEndpoints: string[];
}

export interface MonitoringConfig {
  readonly trackPerformance: boolean;
  readonly sampleRate: number; // 0-1
  readonly alertThresholds: AlertThresholds;
  readonly retentionPeriod: number; // ms
}

export interface AutoOptimizationConfig {
  readonly adaptiveCaching: boolean;
  readonly dynamicRetry: boolean;
  readonly intelligentBatching: boolean;
  readonly networkAwareRequests: boolean;
}

// Network Specific Types
export type ConnectionType = 
  | 'wifi'
  | 'cellular_5g'
  | 'cellular_4g'
  | 'cellular_3g'
  | 'cellular_2g'
  | 'ethernet'
  | 'unknown';

export type CacheStrategy = 
  | 'lru'
  | 'lfu'
  | 'fifo'
  | 'ttl'
  | 'adaptive';

export type OptimizationType = 
  | 'caching'
  | 'compression'
  | 'batching'
  | 'retry_optimization'
  | 'connection_pooling'
  | 'prefetching'
  | 'lazy_loading';

export interface RetryCondition {
  readonly statusCodes: number[];
  readonly errorTypes: string[];
  readonly networkErrors: boolean;
}

export interface AlertThresholds {
  readonly maxLatency: number; // ms
  readonly minThroughput: number; // bytes per second
  readonly maxErrorRate: number; // 0-1
  readonly minCacheHitRate: number; // 0-1
}

// React Native Specific Types
export interface MobileNetworkConstraints {
  readonly dataUsageLimit: number; // bytes
  readonly batteryOptimization: boolean;
  readonly backgroundMode: boolean;
  readonly roamingMode: boolean;
  readonly lowDataMode: boolean;
}

export interface RequestPriority {
  readonly level: 'critical' | 'high' | 'medium' | 'low';
  readonly defer: boolean;
  readonly networkType?: ConnectionType[];
  readonly retryable: boolean;
}

export interface NetworkPerformanceMetrics {
  readonly averageLatency: number; // ms
  readonly p95Latency: number; // ms
  readonly errorRate: number; // 0-1
  readonly throughput: number; // bytes per second
  readonly cacheHitRate: number; // 0-1
  readonly dataUsage: number; // bytes
  readonly requestCount: number;
}