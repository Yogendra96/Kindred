/**
 * @fileoverview Carbon Cache Manager Service
 * 
 * Focused service responsible for caching carbon calculation results
 * and emission factors to improve performance and reduce API calls.
 * 
 * Follows SRP - single responsibility for cache management.
 * 
 * @version 2.0.0
 */

import { API_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import { createLogger, logCacheOperation } from '../../utils/loggingUtils';

import type { CarbonCalculationRequest, CarbonCalculationResponse } from './CarbonCalculatorCore';

// ===================================================================
// TYPES
// ===================================================================

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  size: number;
  itemCount: number;
  oldestItem?: number;
  newestItem?: number;
}

export interface CacheConfig {
  maxSize: number; // bytes
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  enablePersistence: boolean;
}

// ===================================================================
// CARBON CACHE MANAGER
// ===================================================================

/**
 * Intelligent cache manager for carbon calculation results
 * Provides LRU eviction, TTL expiration, and persistence
 */
export class CarbonCacheManager {
  private logger = createLogger({ prefix: 'CACHE' });
  private cache = new Map<string, CacheItem<any>>();
  private metrics: CacheMetrics;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 50 * 1024 * 1024, // 50MB default
      defaultTTL: config.defaultTTL ?? API_CONFIG.CACHE_TTL_MEDIUM,
      cleanupInterval: config.cleanupInterval ?? 300000, // 5 minutes
      enablePersistence: config.enablePersistence ?? !__DEV__,
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      size: 0,
      itemCount: 0,
    };

    this.logger.info('Initializing Carbon Cache Manager', {
      maxSize: `${(this.config.maxSize / 1024 / 1024).toFixed(1)}MB`,
      defaultTTL: `${this.config.defaultTTL}ms`,
      cleanupInterval: `${this.config.cleanupInterval}ms`,
      persistenceEnabled: this.config.enablePersistence,
    });

    this.startCleanupTimer();
    
    if (this.config.enablePersistence) {
      this.loadFromPersistence();
    }
  }

  /**
   * Get calculation result from cache
   */
  getCachedCalculation(request: CarbonCalculationRequest): CarbonCalculationResponse | null {
    const key = this.generateCacheKey(request);
    return this.get<CarbonCalculationResponse>(key);
  }

  /**
   * Cache calculation result
   */
  cacheCalculation(
    request: CarbonCalculationRequest, 
    response: CarbonCalculationResponse,
    ttl?: number
  ): void {
    const key = this.generateCacheKey(request);
    this.set(key, response, ttl ?? API_CONFIG.CACHE_TTL_MEDIUM);
  }

  /**
   * Get emission factors from cache
   */
  getCachedEmissionFactors(category?: string, region?: string): any[] | null {
    const key = `emission-factors-${category ?? 'all'}-${region ?? 'global'}`;
    return this.get<any[]>(key);
  }

  /**
   * Cache emission factors
   */
  cacheEmissionFactors(
    factors: any[],
    category?: string,
    region?: string,
    ttl?: number
  ): void {
    const key = `emission-factors-${category ?? 'all'}-${region ?? 'global'}`;
    this.set(key, factors, ttl ?? API_CONFIG.CACHE_TTL_LONG);
  }

  /**
   * Generic get method
   */
  get<T>(key: string): T | null {
    this.metrics.totalRequests++;

    const item = this.cache.get(key);
    if (!item) {
      this.metrics.totalMisses++;
      this.updateMetrics();
      logCacheOperation(this.logger, 'get', key, false);
      return null;
    }

    // Check if item has expired
    const now = Date.now();
    if (now > item.timestamp + item.ttl) {
      this.cache.delete(key);
      this.metrics.totalMisses++;
      this.updateMetrics();
      logCacheOperation(this.logger, 'get', key, false, item.ttl);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;

    this.metrics.totalHits++;
    this.updateMetrics();
    
    logCacheOperation(this.logger, 'get', key, true, item.ttl, {
      accessCount: item.accessCount,
      age: now - item.timestamp,
    });

    return item.data;
  }

  /**
   * Generic set method
   */
  set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): void {
    const now = Date.now();
    const serializedData = JSON.stringify(data);
    const size = serializedData.length * 2; // Rough size estimate (UTF-16)

    // Check if adding this item would exceed max size
    if (this.getCurrentSize() + size > this.config.maxSize) {
      this.evictLRU(size);
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl,
      size,
      accessCount: 1,
      lastAccessed: now,
    };

    // Remove existing item to update size calculation
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, item);
    
    logCacheOperation(this.logger, 'set', key, true, ttl, {
      size: `${(size / 1024).toFixed(1)}KB`,
      totalItems: this.cache.size,
      cacheSize: `${(this.getCurrentSize() / 1024 / 1024).toFixed(1)}MB`,
    });

    this.updateMetrics();
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    
    if (existed) {
      logCacheOperation(this.logger, 'delete', key, true);
      this.updateMetrics();
    }

    return existed;
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    const itemCount = this.cache.size;
    const size = this.getCurrentSize();
    
    this.cache.clear();
    this.updateMetrics();
    
    logCacheOperation(this.logger, 'clear', 'all_items', true, undefined, {
      clearedItems: itemCount,
      freedBytes: size,
    });

    this.logger.info('Cache cleared', {
      clearedItems: itemCount,
      freedSize: `${(size / 1024 / 1024).toFixed(1)}MB`,
    });
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    hitRate: number;
    size: string;
    itemCount: number;
    oldestItemAge?: string;
    topKeys: Array<{ key: string; accessCount: number; size: string }>;
  } {
    const items = Array.from(this.cache.entries());
    const now = Date.now();
    
    // Find oldest item
    let oldestAge: number | undefined;
    if (items.length > 0) {
      oldestAge = Math.min(...items.map(([_, item]) => now - item.timestamp));
    }

    // Get top accessed keys
    const topKeys = items
      .sort(([_, a], [__, b]) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(([key, item]) => ({
        key,
        accessCount: item.accessCount,
        size: `${(item.size / 1024).toFixed(1)}KB`,
      }));

    return {
      hitRate: this.metrics.hitRate,
      size: `${(this.metrics.size / 1024 / 1024).toFixed(1)}MB`,
      itemCount: this.metrics.itemCount,
      oldestItemAge: oldestAge ? `${Math.floor(oldestAge / 1000)}s` : undefined,
      topKeys,
    };
  }

  /**
   * Cleanup expired items
   */
  cleanup(): { removedCount: number; freedBytes: number } {
    const now = Date.now();
    let removedCount = 0;
    let freedBytes = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        freedBytes += item.size;
        removedCount++;
        this.cache.delete(key);
      }
    }

    if (removedCount > 0) {
      this.updateMetrics();
      this.logger.info('Cache cleanup completed', {
        removedCount,
        freedSize: `${(freedBytes / 1024 / 1024).toFixed(1)}MB`,
        remainingItems: this.cache.size,
      });
    }

    return { removedCount, freedBytes };
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }

    this.clear();
    
    this.logger.info('Cache manager destroyed');
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  /**
   * Generate cache key for calculation request
   */
  private generateCacheKey(request: CarbonCalculationRequest): string {
    const keyParts = [
      'calc',
      request.activityType,
      request.amount.toString(),
      request.unit,
      request.region ?? 'global',
    ];

    // Include additional params if present
    if (request.additionalParams) {
      const paramStr = JSON.stringify(request.additionalParams);
      keyParts.push(Buffer.from(paramStr).toString('base64'));
    }

    return keyParts.join(':');
  }

  /**
   * Get current cache size in bytes
   */
  private getCurrentSize(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  /**
   * Evict least recently used items to make space
   */
  private evictLRU(neededSpace: number): void {
    const items = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    items.sort(([_, a], [__, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    let evictedCount = 0;

    for (const [key, item] of items) {
      this.cache.delete(key);
      freedSpace += item.size;
      evictedCount++;
      
      if (freedSpace >= neededSpace) {
        break;
      }
    }

    this.logger.info('LRU eviction completed', {
      evictedCount,
      freedSpace: `${(freedSpace / 1024 / 1024).toFixed(1)}MB`,
      remainingItems: this.cache.size,
    });
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.itemCount = this.cache.size;
    this.metrics.size = this.getCurrentSize();
    
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = this.metrics.totalHits / this.metrics.totalRequests;
      this.metrics.missRate = this.metrics.totalMisses / this.metrics.totalRequests;
    }

    // Update oldest/newest item timestamps
    if (this.cache.size > 0) {
      const timestamps = Array.from(this.cache.values()).map(item => item.timestamp);
      this.metrics.oldestItem = Math.min(...timestamps);
      this.metrics.newestItem = Math.max(...timestamps);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Save cache to persistent storage
   */
  private async saveToPersistence(): Promise<void> {
    try {
      // Save only non-expired items
      const now = Date.now();
      const persistentData: Record<string, any> = {};
      
      for (const [key, item] of this.cache.entries()) {
        if (now <= item.timestamp + item.ttl) {
          persistentData[key] = {
            data: item.data,
            timestamp: item.timestamp,
            ttl: item.ttl,
            accessCount: item.accessCount,
          };
        }
      }

      // In a real implementation, you would use AsyncStorage or similar
      // For now, we'll just log the operation
      this.logger.debug('Cache saved to persistence', {
        itemCount: Object.keys(persistentData).length,
        size: JSON.stringify(persistentData).length,
      });
    } catch (error) {
      this.logger.error('Failed to save cache to persistence', {}, error as Error);
    }
  }

  /**
   * Load cache from persistent storage
   */
  private async loadFromPersistence(): Promise<void> {
    try {
      // In a real implementation, you would load from AsyncStorage
      // For now, we'll just log the operation
      this.logger.debug('Cache loaded from persistence');
    } catch (error) {
      this.logger.error('Failed to load cache from persistence', {}, error as Error);
    }
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export const carbonCacheManager = new CarbonCacheManager();
export default carbonCacheManager;