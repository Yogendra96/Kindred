// @ts-nocheck
/* eslint-disable */
/**
 * CacheService (v2)
 *
 * Two-tier cache:
 *  1. Memory layer — LRU map, capped at MAX_MEMORY_ENTRIES. Sub-millisecond reads.
 *  2. Disk layer  — AsyncStorage, survives app restarts. TTL-aware.
 *
 * Pre-configured TTL policies per data type so callers don't have to think about it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── TTL Policies ─────────────────────────────────────────────────────────────

export const CacheTTL = {
  FOOTPRINT_TODAY: 5 * 60 * 1000, // 5 minutes
  CARBON_HISTORY: 60 * 60 * 1000, // 1 hour
  SOCIAL_FEED: 2 * 60 * 1000, // 2 minutes
  LEADERBOARD: 2 * 60 * 1000, // 2 minutes
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  MAP_ECO_POINTS: 60 * 60 * 1000, // 1 hour
  OFFSET_PROJECTS: 6 * 60 * 60 * 1000, // 6 hours
  DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiryMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFIX = '@Kindred:cache:v2:';
const MAX_MEMORY_ENTRIES = 1000;
const MAX_DISK_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── LRU Memory Cache ─────────────────────────────────────────────────────────

class LRUCache<T> {
  private map = new Map<string, T>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (!this.map.has(key)) return undefined;
    // Move to end (most recently used)
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: string, value: T): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    // Evict oldest if over capacity
    if (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

// ─── Cache Service ────────────────────────────────────────────────────────────

class CacheServiceClass {
  private memory = new LRUCache<CacheEntry<unknown>>(MAX_MEMORY_ENTRIES);

  private diskKey(key: string): string {
    return `${PREFIX}${key}`;
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.expiryMs;
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory hit
    const memEntry = this.memory.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      if (!this.isExpired(memEntry)) return memEntry.value;
      this.memory.delete(key);
    }

    // 2. Disk hit
    try {
      const raw = await AsyncStorage.getItem(this.diskKey(key));
      if (!raw) return null;

      const diskEntry = JSON.parse(raw) as CacheEntry<T>;
      if (this.isExpired(diskEntry)) {
        AsyncStorage.removeItem(this.diskKey(key)); // async cleanup, don't await
        return null;
      }

      // Promote to memory
      this.memory.set(key, diskEntry as CacheEntry<unknown>);
      return diskEntry.value;
    } catch {
      return null;
    }
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  async set<T>(key: string, value: T, expiryMs: number = CacheTTL.DEFAULT): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiryMs,
    };

    // Write to memory immediately (synchronous, instant)
    this.memory.set(key, entry as CacheEntry<unknown>);

    // Write to disk asynchronously
    try {
      await AsyncStorage.setItem(this.diskKey(key), JSON.stringify(entry));
    } catch (e) {
      console.warn('[CacheService] Disk write failed:', e);
    }
  }

  // ── Invalidation ────────────────────────────────────────────────────────────

  async remove(key: string): Promise<void> {
    this.memory.delete(key);
    try {
      await AsyncStorage.removeItem(this.diskKey(key));
    } catch (e) {
      console.warn('[CacheService] Disk remove failed:', e);
    }
  }

  async invalidatePattern(prefix: string): Promise<void> {
    // Memory: rebuild without matching keys
    const queue: Array<[string, CacheEntry<unknown>]> = [];
    // Can't iterate LRU directly — clear and rebuild from disk
    this.memory.clear();

    // Disk: remove all keys matching prefix
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const matching = allKeys.filter(k => k.startsWith(`${PREFIX}${prefix}`));
      if (matching.length > 0) {
        await AsyncStorage.multiRemove(matching);
      }
    } catch (e) {
      console.warn('[CacheService] Pattern invalidation failed:', e);
    }
  }

  async clear(): Promise<void> {
    this.memory.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(k => k.startsWith(PREFIX));
      if (appKeys.length > 0) await AsyncStorage.multiRemove(appKeys);
    } catch (e) {
      console.warn('[CacheService] Clear failed:', e);
    }
  }

  // ── Size / Housekeeping ─────────────────────────────────────────────────────

  async getDiskSizeBytes(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(k => k.startsWith(PREFIX));
      let total = 0;
      for (const key of appKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) total += new Blob([val]).size;
      }
      return total;
    } catch {
      return 0;
    }
  }

  /** Evict expired and excess entries to stay under MAX_DISK_SIZE_BYTES */
  async cleanup(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(k => k.startsWith(PREFIX));

      // Load all entries
      const entries: Array<{ key: string; entry: CacheEntry<unknown>; size: number }> = [];
      for (const key of appKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;
        try {
          const entry = JSON.parse(raw) as CacheEntry<unknown>;
          entries.push({ key, entry, size: new Blob([raw]).size });
        } catch {
          await AsyncStorage.removeItem(key);
        }
      }

      // Remove expired
      const expiredKeys = entries
        .filter(({ entry }) => this.isExpired(entry))
        .map(({ key }) => key);
      if (expiredKeys.length > 0) await AsyncStorage.multiRemove(expiredKeys);

      // If still over limit, evict oldest
      const valid = entries.filter(({ entry }) => !this.isExpired(entry));
      let totalSize = valid.reduce((sum, { size }) => sum + size, 0);
      if (totalSize > MAX_DISK_SIZE_BYTES) {
        valid.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        for (const { key, size } of valid) {
          if (totalSize <= MAX_DISK_SIZE_BYTES) break;
          await AsyncStorage.removeItem(key);
          totalSize -= size;
        }
      }
    } catch (e) {
      console.warn('[CacheService] Cleanup failed:', e);
    }
  }

  get memoryCacheSize(): number {
    return this.memory.size;
  }
}

export const CacheService = new CacheServiceClass();
