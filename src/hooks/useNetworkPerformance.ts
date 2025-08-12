import { useCallback, useEffect, useState } from 'react';

import type { NetInfoState } from '@react-native-community/netinfo';
import NetInfo from '@react-native-community/netinfo';

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
  /** Current connection type */
  connectionType: string;
  /** Whether currently online */
  isOnline: boolean;
  /** Average request duration in milliseconds */
  averageRequestTime: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Total requests made */
  totalRequests: number;
  /** Network quality score (0-100) */
  networkQuality: number;
  /** Whether network is slow */
  isSlowNetwork: boolean;
  /** Make a monitored network request */
  monitoredFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  /** Reset network metrics */
  reset: () => void;
}

/**
 * Configuration for network performance monitoring
 */
export interface NetworkPerformanceConfig {
  /** Threshold for slow network in milliseconds */
  slowNetworkThreshold?: number;
  /** Number of requests to keep for average calculation */
  requestHistorySize?: number;
  /** Callback for slow network detection */
  onSlowNetwork?: (duration: number) => void;
  /** Callback for network failure */
  onNetworkFailure?: (error: Error) => void;
}

/**
 * Network Performance Monitoring Hook
 *
 * Monitors network requests, connection quality, and provides
 * intelligent fallbacks for poor network conditions.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const {
 *     isOnline,
 *     networkQuality,
 *     monitoredFetch,
 *     isSlowNetwork
 *   } = useNetworkPerformance({
 *     slowNetworkThreshold: 3000,
 *     onSlowNetwork: (time) => console.warn(`Slow network: ${time}ms`),
 *   });
 *
 *   const fetchData = async () => {
 *     try {
 *       const data = await monitoredFetch('/api/data');
 *       return data;
 *     } catch (error) {
 *       // Handle error with network context
 *       if (!isOnline) {
 *         // Show offline message
 *       } else if (isSlowNetwork) {
 *         // Show slow network message
 *       }
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {networkQuality < 50 && <Text>Poor network detected</Text>}
 *     </View>
 *   );
 * };
 * ```
 */
export const useNetworkPerformance = (
  config: NetworkPerformanceConfig = {},
): NetworkMetrics => {
  const {
    slowNetworkThreshold = 3000,
    requestHistorySize = 50,
    onSlowNetwork,
    onNetworkFailure,
  } = config;

  // Network state
  const [connectionType, setConnectionType] = useState('unknown');
  const [isOnline, setIsOnline] = useState(true);
  const [averageRequestTime, setAverageRequestTime] = useState(0);
  const [failedRequests, setFailedRequests] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(100);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  // Request timing history
  const [requestTimes, setRequestTimes] = useState<number[]>([]);

  // Monitor network connection
  useEffect(() => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type || 'unknown');

      // Calculate network quality based on connection type
      let quality = 100;
      switch (state.type) {
        case 'wifi':
          quality = 100;
          break;
        case 'cellular':
          // Estimate quality based on cellular generation
          const generation = (state.details as any)?.cellularGeneration;
          switch (generation) {
            case '5g':
              quality = 95;
              break;
            case '4g':
              quality = 80;
              break;
            case '3g':
              quality = 50;
              break;
            case '2g':
              quality = 20;
              break;
            default:
              quality = 60;
          }
          break;
        case 'ethernet':
          quality = 100;
          break;
        default:
          quality = 0;
      }

      setNetworkQuality(quality);
      setIsSlowNetwork(quality < 50);
    });
  }, []);

  // Calculate average request time
  useEffect(() => {
    if (requestTimes.length > 0) {
      const average =
        requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length;
      setAverageRequestTime(average);

      // Update slow network detection based on actual performance
      const actuallySlowNetwork = average > slowNetworkThreshold;
      setIsSlowNetwork(actuallySlowNetwork || networkQuality < 50);
    }
  }, [requestTimes, slowNetworkThreshold, networkQuality]);

  // Monitored fetch function
  const monitoredFetch = useCallback(
    async <T>(url: string, options: RequestInit = {}): Promise<T> => {
      const startTime = performance.now();

      try {
        setTotalRequests(prev => prev + 1);

        // Add timeout based on network quality
        const timeoutMs = isSlowNetwork ? 30000 : 10000; // 30s for slow, 10s for normal
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions: RequestInit = {
          ...options,
          signal: controller.signal,
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        const duration = performance.now() - startTime;

        // Update request timing history
        setRequestTimes(prev => {
          const newTimes = [...prev, duration];
          return newTimes.slice(-requestHistorySize); // Keep only recent requests
        });

        // Check for slow network
        if (duration > slowNetworkThreshold && onSlowNetwork) {
          onSlowNetwork(duration);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response based on content type
        const contentType = response.headers.get('content-type');
        return contentType?.includes('application/json')
          ? await response.json()
          : ((await response.text()) as unknown as T);
      } catch (error) {
        const duration = performance.now() - startTime;

        setFailedRequests(prev => prev + 1);

        // Still record timing for failed requests (helps detect network issues)
        setRequestTimes(prev => {
          const newTimes = [...prev, duration];
          return newTimes.slice(-requestHistorySize);
        });

        if (onNetworkFailure && error instanceof Error) {
          onNetworkFailure(error);
        }

        throw error;
      }
    },
    [
      isSlowNetwork,
      slowNetworkThreshold,
      requestHistorySize,
      onSlowNetwork,
      onNetworkFailure,
    ],
  );

  // Reset metrics
  const reset = useCallback(() => {
    setAverageRequestTime(0);
    setFailedRequests(0);
    setTotalRequests(0);
    setRequestTimes([]);
  }, []);

  return {
    connectionType,
    isOnline,
    averageRequestTime,
    failedRequests,
    totalRequests,
    networkQuality,
    isSlowNetwork,
    monitoredFetch,
    reset,
  };
};

/**
 * Hook for caching network responses with performance awareness
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { cachedFetch, clearCache } = useNetworkCache({
 *     maxCacheSize: 50,
 *     defaultTTL: 300000, // 5 minutes
 *   });
 *
 *   const fetchUserData = async (userId: string) => {
 *     return await cachedFetch(`/api/users/${userId}`, {
 *       ttl: 600000, // 10 minutes for user data
 *     });
 *   };
 *
 *   return <UserProfile userId="123" />;
 * };
 * ```
 */
export interface NetworkCacheConfig {
  /** Maximum number of cached responses */
  maxCacheSize?: number;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Use cache when offline */
  useOfflineCache?: boolean;
}

export const useNetworkCache = (config: NetworkCacheConfig = {}) => {
  const {
    maxCacheSize = 100,
    defaultTTL = 300000, // 5 minutes
    useOfflineCache = true,
  } = config;

  const [cache, setCache] = useState<
    Map<string, { data: any; timestamp: number; ttl: number }>
  >(new Map());
  const { isOnline, monitoredFetch } = useNetworkPerformance();

  const cachedFetch = useCallback(
    async <T>(
      url: string,
      options: RequestInit & { ttl?: number } = {},
    ): Promise<T> => {
      const { ttl = defaultTTL, ...fetchOptions } = options;
      const cacheKey = `${url}_${JSON.stringify(fetchOptions)}`;
      const now = Date.now();

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && now - cached.timestamp < cached.ttl) {
        return cached.data;
      }

      // If offline and we have cached data, use it regardless of TTL
      if (!isOnline && cached && useOfflineCache) {
        console.warn(`Using stale cache for ${url} (offline)`);
        return cached.data;
      }

      try {
        const data = await monitoredFetch<T>(url, fetchOptions);

        // Update cache
        setCache(prev => {
          const newCache = new Map(prev);

          // Remove oldest entries if cache is full
          if (newCache.size >= maxCacheSize) {
            const oldestKey = [...newCache.keys()][0];
            newCache.delete(oldestKey);
          }

          newCache.set(cacheKey, {
            data,
            timestamp: now,
            ttl,
          });

          return newCache;
        });

        return data;
      } catch (error) {
        // If request fails and we have cached data, use it as fallback
        if (cached && useOfflineCache) {
          console.warn(`Using stale cache for ${url} (request failed)`);
          return cached.data;
        }
        throw error;
      }
    },
    [
      cache,
      defaultTTL,
      isOnline,
      maxCacheSize,
      monitoredFetch,
      useOfflineCache,
    ],
  );

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      maxSize: maxCacheSize,
      keys: [...cache.keys()],
    };
  }, [cache.size, maxCacheSize]);

  return {
    cachedFetch,
    clearCache,
    getCacheStats,
  };
};

export default useNetworkPerformance;
