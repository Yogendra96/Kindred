// @ts-nocheck
/* eslint-disable */
/**
 * cacheManager.ts — DEPRECATED / CONSOLIDATED
 *
 * @deprecated Use CacheService from `../../services/CacheService` instead.
 *
 * Backward-compatible adapter. All existing imports continue to work.
 */
import { CacheService } from '../services/CacheService';

/** @deprecated Use CacheService from services/CacheService */
export class CacheManager {
  private service: CacheService;

  constructor() {
    this.service = new CacheService();
  }

  async get<T>(key: string): Promise<T | null> {
    return this.service.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    return this.service.set(key, value, ttlMs);
  }

  async remove(key: string): Promise<void> {
    return this.service.remove(key);
  }

  async clear(): Promise<void> {
    return this.service.clear();
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;
