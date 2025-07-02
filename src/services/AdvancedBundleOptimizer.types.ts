/**
 * 📦 Advanced Bundle Optimizer - Type Definitions
 * Following KISS principle: Simple, focused type definitions for bundle optimization
 * File size target: <100 lines for easy maintenance
 */

// Core Bundle Analysis Types
export interface BundleAnalysisResult {
  readonly totalSize: number; // bytes
  readonly gzippedSize: number; // bytes
  readonly modules: ModuleAnalysis[];
  readonly duplicates: DuplicateModule[];
  readonly unusedExports: UnusedExport[];
  readonly optimizationSuggestions: OptimizationSuggestion[];
  readonly performanceImpact: PerformanceImpact;
}

export interface ModuleAnalysis {
  readonly path: string;
  readonly size: number; // bytes
  readonly gzippedSize: number; // bytes
  readonly imports: string[];
  readonly exports: string[];
  readonly isThirdParty: boolean;
  readonly usage: ModuleUsage;
  readonly optimizationPotential: number; // 0-1 score
}

export interface ModuleUsage {
  readonly importCount: number;
  readonly exportUsage: number; // percentage 0-100
  readonly isTreeShakeable: boolean;
  readonly isDynamicallyLoaded: boolean;
  readonly loadPriority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DuplicateModule {
  readonly moduleName: string;
  readonly instances: string[];
  readonly wastedBytes: number;
  readonly consolidationStrategy: ConsolidationStrategy;
}

export interface UnusedExport {
  readonly module: string;
  readonly export: string;
  readonly bytesWasted: number;
  readonly removalRisk: 'safe' | 'medium' | 'risky';
}

export interface OptimizationSuggestion {
  readonly type: OptimizationType;
  readonly description: string;
  readonly expectedSavings: number; // bytes
  readonly effort: 'low' | 'medium' | 'high';
  readonly implementation: string;
}

export interface PerformanceImpact {
  readonly startupTime: number; // ms
  readonly memoryUsage: number; // MB
  readonly networkRequests: number;
  readonly cacheEfficiency: number; // 0-1 score
}

// Configuration Types
export interface BundleOptimizerConfig {
  readonly analysis: AnalysisConfig;
  readonly treeshaking: TreeShakingConfig;
  readonly splitting: CodeSplittingConfig;
  readonly compression: CompressionConfig;
  readonly performance: PerformanceTargets;
}

export interface AnalysisConfig {
  readonly includeDev: boolean;
  readonly analyzeSource: boolean;
  readonly trackDuplicates: boolean;
  readonly minModuleSize: number; // bytes - ignore smaller modules
}

export interface TreeShakingConfig {
  readonly aggressiveMode: boolean;
  readonly preserveComments: boolean;
  readonly removeUnusedImports: boolean;
  readonly sideEffects: string[]; // modules with side effects
}

export interface CodeSplittingConfig {
  readonly strategy: 'manual' | 'automatic' | 'hybrid';
  readonly chunkSize: {
    readonly min: number; // bytes
    readonly max: number; // bytes
    readonly target: number; // bytes
  };
  readonly splitPoints: string[]; // manual split points
}

export interface CompressionConfig {
  readonly gzip: boolean;
  readonly brotli: boolean;
  readonly level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  readonly strategy: 'size' | 'speed' | 'balanced';
}

export interface PerformanceTargets {
  readonly maxBundleSize: number; // bytes
  readonly maxStartupTime: number; // ms
  readonly maxMemoryUsage: number; // MB
  readonly minCacheHitRate: number; // 0-1
}

// Optimization Strategy Types
export type OptimizationType = 
  | 'tree_shaking'
  | 'code_splitting' 
  | 'duplicate_removal'
  | 'compression'
  | 'lazy_loading'
  | 'prefetching'
  | 'polyfill_optimization';

export type ConsolidationStrategy = 
  | 'merge_imports'
  | 'create_shared_chunk' 
  | 'use_external'
  | 'upgrade_version';

// React Native Specific Types
export interface ReactNativeBundleMetrics {
  readonly platform: 'ios' | 'android';
  readonly bundleType: 'debug' | 'release';
  readonly hermes: boolean;
  readonly flipper: boolean;
  readonly codegenEnabled: boolean;
  readonly newArchitecture: boolean;
}

export interface MobileBundleConstraints {
  readonly maxSize: number; // MB - mobile app size limits
  readonly memoryLimit: number; // MB - device memory constraints  
  readonly cpuIntensive: boolean; // if optimization is CPU intensive
  readonly batteryImpact: 'low' | 'medium' | 'high';
}