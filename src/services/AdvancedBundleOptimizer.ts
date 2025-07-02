/**
 * 📦 Advanced Bundle Optimizer - Integration Layer
 * Following KISS principle: Simple service interface for bundle optimization
 * File size target: 100-200 lines max
 */

import { observabilityService } from './ObservabilityService';
import { BundleOptimizerCore } from './AdvancedBundleOptimizer.core';
import type {
  BundleAnalysisResult,
  BundleOptimizerConfig,
  OptimizationSuggestion,
  PerformanceTargets
} from './AdvancedBundleOptimizer.types';

/**
 * Advanced Bundle Optimizer Service
 * Provides bundle analysis and optimization for React Native apps
 */
class AdvancedBundleOptimizerService {
  private core: BundleOptimizerCore;
  private isAnalyzing = false;
  private lastAnalysis: BundleAnalysisResult | null = null;

  constructor() {
    const defaultConfig: BundleOptimizerConfig = this.getDefaultConfig();
    this.core = new BundleOptimizerCore(defaultConfig);
  }

  /**
   * Analyze current app bundle and get optimization suggestions
   */
  async analyzeAppBundle(): Promise<BundleAnalysisResult> {
    if (this.isAnalyzing) {
      throw new Error('Bundle analysis already in progress');
    }

    this.isAnalyzing = true;
    const startTime = performance.now();

    try {
      // In a real implementation, this would get the actual bundle path
      const bundlePath = this.getCurrentBundlePath();
      
      await observabilityService.trackMetric('bundle_analysis_started', {
        timestamp: Date.now(),
        bundlePath
      });

      const result = await this.core.analyzeBundleStructure(bundlePath);
      this.lastAnalysis = result;

      const analysisTime = performance.now() - startTime;
      
      await observabilityService.trackMetric('bundle_analysis_completed', {
        duration: analysisTime,
        totalSize: result.totalSize,
        moduleCount: result.modules.length,
        suggestionCount: result.optimizationSuggestions.length
      });

      console.log(`📦 Bundle Analysis Complete:
        Total Size: ${this.formatBytes(result.totalSize)}
        Gzipped: ${this.formatBytes(result.gzippedSize)}
        Modules: ${result.modules.length}
        Optimizations: ${result.optimizationSuggestions.length}
        Analysis Time: ${analysisTime.toFixed(2)}ms`);

      return result;
    } catch (error) {
      await observabilityService.trackError('bundle_analysis_failed', error as Error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Get top optimization suggestions prioritized by impact
   */
  getTopOptimizations(limit = 5): OptimizationSuggestion[] {
    if (!this.lastAnalysis) {
      throw new Error('No bundle analysis available. Run analyzeAppBundle() first.');
    }

    return this.lastAnalysis.optimizationSuggestions
      .slice(0, limit)
      .map(suggestion => ({
        ...suggestion,
        expectedSavings: suggestion.expectedSavings,
        priority: this.calculatePriority(suggestion)
      }));
  }

  /**
   * Check if bundle meets performance targets
   */
  checkPerformanceTargets(): {
    passed: boolean;
    failures: string[];
    score: number;
  } {
    if (!this.lastAnalysis) {
      throw new Error('No bundle analysis available. Run analyzeAppBundle() first.');
    }

    const targets = this.getDefaultConfig().performance;
    const impact = this.lastAnalysis.performanceImpact;
    const failures: string[] = [];

    if (this.lastAnalysis.totalSize > targets.maxBundleSize) {
      failures.push(`Bundle size ${this.formatBytes(this.lastAnalysis.totalSize)} exceeds limit ${this.formatBytes(targets.maxBundleSize)}`);
    }

    if (impact.startupTime > targets.maxStartupTime) {
      failures.push(`Startup time ${impact.startupTime}ms exceeds limit ${targets.maxStartupTime}ms`);
    }

    if (impact.memoryUsage > targets.maxMemoryUsage) {
      failures.push(`Memory usage ${impact.memoryUsage}MB exceeds limit ${targets.maxMemoryUsage}MB`);
    }

    if (impact.cacheEfficiency < targets.minCacheHitRate) {
      failures.push(`Cache efficiency ${(impact.cacheEfficiency * 100).toFixed(1)}% below minimum ${(targets.minCacheHitRate * 100).toFixed(1)}%`);
    }

    const passed = failures.length === 0;
    const score = Math.max(0, 100 - (failures.length * 25)); // 25 points per failure

    return { passed, failures, score };
  }

  /**
   * Get bundle size breakdown by category
   */
  getBundleBreakdown(): {
    thirdParty: number;
    firstParty: number;
    critical: number;
    lazy: number;
  } {
    if (!this.lastAnalysis) {
      throw new Error('No bundle analysis available. Run analyzeAppBundle() first.');
    }

    const breakdown = {
      thirdParty: 0,
      firstParty: 0,
      critical: 0,
      lazy: 0
    };

    this.lastAnalysis.modules.forEach(module => {
      if (module.isThirdParty) {
        breakdown.thirdParty += module.size;
      } else {
        breakdown.firstParty += module.size;
      }

      if (module.usage.loadPriority === 'critical') {
        breakdown.critical += module.size;
      } else if (module.usage.isDynamicallyLoaded) {
        breakdown.lazy += module.size;
      }
    });

    return breakdown;
  }

  /**
   * Estimate optimization impact
   */
  estimateOptimizationImpact(): {
    totalSavings: number;
    startupImprovement: number;
    memoryReduction: number;
  } {
    if (!this.lastAnalysis) {
      throw new Error('No bundle analysis available. Run analyzeAppBundle() first.');
    }

    const totalSavings = this.lastAnalysis.optimizationSuggestions
      .reduce((sum, suggestion) => sum + suggestion.expectedSavings, 0);

    const startupImprovement = Math.round(totalSavings / 1000 * 2); // ~2ms per KB saved
    const memoryReduction = Math.round(totalSavings / (1024 * 1024) * 1.5); // ~1.5x in memory

    return {
      totalSavings,
      startupImprovement,
      memoryReduction
    };
  }

  /**
   * Private helper methods
   */
  private getDefaultConfig(): BundleOptimizerConfig {
    return {
      analysis: {
        includeDev: __DEV__,
        analyzeSource: true,
        trackDuplicates: true,
        minModuleSize: 1000 // 1KB minimum
      },
      treeshaking: {
        aggressiveMode: !__DEV__,
        preserveComments: __DEV__,
        removeUnusedImports: true,
        sideEffects: ['*.css', '*.scss']
      },
      splitting: {
        strategy: 'automatic',
        chunkSize: {
          min: 20000,   // 20KB
          max: 200000,  // 200KB
          target: 100000 // 100KB
        },
        splitPoints: []
      },
      compression: {
        gzip: true,
        brotli: false, // Not widely supported on mobile
        level: 6,
        strategy: 'balanced'
      },
      performance: {
        maxBundleSize: 150 * 1024 * 1024, // 150MB
        maxStartupTime: 3000,              // 3 seconds
        maxMemoryUsage: 200,               // 200MB
        minCacheHitRate: 0.8               // 80%
      }
    };
  }

  private getCurrentBundlePath(): string {
    // In a real implementation, this would detect the current bundle path
    return __DEV__ ? 'index.bundle' : 'main.jsbundle';
  }

  private calculatePriority(suggestion: OptimizationSuggestion): 'high' | 'medium' | 'low' {
    const impact = suggestion.expectedSavings;
    if (impact > 50000 && suggestion.effort === 'low') return 'high';
    if (impact > 20000) return 'medium';
    return 'low';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const advancedBundleOptimizer = new AdvancedBundleOptimizerService();
export default advancedBundleOptimizer;