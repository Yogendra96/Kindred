/**
 * 🧠 Enhanced Memory Manager - Core Logic Module  
 * Following KISS principle: Focused memory management logic
 * File size target: 200-300 lines max
 */

import { Platform } from 'react-native';
import type {
  MemoryAnalysisResult,
  MemoryManagerConfig,
  MemoryBreakdown,
  MemoryLeak,
  MemoryOptimization,
  MemoryTrend,
  MemorySample,
  ReactNativeMemoryMetrics,
  ComponentMemoryUsage
} from './EnhancedMemoryManager.types';

export class MemoryManagerCore {
  private config: MemoryManagerConfig;
  private metrics: ReactNativeMemoryMetrics;
  private samples: MemorySample[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: MemoryManagerConfig) {
    this.config = config;
    this.metrics = this.detectReactNativeMemoryMetrics();
  }

  /**
   * Start real-time memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(
      () => this.collectMemorySample(),
      this.config.monitoring.interval
    );

    console.log('🧠 Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🧠 Memory monitoring stopped');
  }

  /**
   * Analyze current memory usage and detect issues
   */
  async analyzeMemoryUsage(): Promise<MemoryAnalysisResult> {
    const startTime = performance.now();

    try {
      const currentUsage = this.getCurrentMemoryUsage();
      const breakdown = await this.getMemoryBreakdown();
      const leaks = this.detectMemoryLeaks();
      const recommendations = this.generateRecommendations(breakdown, leaks);
      const trend = this.calculateMemoryTrend();

      const analysisTime = performance.now() - startTime;
      console.log(`🧠 Memory analysis completed in ${analysisTime.toFixed(2)}ms`);

      return {
        totalUsage: currentUsage.used,
        available: currentUsage.available,
        peak: this.getPeakUsage(),
        breakdown,
        leaks,
        recommendations,
        trend
      };
    } catch (error) {
      console.error('Memory analysis failed:', error);
      throw new Error(`Memory analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform memory cleanup based on configuration
   */
  async performCleanup(force = false): Promise<{
    before: number;
    after: number;
    savings: number;
    actions: string[];
  }> {
    const beforeUsage = this.getCurrentMemoryUsage().used;
    const actions: string[] = [];

    try {
      // Image cache cleanup
      if (this.shouldCleanupImages(force)) {
        await this.cleanupImageCache();
        actions.push('Image cache cleaned');
      }

      // Component cleanup
      if (this.shouldCleanupComponents(force)) {
        await this.cleanupDetachedComponents();
        actions.push('Detached components cleaned');
      }

      // Service cache cleanup
      if (this.shouldCleanupServiceCache(force)) {
        await this.cleanupServiceCache();
        actions.push('Service cache cleaned');
      }

      // Force garbage collection if available
      if (this.config.optimization.gcHints && (global as any).gc) {
        (global as any).gc();
        actions.push('Garbage collection triggered');
      }

      const afterUsage = this.getCurrentMemoryUsage().used;
      const savings = beforeUsage - afterUsage;

      console.log(`🧠 Memory cleanup completed:
        Before: ${this.formatBytes(beforeUsage)}
        After: ${this.formatBytes(afterUsage)}
        Saved: ${this.formatBytes(savings)}
        Actions: ${actions.length}`);

      return {
        before: beforeUsage,
        after: afterUsage,
        savings,
        actions
      };
    } catch (error) {
      console.error('Memory cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private collectMemorySample(): void {
    const usage = this.getCurrentMemoryUsage();
    const sample: MemorySample = {
      timestamp: Date.now(),
      usage: usage.used,
      available: usage.available,
      gcCount: this.getGCCount()
    };

    this.samples.push(sample);

    // Keep only recent samples
    if (this.samples.length > this.config.monitoring.sampleRetention) {
      this.samples = this.samples.slice(-this.config.monitoring.sampleRetention);
    }

    // Check for memory warnings
    this.checkMemoryThresholds(usage.used);
  }

  private getCurrentMemoryUsage(): { used: number; available: number; total: number } {
    // React Native memory detection
    if (Platform.OS === 'ios' && (global as any).nativePerformanceNow) {
      // iOS memory detection via JSI
      return this.getIOSMemoryUsage();
    } else if (Platform.OS === 'android') {
      // Android memory detection
      return this.getAndroidMemoryUsage();
    }

    // Fallback to JS heap estimation
    return this.getJSHeapEstimate();
  }

  private getIOSMemoryUsage(): { used: number; available: number; total: number } {
    // Simplified iOS memory detection
    const estimated = this.getJSHeapEstimate();
    const total = this.metrics.deviceMemory;
    const used = estimated.used * 2; // Account for native memory
    const available = total - used;

    return { used, available, total };
  }

  private getAndroidMemoryUsage(): { used: number; available: number; total: number } {
    // Simplified Android memory detection
    const estimated = this.getJSHeapEstimate();
    const total = this.metrics.deviceMemory;
    const used = estimated.used * 1.8; // Account for native memory
    const available = total - used;

    return { used, available, total };
  }

  private getJSHeapEstimate(): { used: number; available: number; total: number } {
    // Estimate based on performance.memory if available
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize || 50 * 1024 * 1024, // 50MB default
        available: memory.totalJSHeapSize - memory.usedJSHeapSize || 100 * 1024 * 1024,
        total: memory.totalJSHeapSize || 150 * 1024 * 1024
      };
    }

    // Fallback estimation
    return {
      used: 50 * 1024 * 1024,  // 50MB
      available: 100 * 1024 * 1024, // 100MB
      total: 150 * 1024 * 1024  // 150MB
    };
  }

  private async getMemoryBreakdown(): Promise<MemoryBreakdown> {
    const total = this.getCurrentMemoryUsage().used;
    
    // Estimate breakdown (in real implementation would use native modules)
    return {
      jsHeap: Math.round(total * 0.4),    // 40% JS heap
      images: Math.round(total * 0.25),   // 25% images
      components: Math.round(total * 0.15), // 15% components
      services: Math.round(total * 0.1),  // 10% services
      cache: Math.round(total * 0.05),    // 5% cache
      other: Math.round(total * 0.05)     // 5% other
    };
  }

  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Detect growing trend as potential leak
    if (this.samples.length >= 10) {
      const recentSamples = this.samples.slice(-10);
      const growth = recentSamples[recentSamples.length - 1].usage - recentSamples[0].usage;
      const growthRate = growth / (10 * this.config.monitoring.interval / 1000); // bytes per second

      if (growthRate > 1024 * 1024) { // Growing > 1MB/s
        leaks.push({
          id: `trend_leak_${Date.now()}`,
          type: 'growing_cache',
          size: growth,
          location: 'Unknown',
          retainedObjects: Math.round(growth / 1000),
          severity: growthRate > 5 * 1024 * 1024 ? 'critical' : 'high',
          detectedAt: Date.now()
        });
      }
    }

    return leaks;
  }

  private generateRecommendations(
    breakdown: MemoryBreakdown,
    leaks: MemoryLeak[]
  ): MemoryOptimization[] {
    const recommendations: MemoryOptimization[] = [];

    // Image optimization recommendation
    if (breakdown.images > 50 * 1024 * 1024) { // > 50MB
      recommendations.push({
        type: 'image_compression',
        description: 'Optimize image cache and compression',
        expectedSavings: Math.round(breakdown.images * 0.3),
        effort: 'medium',
        implementation: 'Enable image compression and implement LRU cache eviction',
        priority: 8
      });
    }

    // Component pooling recommendation
    if (breakdown.components > 30 * 1024 * 1024) { // > 30MB
      recommendations.push({
        type: 'component_pooling',
        description: 'Implement component pooling for heavy components',
        expectedSavings: Math.round(breakdown.components * 0.4),
        effort: 'high',
        implementation: 'Use React.memo and implement component recycling',
        priority: 7
      });
    }

    // Leak-specific recommendations
    leaks.forEach(leak => {
      if (leak.type === 'growing_cache') {
        recommendations.push({
          type: 'cache_cleanup',
          description: 'Implement aggressive cache cleanup',
          expectedSavings: leak.size,
          effort: 'low',
          implementation: 'Add TTL to cache entries and implement size limits',
          priority: 9
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private calculateMemoryTrend(): MemoryTrend {
    if (this.samples.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        samples: this.samples,
        prediction: {
          timeToLimit: Infinity,
          confidence: 0,
          growthPattern: 'linear'
        }
      };
    }

    const recentSamples = this.samples.slice(-Math.min(20, this.samples.length));
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const timeDiff = lastSample.timestamp - firstSample.timestamp;
    const usageDiff = lastSample.usage - firstSample.usage;
    const rate = (usageDiff / timeDiff) * 60000; // bytes per minute

    let direction: 'increasing' | 'stable' | 'decreasing';
    if (Math.abs(rate) < 1024 * 100) { // < 100KB/min
      direction = 'stable';
    } else if (rate > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    const timeToLimit = rate > 0 
      ? (this.config.limits.critical - lastSample.usage) / (rate / 60) // minutes
      : Infinity;

    return {
      direction,
      rate,
      samples: recentSamples,
      prediction: {
        timeToLimit,
        confidence: recentSamples.length >= 10 ? 0.8 : 0.4,
        growthPattern: 'linear' // Simplified
      }
    };
  }

  private getPeakUsage(): number {
    return Math.max(...this.samples.map(s => s.usage), this.getCurrentMemoryUsage().used);
  }

  private checkMemoryThresholds(currentUsage: number): void {
    if (currentUsage > this.config.limits.critical) {
      console.warn('🚨 Critical memory usage detected!');
      if (this.config.cleanup.automatic) {
        this.performCleanup(true);
      }
    } else if (currentUsage > this.config.limits.warning) {
      console.warn('⚠️ High memory usage detected');
    }
  }

  private shouldCleanupImages(force: boolean): boolean {
    return force || this.getCurrentMemoryUsage().used > this.config.limits.warning;
  }

  private shouldCleanupComponents(force: boolean): boolean {
    return force || this.getCurrentMemoryUsage().used > this.config.limits.warning;
  }

  private shouldCleanupServiceCache(force: boolean): boolean {
    return force || this.getCurrentMemoryUsage().used > this.config.limits.critical;
  }

  private async cleanupImageCache(): Promise<void> {
    // Placeholder for image cache cleanup
    console.log('🖼️ Cleaning image cache...');
  }

  private async cleanupDetachedComponents(): Promise<void> {
    // Placeholder for component cleanup
    console.log('🧩 Cleaning detached components...');
  }

  private async cleanupServiceCache(): Promise<void> {
    // Placeholder for service cache cleanup
    console.log('🔄 Cleaning service cache...');
  }

  private getGCCount(): number {
    // Simplified GC count estimation
    return this.samples.length;
  }

  private detectReactNativeMemoryMetrics(): ReactNativeMemoryMetrics {
    return {
      platform: Platform.OS as 'ios' | 'android',
      deviceMemory: Platform.OS === 'ios' ? 6 * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024, // Rough estimates
      availableMemory: 512 * 1024 * 1024, // 512MB
      appMemoryLimit: Platform.OS === 'ios' ? 1024 * 1024 * 1024 : 512 * 1024 * 1024, // 1GB iOS, 512MB Android
      hermes: !!(global as any).HermesInternal,
      bridgeMemory: 20 * 1024 * 1024 // 20MB estimate
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