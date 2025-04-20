import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  static async set<T>(config: CacheConfig, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(config.key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  static async get<T>(config: CacheConfig): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(config.key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache has expired
      if (config.ttl && Date.now() - entry.timestamp > config.ttl) {
        await AsyncStorage.removeItem(config.key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  static async getWithNetwork<T>(
    config: CacheConfig,
    fetchData: () => Promise<T>
  ): Promise<T | null> {
    try {
      // Check network status
      const networkState = await NetInfo.fetch();
      
      if (networkState.isConnected) {
        // If online, fetch fresh data
        const data = await fetchData();
        await this.set(config, data);
        return data;
      }

      // If offline, return cached data
      return await this.get<T>(config);
    } catch (error) {
      console.error('Error in getWithNetwork:', error);
      // Fallback to cache on error
      return await this.get<T>(config);
    }
  }
}

export default CacheManager;