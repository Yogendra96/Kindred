/**
 * 🧠 Enhanced Memory Manager - Type Definitions
 * Following KISS principle: Simple, focused types for memory management
 * File size target: <100 lines for easy maintenance
 */

// Core Memory Management Types
export interface MemoryAnalysisResult {
  readonly totalUsage: number; // bytes
  readonly available: number; // bytes
  readonly peak: number; // bytes
  readonly breakdown: MemoryBreakdown;
  readonly leaks: MemoryLeak[];
  readonly recommendations: MemoryOptimization[];
  readonly trend: MemoryTrend;
}

export interface MemoryBreakdown {
  readonly jsHeap: number; // bytes
  readonly images: number; // bytes
  readonly components: number; // bytes
  readonly services: number; // bytes
  readonly cache: number; // bytes
  readonly other: number; // bytes
}

export interface MemoryLeak {
  readonly id: string;
  readonly type: MemoryLeakType;
  readonly size: number; // bytes
  readonly location: string;
  readonly retainedObjects: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly detectedAt: number; // timestamp
}

export interface MemoryOptimization {
  readonly type: OptimizationType;
  readonly description: string;
  readonly expectedSavings: number; // bytes
  readonly effort: 'low' | 'medium' | 'high';
  readonly implementation: string;
  readonly priority: number; // 1-10
}

export interface MemoryTrend {
  readonly direction: 'increasing' | 'stable' | 'decreasing';
  readonly rate: number; // bytes per minute
  readonly samples: MemorySample[];
  readonly prediction: MemoryPrediction;
}

export interface MemorySample {
  readonly timestamp: number;
  readonly usage: number; // bytes
  readonly available: number; // bytes
  readonly gcCount: number;
}

export interface MemoryPrediction {
  readonly timeToLimit: number; // minutes until memory limit
  readonly confidence: number; // 0-1
  readonly growthPattern: 'linear' | 'exponential' | 'cyclical';
}

// Configuration Types
export interface MemoryManagerConfig {
  readonly monitoring: MonitoringConfig;
  readonly cleanup: CleanupConfig;
  readonly limits: MemoryLimits;
  readonly optimization: OptimizationConfig;
}

export interface MonitoringConfig {
  readonly interval: number; // ms
  readonly sampleRetention: number; // number of samples to keep
  readonly leakDetection: boolean;
  readonly detailedBreakdown: boolean;
}

export interface CleanupConfig {
  readonly automatic: boolean;
  readonly aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  readonly triggers: CleanupTrigger[];
  readonly preservation: PreservationRule[];
}

export interface MemoryLimits {
  readonly warning: number; // bytes
  readonly critical: number; // bytes
  readonly emergency: number; // bytes
  readonly maxCacheSize: number; // bytes
}

export interface OptimizationConfig {
  readonly enableImageOptimization: boolean;
  readonly enableComponentPooling: boolean;
  readonly enableServiceCaching: boolean;
  readonly gcHints: boolean;
}

// Leak Detection Types
export type MemoryLeakType = 
  | 'unreleased_listeners'
  | 'circular_references'
  | 'detached_components'
  | 'retained_images'
  | 'unclosed_resources'
  | 'growing_cache'
  | 'repeated_allocations';

export type OptimizationType = 
  | 'garbage_collection'
  | 'image_compression'
  | 'component_pooling'
  | 'cache_cleanup'
  | 'listener_removal'
  | 'resource_disposal';

export interface CleanupTrigger {
  readonly type: 'threshold' | 'interval' | 'navigation' | 'background';
  readonly value: number;
  readonly action: CleanupAction;
}

export interface CleanupAction {
  readonly target: 'cache' | 'images' | 'components' | 'all';
  readonly aggressiveness: number; // 0-1
  readonly preserveCritical: boolean;
}

export interface PreservationRule {
  readonly pattern: string; // regex or glob pattern
  readonly reason: string;
  readonly priority: number; // higher = more preserved
}

// React Native Specific Types
export interface ReactNativeMemoryMetrics {
  readonly platform: 'ios' | 'android';
  readonly deviceMemory: number; // total device memory in bytes
  readonly availableMemory: number; // available device memory
  readonly appMemoryLimit: number; // app memory limit
  readonly hermes: boolean;
  readonly bridgeMemory: number; // RN bridge memory usage
}

export interface ComponentMemoryUsage {
  readonly componentName: string;
  readonly instances: number;
  readonly memoryPerInstance: number; // bytes
  readonly totalMemory: number; // bytes
  readonly isOptimized: boolean;
}