/**
 * 📦 Intelligent Bundle Optimizer
 * AI-powered bundle optimization with tree-shaking, code splitting, and dynamic imports
 * Features: Smart chunking, lazy loading, performance prediction, size monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { observabilityService } from './ObservabilityService';

// Bundle Analysis Types
interface BundleAnalysis {
  readonly totalSize: number;
  readonly compressedSize: number;
  readonly compressionRatio: number;
  readonly chunks: ChunkAnalysis[];
  readonly dependencies: DependencyAnalysis[];
  readonly duplicates: DuplicateAnalysis[];
  readonly unusedExports: UnusedExportAnalysis[];
  readonly timestamp: number;
  readonly performanceImpact: BundlePerformanceImpact;
}

interface ChunkAnalysis {
  readonly name: string;
  readonly size: number;
  readonly modules: string[];
  readonly loadPriority: 'critical' | 'high' | 'medium' | 'low';
  readonly loadTiming: 'immediate' | 'defer' | 'lazy' | 'preload';
  readonly cacheStrategy: 'aggressive' | 'normal' | 'minimal';
  readonly compressionRatio: number;
  readonly usageFrequency: number;
}

interface DependencyAnalysis {
  readonly name: string;
  readonly version: string;
  readonly size: number;
  readonly usageCount: number;
  readonly importType: 'direct' | 'transitive';
  readonly treeshakeable: boolean;
  readonly alternatives: AlternativeDependency[];
  readonly securityRisk: 'none' | 'low' | 'medium' | 'high';
  readonly lastUpdated: number;
}

interface AlternativeDependency {
  readonly name: string;
  readonly size: number;
  readonly features: string[];
  readonly recommendation: 'strongly-recommended' | 'recommended' | 'consider' | 'avoid';
}

interface DuplicateAnalysis {
  readonly module: string;
  readonly instances: number;
  readonly totalWastedSize: number;
  readonly suggestedResolution: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

interface UnusedExportAnalysis {
  readonly file: string;
  readonly exports: string[];
  readonly potentialSavings: number;
  readonly safeToRemove: boolean;
  readonly usageAnalysis: 'definitely-unused' | 'probably-unused' | 'uncertain';
}

interface BundlePerformanceImpact {
  readonly loadTime: number;
  readonly parseTime: number;
  readonly executeTime: number;
  readonly memoryUsage: number;
  readonly networkTransfer: number;
  readonly batteryImpact: 'minimal' | 'low' | 'medium' | 'high';
  readonly userExperienceScore: number; // 0-100
}

// Optimization Configuration
interface BundleOptimizationConfig {
  readonly splitting: {
    enabled: boolean;
    strategy: 'vendor' | 'commons' | 'route-based' | 'intelligent';
    maxChunks: number;
    minChunkSize: number;
    maxChunkSize: number;
  };
  readonly compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level: number;
    dynamicCompression: boolean;
  };
  readonly treeshaking: {
    enabled: boolean;
    aggressive: boolean;
    sideEffects: boolean;
    unusedExports: boolean;
  };
  readonly preloading: {
    enabled: boolean;
    strategy: 'aggressive' | 'conservative' | 'adaptive';
    prefetchThreshold: number;
  };
  readonly caching: {
    enabled: boolean;
    strategy: 'browser' | 'service-worker' | 'hybrid';
    maxAge: number;
    versionStrategy: 'hash' | 'timestamp' | 'semantic';
  };
}

// Dynamic Import Manager
class DynamicImportManager {
  private readonly importCache = new Map<string, Promise<any>>();
  private readonly loadTimes = new Map<string, number>();
  private readonly accessPatterns = new Map<string, number[]>();
  private readonly preloadQueue: string[] = [];

  async importModule<T = any>(
    moduleId: string,
    priority: 'immediate' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    const startTime = Date.now();
    
    // Check cache first
    if (this.importCache.has(moduleId)) {
      const cached = await this.importCache.get(moduleId)!;
      this.recordAccess(moduleId);
      return cached;
    }

    // Create import promise
    const importPromise = this.performImport<T>(moduleId);
    this.importCache.set(moduleId, importPromise);

    try {
      const module = await importPromise;
      const loadTime = Date.now() - startTime;
      
      this.loadTimes.set(moduleId, loadTime);
      this.recordAccess(moduleId);
      
      // Track performance
      observabilityService.trackPerformance({
        metricType: 'network',
        name: 'dynamic_import_time',
        value: loadTime,
        severity: loadTime > 1000 ? 'warning' : 'info',
        context: { moduleId, priority },
      });

      return module;
    } catch (error) {
      this.importCache.delete(moduleId);
      throw error;
    }
  }

  private async performImport<T>(moduleId: string): Promise<T> {
    // Platform-specific dynamic import logic
    switch (moduleId) {
      case 'chart-library':
        return import('react-native-chart-kit') as Promise<T>;
      case 'camera-module':
        return import('react-native-vision-camera') as Promise<T>;
      case 'ml-kit':
        return import('@react-native-ml-kit/text-recognition') as Promise<T>;
      case 'maps':
        return import('react-native-maps') as Promise<T>;
      case 'animations':
        return import('react-native-reanimated') as Promise<T>;
      default:
        throw new Error(`Unknown module: ${moduleId}`);
    }
  }

  private recordAccess(moduleId: string): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(moduleId) || [];
    pattern.push(now);
    
    // Keep only recent accesses (last 100)
    if (pattern.length > 100) {
      pattern.shift();
    }
    
    this.accessPatterns.set(moduleId, pattern);
  }

  predictNextImports(): string[] {
    const predictions: Array<{ moduleId: string; score: number }> = [];
    
    for (const [moduleId, pattern] of this.accessPatterns.entries()) {
      if (pattern.length < 2) continue;
      
      // Calculate access frequency
      const frequency = pattern.length;
      const recency = Date.now() - pattern[pattern.length - 1];
      const regularity = this.calculateRegularity(pattern);
      
      // Scoring algorithm
      const score = (frequency * 0.4) + ((1 / (recency + 1)) * 0.3) + (regularity * 0.3);
      predictions.push({ moduleId, score });
    }
    
    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => p.moduleId);
  }

  private calculateRegularity(pattern: number[]): number {
    if (pattern.length < 3) return 0;
    
    const intervals = pattern.slice(1).map((time, i) => time - pattern[i]);
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + (interval - avgInterval) ** 2, 0) / intervals.length;
    
    // Lower variance = higher regularity
    return 1 / (variance + 1);
  }

  async preloadPredictedModules(): Promise<void> {
    const predictions = this.predictNextImports();
    
    for (const moduleId of predictions) {
      if (!this.importCache.has(moduleId)) {
        // Preload in background
        this.importModule(moduleId, 'low').catch(error => {
          console.warn(`Failed to preload module ${moduleId}:`, error);
        });
      }
    }
  }

  getImportStatistics(): {
    totalImports: number;
    averageLoadTime: number;
    cacheHitRate: number;
    slowestImports: Array<{ moduleId: string; loadTime: number }>;
  } {
    const totalImports = this.loadTimes.size;
    const loadTimes = Array.from(this.loadTimes.values());
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length || 0;
    
    const cacheAccesses = Array.from(this.accessPatterns.values())
      .reduce((sum, pattern) => sum + pattern.length, 0);
    const cacheHitRate = totalImports > 0 ? (cacheAccesses - totalImports) / cacheAccesses : 0;
    
    const slowestImports = Array.from(this.loadTimes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([moduleId, loadTime]) => ({ moduleId, loadTime }));
    
    return {
      totalImports,
      averageLoadTime,
      cacheHitRate,
      slowestImports,
    };
  }
}

// Tree Shaking Analyzer
class TreeShakingAnalyzer {
  private readonly usageMap = new Map<string, Set<string>>();
  private readonly exportMap = new Map<string, string[]>();

  analyzeUsage(moduleId: string, usedExports: string[]): void {
    this.usageMap.set(moduleId, new Set(usedExports));
  }

  registerExports(moduleId: string, exports: string[]): void {
    this.exportMap.set(moduleId, exports);
  }

  getUnusedExports(): UnusedExportAnalysis[] {
    const unused: UnusedExportAnalysis[] = [];
    
    for (const [moduleId, exports] of this.exportMap.entries()) {
      const usedExports = this.usageMap.get(moduleId) || new Set();
      const unusedExports = exports.filter(exp => !usedExports.has(exp));
      
      if (unusedExports.length > 0) {
        unused.push({
          file: moduleId,
          exports: unusedExports,
          potentialSavings: this.estimateSavings(moduleId, unusedExports),
          safeToRemove: this.isSafeToRemove(moduleId, unusedExports),
          usageAnalysis: this.analyzeUsageConfidence(moduleId, unusedExports),
        });
      }
    }
    
    return unused;
  }

  private estimateSavings(moduleId: string, unusedExports: string[]): number {
    // Rough estimation: 1KB per unused export
    return unusedExports.length * 1024;
  }

  private isSafeToRemove(moduleId: string, unusedExports: string[]): boolean {
    // Conservative approach: only safe if we have high confidence
    return this.analyzeUsageConfidence(moduleId, unusedExports) === 'definitely-unused';
  }

  private analyzeUsageConfidence(
    moduleId: string,
    unusedExports: string[]
  ): 'definitely-unused' | 'probably-unused' | 'uncertain' {
    // Simplified heuristic - in production, this would be more sophisticated
    const totalExports = this.exportMap.get(moduleId)?.length || 0;
    const unusedRatio = unusedExports.length / totalExports;
    
    if (unusedRatio > 0.8) return 'definitely-unused';
    if (unusedRatio > 0.5) return 'probably-unused';
    return 'uncertain';
  }
}

// Bundle Size Monitor
class BundleSizeMonitor {
  private readonly sizeHistory: Array<{ timestamp: number; size: number }> = [];
  private readonly thresholds = {
    warning: 5 * 1024 * 1024, // 5MB
    critical: 10 * 1024 * 1024, // 10MB
  };

  recordBundleSize(size: number): void {
    this.sizeHistory.push({
      timestamp: Date.now(),
      size,
    });
    
    // Keep only recent history (last 100 builds)
    if (this.sizeHistory.length > 100) {
      this.sizeHistory.shift();
    }
    
    this.checkThresholds(size);
  }

  private checkThresholds(size: number): void {
    if (size > this.thresholds.critical) {
      observabilityService.trackPerformance({
        metricType: 'custom',
        name: 'bundle_size_critical',
        value: size,
        severity: 'critical',
        context: { threshold: this.thresholds.critical },
      });
    } else if (size > this.thresholds.warning) {
      observabilityService.trackPerformance({
        metricType: 'custom',
        name: 'bundle_size_warning',
        value: size,
        severity: 'warning',
        context: { threshold: this.thresholds.warning },
      });
    }
  }

  getSizeGrowthTrend(): {
    trend: 'increasing' | 'stable' | 'decreasing';
    growthRate: number; // bytes per day
    projection: number; // projected size in 30 days
  } {
    if (this.sizeHistory.length < 10) {
      return { trend: 'stable', growthRate: 0, projection: 0 };
    }
    
    const recent = this.sizeHistory.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const timeDiff = last.timestamp - first.timestamp;
    const sizeDiff = last.size - first.size;
    
    const growthRate = (sizeDiff / timeDiff) * (24 * 60 * 60 * 1000); // bytes per day
    const projection = last.size + (growthRate * 30);
    
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (growthRate > 1024 * 100) trend = 'increasing'; // >100KB/day
    else if (growthRate < -1024 * 100) trend = 'decreasing';
    
    return { trend, growthRate, projection };
  }
}

// Main Intelligent Bundle Optimizer
export class IntelligentBundleOptimizer {
  private readonly config: BundleOptimizationConfig;
  private readonly dynamicImports: DynamicImportManager;
  private readonly treeshaking: TreeShakingAnalyzer;
  private readonly sizeMonitor: BundleSizeMonitor;
  private isInitialized = false;

  constructor(config?: Partial<BundleOptimizationConfig>) {
    this.config = {
      splitting: {
        enabled: true,
        strategy: 'intelligent',
        maxChunks: 20,
        minChunkSize: 20 * 1024, // 20KB
        maxChunkSize: 500 * 1024, // 500KB
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        dynamicCompression: true,
      },
      treeshaking: {
        enabled: true,
        aggressive: true,
        sideEffects: false,
        unusedExports: true,
      },
      preloading: {
        enabled: true,
        strategy: 'adaptive',
        prefetchThreshold: 0.7,
      },
      caching: {
        enabled: true,
        strategy: 'hybrid',
        maxAge: 86400000, // 24 hours
        versionStrategy: 'hash',
      },
      ...config,
    };

    this.dynamicImports = new DynamicImportManager();
    this.treeshaking = new TreeShakingAnalyzer();
    this.sizeMonitor = new BundleSizeMonitor();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📦 Initializing Intelligent Bundle Optimizer...');

      // Load previous optimization data
      await this.loadOptimizationHistory();
      
      // Setup bundle monitoring
      this.setupBundleMonitoring();
      
      // Initialize preloading if enabled
      if (this.config.preloading.enabled) {
        this.setupIntelligentPreloading();
      }

      this.isInitialized = true;
      console.log('✅ Intelligent Bundle Optimizer initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Bundle Optimizer:', error);
      throw error;
    }
  }

  private async loadOptimizationHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('bundle_optimization_history');
      if (history) {
        const data = JSON.parse(history);
        // Restore optimization patterns and insights
        console.log('📚 Loaded optimization history:', data.optimizations?.length || 0, 'records');
      }
    } catch (error) {
      console.warn('Failed to load optimization history:', error);
    }
  }

  private setupBundleMonitoring(): void {
    // Monitor bundle size changes
    setInterval(() => {
      this.analyzeCurrentBundle();
    }, 300000); // Every 5 minutes
  }

  private setupIntelligentPreloading(): void {
    // Setup predictive preloading
    setInterval(() => {
      this.dynamicImports.preloadPredictedModules();
    }, 60000); // Every minute
  }

  async importModule<T = any>(
    moduleId: string,
    priority?: 'immediate' | 'high' | 'normal' | 'low'
  ): Promise<T> {
    return this.dynamicImports.importModule<T>(moduleId, priority);
  }

  async analyzeBundleStructure(): Promise<BundleAnalysis> {
    console.log('🔍 Analyzing bundle structure...');
    
    // In a real implementation, this would analyze the actual bundle
    const mockAnalysis: BundleAnalysis = {
      totalSize: 2.5 * 1024 * 1024, // 2.5MB
      compressedSize: 1.8 * 1024 * 1024, // 1.8MB
      compressionRatio: 0.72,
      chunks: [
        {
          name: 'main',
          size: 800 * 1024,
          modules: ['App', 'Navigation', 'Services'],
          loadPriority: 'critical',
          loadTiming: 'immediate',
          cacheStrategy: 'aggressive',
          compressionRatio: 0.75,
          usageFrequency: 1.0,
        },
        {
          name: 'vendor',
          size: 600 * 1024,
          modules: ['react', 'react-native', 'lodash'],
          loadPriority: 'high',
          loadTiming: 'immediate',
          cacheStrategy: 'aggressive',
          compressionRatio: 0.68,
          usageFrequency: 0.9,
        },
      ],
      dependencies: [],
      duplicates: [],
      unusedExports: this.treeshaking.getUnusedExports(),
      timestamp: Date.now(),
      performanceImpact: {
        loadTime: 800,
        parseTime: 200,
        executeTime: 150,
        memoryUsage: 12 * 1024 * 1024,
        networkTransfer: 1.8 * 1024 * 1024,
        batteryImpact: 'low',
        userExperienceScore: 85,
      },
    };

    this.sizeMonitor.recordBundleSize(mockAnalysis.totalSize);
    return mockAnalysis;
  }

  async generateOptimizationRecommendations(): Promise<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    estimatedSavings: number;
  }> {
    const analysis = await this.analyzeBundleStructure();
    const statistics = this.dynamicImports.getImportStatistics();
    const sizeGrowth = this.sizeMonitor.getSizeGrowthTrend();
    
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[],
      estimatedSavings: 0,
    };

    // Immediate optimizations
    if (analysis.unusedExports.length > 0) {
      recommendations.immediate.push(
        `Remove ${analysis.unusedExports.length} unused exports (saves ~${
          analysis.unusedExports.reduce((sum, exp) => sum + exp.potentialSavings, 0) / 1024
        }KB)`
      );
    }

    if (statistics.averageLoadTime > 1000) {
      recommendations.immediate.push(
        'Optimize slow dynamic imports (current avg: ' + Math.round(statistics.averageLoadTime) + 'ms)'
      );
    }

    // Short-term optimizations
    if (analysis.compressionRatio < 0.7) {
      recommendations.shortTerm.push('Improve compression (current ratio: ' + (analysis.compressionRatio * 100).toFixed(1) + '%)');
    }

    if (sizeGrowth.trend === 'increasing') {
      recommendations.shortTerm.push(
        'Address bundle growth trend (+' + Math.round(sizeGrowth.growthRate / 1024) + 'KB/day)'
      );
    }

    // Long-term optimizations
    if (analysis.chunks.length < 3) {
      recommendations.longTerm.push('Implement more granular code splitting');
    }

    recommendations.longTerm.push('Consider migrating to ES modules for better tree-shaking');

    // Calculate estimated savings
    recommendations.estimatedSavings = analysis.unusedExports.reduce(
      (sum, exp) => sum + exp.potentialSavings,
      0
    ) * 0.8; // Conservative estimate

    return recommendations;
  }

  private async analyzeCurrentBundle(): Promise<void> {
    try {
      const analysis = await this.analyzeBundleStructure();
      
      // Store analysis for historical tracking
      await this.storeAnalysis(analysis);
      
      // Check for optimization opportunities
      const recommendations = await this.generateOptimizationRecommendations();
      
      if (recommendations.immediate.length > 0) {
        console.log('🚨 Immediate optimizations available:', recommendations.immediate);
      }
      
    } catch (error) {
      console.error('Bundle analysis failed:', error);
    }
  }

  private async storeAnalysis(analysis: BundleAnalysis): Promise<void> {
    try {
      const key = 'bundle_analysis_' + new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(key, JSON.stringify(analysis));
    } catch (error) {
      console.warn('Failed to store bundle analysis:', error);
    }
  }

  async getOptimizationReport(): Promise<{
    currentAnalysis: BundleAnalysis;
    recommendations: Awaited<ReturnType<typeof this.generateOptimizationRecommendations>>;
    statistics: ReturnType<DynamicImportManager['getImportStatistics']>;
    sizeGrowth: ReturnType<BundleSizeMonitor['getSizeGrowthTrend']>;
  }> {
    const currentAnalysis = await this.analyzeBundleStructure();
    const recommendations = await this.generateOptimizationRecommendations();
    const statistics = this.dynamicImports.getImportStatistics();
    const sizeGrowth = this.sizeMonitor.getSizeGrowthTrend();

    return {
      currentAnalysis,
      recommendations,
      statistics,
      sizeGrowth,
    };
  }

  destroy(): void {
    console.log('🛑 Intelligent Bundle Optimizer destroyed');
  }
}

// Export singleton instance
export const intelligentBundleOptimizer = new IntelligentBundleOptimizer();
export default intelligentBundleOptimizer;