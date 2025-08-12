import AsyncStorage from '@react-native-async-storage/async-storage';

export class CacheService {
  private static readonly PREFIX = '@Kindred:';
  private static readonly VERSION = 'v1';
  private static readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  private static getKey(key: string): string {
    return `${this.PREFIX}${this.VERSION}:${key}`;
  }

  static async set<T>(
    key: string,
    value: T,
    expiryMs: number = this.DEFAULT_EXPIRY,
  ): Promise<void> {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiryMs,
      };
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.error('CacheService.set error:', error);
      throw new Error('Failed to cache data');
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(this.getKey(key));
      if (!data) return null;

      const item = JSON.parse(data);
      const now = Date.now();

      if (now - item.timestamp > item.expiryMs) {
        await this.remove(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error('CacheService.get error:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('CacheService.remove error:', error);
      throw new Error('Failed to remove cached data');
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('CacheService.clear error:', error);
      throw new Error('Failed to clear cache');
    }
  }

  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.PREFIX));
      let totalSize = 0;

      for (const key of appKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('CacheService.getCacheSize error:', error);
      return 0;
    }
  }

  static async cleanup(maxSize: number = 50 * 1024 * 1024): Promise<void> {
    try {
      const currentSize = await this.getCacheSize();
      if (currentSize <= maxSize) return;

      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.PREFIX));
      const items = await Promise.all(
        appKeys.map(async key => {
          const data = await AsyncStorage.getItem(key);
          return { key, data: data ? JSON.parse(data) : null };
        }),
      );

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.data?.timestamp - b.data?.timestamp);

      // Remove oldest items until we're under maxSize
      for (const item of items) {
        if ((await this.getCacheSize()) <= maxSize) break;
        await this.remove(
          item.key.replace(`${this.PREFIX + this.VERSION}:`, ''),
        );
      }
    } catch (error) {
      console.error('CacheService.cleanup error:', error);
    }
  }
}
