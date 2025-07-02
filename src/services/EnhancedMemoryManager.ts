/**
 * 🧠 Enhanced Memory Manager - Integration Layer
 * Following KISS principle: Simple service interface for memory management
 * File size target: 100-200 lines max
 */

import { observabilityService } from './ObservabilityService';
import { MemoryManagerCore } from './EnhancedMemoryManager.core';
import type {
  MemoryAnalysisResult,
  MemoryManagerConfig,
  MemoryOptimization,
  MemoryBreakdown
} from './EnhancedMemoryManager.types';

/**
 * Enhanced Memory Manager Service
 * Provides intelligent memory management for React Native apps
 */
class EnhancedMemoryManagerService {
  private core: MemoryManagerCore;
  private isInitialized = false;
  private lastAnalysis: MemoryAnalysisResult | null = null;

  constructor() {
    const defaultConfig = this.getDefaultConfig();
    this.core = new MemoryManagerCore(defaultConfig);
  }

  /**
   * Initialize memory management and start monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.core.startMonitoring();
      this.isInitialized = true;

      await observabilityService.trackMetric('memory_manager_initialized', {
        timestamp: Date.now(),
        monitoring: true
      });

      console.log('🧠 Enhanced Memory Manager initialized');
    } catch (error) {
      await observabilityService.trackError('memory_manager_init_failed', error as Error);
      throw error;
    }
  }

  /**
   * Get current memory analysis with recommendations
   */
  async getMemoryAnalysis(): Promise<MemoryAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      const analysis = await this.core.analyzeMemoryUsage();
      this.lastAnalysis = analysis;

      const analysisTime = performance.now() - startTime;

      await observabilityService.trackMetric('memory_analysis_completed', {
        duration: analysisTime,
        totalUsage: analysis.totalUsage,
        available: analysis.available,
        leakCount: analysis.leaks.length,
        recommendationCount: analysis.recommendations.length
      });

      console.log(`🧠 Memory Analysis:
        Usage: ${this.formatBytes(analysis.totalUsage)}
        Available: ${this.formatBytes(analysis.available)}
        Peak: ${this.formatBytes(analysis.peak)}
        Leaks: ${analysis.leaks.length}
        Recommendations: ${analysis.recommendations.length}`);

      return analysis;
    } catch (error) {
      await observabilityService.trackError('memory_analysis_failed', error as Error);
      throw error;
    }
  }

  /**
   * Perform immediate memory cleanup
   */
  async performMemoryCleanup(force = false): Promise<{
    success: boolean;
    savings: number;
    actions: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.core.performCleanup(force);

      await observabilityService.trackMetric('memory_cleanup_performed', {
        before: result.before,
        after: result.after,
        savings: result.savings,
        actionCount: result.actions.length,
        forced: force
      });

      return {
        success: true,
        savings: result.savings,
        actions: result.actions
      };
    } catch (error) {
      await observabilityService.trackError('memory_cleanup_failed', error as Error);
      return {
        success: false,
        savings: 0,
        actions: []
      };
    }
  }

  /**
   * Get top memory optimization recommendations
   */
  getMemoryRecommendations(limit = 3): MemoryOptimization[] {
    if (!this.lastAnalysis) {
      throw new Error('No memory analysis available. Run getMemoryAnalysis() first.');
    }

    return this.lastAnalysis.recommendations
      .slice(0, limit)
      .map(rec => ({
        ...rec,
        formattedSavings: this.formatBytes(rec.expectedSavings)
      }));
  }

  /**
   * Check if memory usage is healthy
   */
  getMemoryHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    usage: number;
    percentage: number;
    message: string;
  } {
    if (!this.lastAnalysis) {
      return {
        status: 'warning',
        usage: 0,
        percentage: 0,
        message: 'No memory analysis available'
      };
    }

    const total = this.lastAnalysis.totalUsage + this.lastAnalysis.available;
    const percentage = (this.lastAnalysis.totalUsage / total) * 100;

    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    if (percentage > 85) {
      status = 'critical';
      message = 'Critical memory usage - immediate cleanup recommended';
    } else if (percentage > 70) {
      status = 'warning';
      message = 'High memory usage - monitor closely';
    } else {
      status = 'healthy';
      message = 'Memory usage is within normal limits';
    }

    return {
      status,
      usage: this.lastAnalysis.totalUsage,
      percentage,
      message
    };
  }

  /**
   * Get memory breakdown by category
   */
  getMemoryBreakdown(): MemoryBreakdown | null {
    return this.lastAnalysis?.breakdown || null;
  }

  /**
   * Get memory trend information
   */
  getMemoryTrend(): {
    direction: string;
    rate: string;
    prediction: string;
  } | null {
    if (!this.lastAnalysis) return null;

    const trend = this.lastAnalysis.trend;
    return {
      direction: trend.direction,
      rate: this.formatBytes(Math.abs(trend.rate)) + '/min',
      prediction: trend.prediction.timeToLimit === Infinity 
        ? 'Stable' 
        : `${Math.round(trend.prediction.timeToLimit)} minutes to limit`
    };
  }

  /**
   * Clean up and stop monitoring
   */
  async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.core.stopMonitoring();
      this.isInitialized = false;
      this.lastAnalysis = null;

      await observabilityService.trackMetric('memory_manager_disposed', {
        timestamp: Date.now()
      });

      console.log('🧠 Memory Manager disposed');
    } catch (error) {
      console.error('Memory Manager disposal failed:', error);
    }
  }

  /**
   * Private helper methods
   */
  private getDefaultConfig(): MemoryManagerConfig {
    return {
      monitoring: {
        interval: 30000, // 30 seconds
        sampleRetention: 100,
        leakDetection: true,
        detailedBreakdown: !__DEV__ // More detailed in production
      },
      cleanup: {
        automatic: true,
        aggressiveness: 'balanced',
        triggers: [
          { type: 'threshold', value: 80, action: { target: 'cache', aggressiveness: 0.5, preserveCritical: true } },
          { type: 'interval', value: 300000, action: { target: 'images', aggressiveness: 0.3, preserveCritical: true } }
        ],
        preservation: [
          { pattern: 'critical_*', reason: 'Critical app data', priority: 10 },
          { pattern: 'user_*', reason: 'User data', priority: 8 }
        ]
      },
      limits: {
        warning: 200 * 1024 * 1024,   // 200MB
        critical: 300 * 1024 * 1024,  // 300MB
        emergency: 400 * 1024 * 1024, // 400MB
        maxCacheSize: 50 * 1024 * 1024 // 50MB
      },
      optimization: {
        enableImageOptimization: true,
        enableComponentPooling: !__DEV__, // Only in production
        enableServiceCaching: true,
        gcHints: true
      }
    };
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
export const enhancedMemoryManager = new EnhancedMemoryManagerService();
export default enhancedMemoryManager;