/**
 * 🌐 Network Performance Optimizer - Complete Service
 * Following KISS principle: Focused network optimization for React Native
 * File size target: 250-300 lines max
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { observabilityService } from './ObservabilityService';
import type {
  NetworkAnalysisResult,
  NetworkOptimizerConfig,
  RequestMetrics,
  NetworkOptimization,
  ConnectionQuality,
  CacheEfficiency,
  MobileNetworkConstraints,
  NetworkPerformanceMetrics
} from './NetworkPerformanceOptimizer.types';

/**
 * Network Performance Optimizer Service
 * Provides intelligent network optimization for mobile apps
 */
class NetworkPerformanceOptimizerService {
  private config: NetworkOptimizerConfig;
  private requestHistory: RequestMetrics[] = [];
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private isMonitoring = false;
  private connectionQuality: ConnectionQuality | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeNetworkMonitoring();
  }

  /**
   * Optimize network request with intelligent caching and batching
   */
  async optimizeRequest(
    url: string,
    options: RequestInit & { priority?: 'critical' | 'high' | 'medium' | 'low' } = {}
  ): Promise<Response> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();

    try {
      // Check cache first
      if (this.shouldUseCache(url, options.method || 'GET')) {
        const cached = this.getCachedResponse(url);
        if (cached) {
          await this.trackRequest(url, options.method || 'GET', performance.now() - startTime, 0, 200, true);
          return new Response(JSON.stringify(cached.data), {
            status: 200,
            headers: { 'X-Cache': 'HIT' }
          });
        }
      }

      // Apply compression headers
      const optimizedOptions = this.applyOptimizations(options);
      
      // Perform request with retry logic
      const response = await this.performRequestWithRetry(url, optimizedOptions);
      
      // Cache successful responses
      if (response.ok && this.shouldCache(url, options.method || 'GET')) {
        const data = await response.clone().json().catch(() => null);
        if (data) {
          this.cacheResponse(url, data, response.headers.get('content-length') || '0');
        }
      }

      const responseTime = performance.now() - startTime;
      const size = parseInt(response.headers.get('content-length') || '0');
      
      await this.trackRequest(url, options.method || 'GET', responseTime, size, response.status, false);

      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      await this.trackRequest(url, options.method || 'GET', responseTime, 0, 0, false, 1);
      throw error;
    }
  }

  /**
   * Analyze current network performance
   */
  async analyzeNetworkPerformance(): Promise<NetworkAnalysisResult> {
    const startTime = performance.now();

    try {
      const recentRequests = this.getRecentRequests();
      const metrics = this.calculateMetrics(recentRequests);
      const optimizations = this.generateOptimizationSuggestions(metrics, recentRequests);
      const cacheEfficiency = this.calculateCacheEfficiency();
      
      const connectionQuality = this.connectionQuality || await this.detectConnectionQuality();

      const analysisTime = performance.now() - startTime;

      await observabilityService.trackMetric('network_analysis_completed', {
        duration: analysisTime,
        averageLatency: metrics.averageLatency,
        throughput: metrics.throughput,
        errorRate: metrics.errorRate,
        cacheHitRate: metrics.cacheHitRate
      });

      console.log(`🌐 Network Analysis:
        Avg Latency: ${metrics.averageLatency.toFixed(0)}ms
        Throughput: ${this.formatBytes(metrics.throughput)}/s
        Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%
        Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);

      return {
        latency: metrics.averageLatency,
        throughput: metrics.throughput,
        reliability: 1 - metrics.errorRate,
        requestMetrics: recentRequests,
        optimizations,
        cacheEfficiency,
        connectionQuality
      };
    } catch (error) {
      await observabilityService.trackError('network_analysis_failed', error as Error);
      throw error;
    }
  }

  /**
   * Get network optimization recommendations
   */
  getOptimizationRecommendations(): NetworkOptimization[] {
    const recentRequests = this.getRecentRequests();
    const metrics = this.calculateMetrics(recentRequests);
    return this.generateOptimizationSuggestions(metrics, recentRequests);
  }

  /**
   * Clear network cache
   */
  async clearCache(): Promise<{ clearedItems: number; freedBytes: number }> {
    const clearedItems = this.cache.size;
    const freedBytes = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);

    this.cache.clear();

    await observabilityService.trackMetric('network_cache_cleared', {
      clearedItems,
      freedBytes
    });

    return { clearedItems, freedBytes };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheEfficiency {
    return this.calculateCacheEfficiency();
  }

  /**
   * Private helper methods
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Monitor network state changes
      NetInfo.addEventListener(state => {
        this.updateConnectionQuality(state);
      });

      this.isMonitoring = true;
    } catch (error) {
      console.warn('Network monitoring initialization failed:', error);
    }
  }

  private updateConnectionQuality(state: any): void {
    this.connectionQuality = {
      type: this.mapConnectionType(state.type),
      strength: state.details?.strength || 1,
      bandwidth: this.estimateBandwidth(state.type, state.details),
      packetLoss: 0, // Would need native implementation
      jitter: 0 // Would need native implementation
    };
  }

  private mapConnectionType(type: string): any {
    const mapping: Record<string, any> = {
      'wifi': 'wifi',
      'cellular': 'cellular_4g', // Default assumption
      'ethernet': 'ethernet',
      'other': 'unknown',
      'none': 'unknown'
    };
    return mapping[type] || 'unknown';
  }

  private estimateBandwidth(type: string, _details: any): number {
    // Rough bandwidth estimates in bytes per second
    const bandwidthMap: Record<string, number> = {
      'wifi': 50 * 1024 * 1024, // 50 Mbps
      'cellular': 20 * 1024 * 1024, // 20 Mbps
      'ethernet': 100 * 1024 * 1024, // 100 Mbps
      'other': 5 * 1024 * 1024, // 5 Mbps
      'none': 0
    };

    return bandwidthMap[type] || 10 * 1024 * 1024;
  }

  private shouldUseCache(url: string, method: string): boolean {
    return this.config.caching.enabled && method === 'GET';
  }

  private shouldCache(url: string, method: string): boolean {
    return this.config.caching.enabled && method === 'GET' && !url.includes('no-cache');
  }

  private getCachedResponse(url: string): any {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.caching.ttl) {
      this.cache.delete(url);
      return null;
    }

    return cached;
  }

  private cacheResponse(url: string, data: any, contentLength: string): void {
    const size = parseInt(contentLength) || JSON.stringify(data).length;
    
    // Check cache size limit
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);
    
    if (currentSize + size > this.config.caching.maxSize) {
      this.evictOldestEntries(size);
    }

    this.cache.set(url, {
      data,
      timestamp: Date.now(),
      size
    });
  }

  private evictOldestEntries(neededSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedSpace = 0;
    for (const [key, value] of entries) {
      this.cache.delete(key);
      freedSpace += value.size;
      if (freedSpace >= neededSpace) break;
    }
  }

  private applyOptimizations(options: RequestInit): RequestInit {
    const headers = new Headers(options.headers);
    
    // Add compression headers
    if (this.config.compression.enabled) {
      headers.set('Accept-Encoding', 'gzip, deflate');
    }

    // Add cache control headers
    if (this.config.caching.enabled) {
      headers.set('Cache-Control', `max-age=${this.config.caching.ttl / 1000}`);
    }

    return { ...options, headers };
  }

  private async performRequestWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.ok || !this.shouldRetry(response.status)) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retry.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private shouldRetry(statusCode: number): boolean {
    const retryableStatus = [408, 429, 500, 502, 503, 504];
    return retryableStatus.includes(statusCode);
  }

  private calculateRetryDelay(attempt: number): number {
    const { backoffStrategy, initialDelay, maxDelay } = this.config.retry;
    
    let delay: number;
    switch (backoffStrategy) {
      case 'exponential':
        delay = initialDelay * Math.pow(2, attempt);
        break;
      case 'linear':
        delay = initialDelay * (attempt + 1);
        break;
      default:
        delay = initialDelay;
    }
    
    return Math.min(delay, maxDelay);
  }

  private async trackRequest(
    url: string,
    method: string,
    responseTime: number,
    size: number,
    statusCode: number,
    fromCache: boolean,
    retries = 0
  ): Promise<void> {
    const metrics: RequestMetrics = {
      url,
      method: method as any,
      responseTime,
      size,
      statusCode,
      fromCache,
      retries,
      timestamp: Date.now()
    };

    this.requestHistory.push(metrics);

    // Keep only recent requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-500);
    }

    await observabilityService.trackMetric('network_request', metrics);
  }

  private getRecentRequests(): RequestMetrics[] {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return this.requestHistory.filter(req => req.timestamp > oneHourAgo);
  }

  private calculateMetrics(requests: RequestMetrics[]): NetworkPerformanceMetrics {
    if (requests.length === 0) {
      return {
        averageLatency: 0,
        p95Latency: 0,
        errorRate: 0,
        throughput: 0,
        cacheHitRate: 0,
        dataUsage: 0,
        requestCount: 0
      };
    }

    const latencies = requests.map(r => r.responseTime).sort((a, b) => a - b);
    const errors = requests.filter(r => r.statusCode >= 400 || r.statusCode === 0);
    const cacheHits = requests.filter(r => r.fromCache);
    const totalBytes = requests.reduce((sum, r) => sum + r.size, 0);
    const totalTime = requests[requests.length - 1].timestamp - requests[0].timestamp;

    return {
      averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      errorRate: errors.length / requests.length,
      throughput: totalTime > 0 ? totalBytes / (totalTime / 1000) : 0,
      cacheHitRate: cacheHits.length / requests.length,
      dataUsage: totalBytes,
      requestCount: requests.length
    };
  }

  private generateOptimizationSuggestions(
    metrics: NetworkPerformanceMetrics,
    requests: RequestMetrics[]
  ): NetworkOptimization[] {
    const suggestions: NetworkOptimization[] = [];

    // Cache optimization
    if (metrics.cacheHitRate < 0.3) {
      suggestions.push({
        type: 'caching',
        description: 'Improve caching strategy for better performance',
        expectedImprovement: 40,
        effort: 'medium',
        implementation: 'Increase cache TTL and implement smarter cache invalidation',
        priority: 8
      });
    }

    // Compression optimization
    const uncompressedRequests = requests.filter(r => r.size > 1024 && !r.fromCache);
    if (uncompressedRequests.length > requests.length * 0.5) {
      suggestions.push({
        type: 'compression',
        description: 'Enable compression for large requests',
        expectedImprovement: 60,
        effort: 'low',
        implementation: 'Enable gzip/brotli compression for responses > 1KB',
        priority: 9
      });
    }

    // Latency optimization
    if (metrics.averageLatency > 1000) {
      suggestions.push({
        type: 'connection_pooling',
        description: 'Implement connection pooling to reduce latency',
        expectedImprovement: 30,
        effort: 'medium',
        implementation: 'Use HTTP/2 and connection keep-alive',
        priority: 7
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private calculateCacheEfficiency(): CacheEfficiency {
    const recentRequests = this.getRecentRequests();
    const cacheHits = recentRequests.filter(r => r.fromCache);
    const totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);

    return {
      hitRate: recentRequests.length > 0 ? cacheHits.length / recentRequests.length : 0,
      missCount: recentRequests.length - cacheHits.length,
      totalRequests: recentRequests.length,
      cacheSize: totalSize,
      evictions: 0 // Would need to track this
    };
  }

  private async detectConnectionQuality(): Promise<ConnectionQuality> {
    try {
      const state = await NetInfo.fetch();
      this.updateConnectionQuality(state);
      return this.connectionQuality!;
    } catch (error) {
      return {
        type: 'unknown',
        strength: 0.5,
        bandwidth: 10 * 1024 * 1024,
        packetLoss: 0,
        jitter: 0
      };
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private getDefaultConfig(): NetworkOptimizerConfig {
    return {
      caching: {
        enabled: true,
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: 'lru',
        compression: true,
        persistToDisk: !__DEV__
      },
      retry: {
        enabled: true,
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000,
        retryConditions: [
          { statusCodes: [408, 429, 500, 502, 503, 504], errorTypes: ['network'], networkErrors: true }
        ]
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        minSize: 1024
      },
      batching: {
        enabled: false, // Complex to implement safely
        maxBatchSize: 10,
        maxWaitTime: 100,
        batchableEndpoints: []
      },
      monitoring: {
        trackPerformance: true,
        sampleRate: 1.0,
        alertThresholds: {
          maxLatency: 3000,
          minThroughput: 1024 * 1024,
          maxErrorRate: 0.05,
          minCacheHitRate: 0.3
        },
        retentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
      },
      optimization: {
        adaptiveCaching: true,
        dynamicRetry: true,
        intelligentBatching: false,
        networkAwareRequests: true
      }
    };
  }
}

// Export singleton instance
export const networkPerformanceOptimizer = new NetworkPerformanceOptimizerService();
export default networkPerformanceOptimizer;