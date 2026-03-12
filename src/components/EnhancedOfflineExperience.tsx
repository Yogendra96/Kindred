/* global NodeJS */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import type { NetInfoState } from '@react-native-community/netinfo';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';

const { width: _screenWidth } = Dimensions.get('window');

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  endpoint?: string;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
  synced: boolean;
}

interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  strength: 'poor' | 'fair' | 'good' | 'excellent' | null;
  speed: number | null;
}

interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  currentItem?: string;
}

interface OfflineContextType {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  offlineQueue: OfflineData[];
  syncProgress: SyncProgress;
  addToOfflineQueue: (
    data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount' | 'synced'>,
  ) => void;
  removeFromOfflineQueue: (id: string) => void;
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => void;
  getOfflineData: (type: string) => OfflineData[];
  isDataAvailableOffline: (type: string, id?: string) => boolean;
  getCachedData: (key: string) => Promise<any>;
  setCachedData: (key: string, data: any, ttl?: number) => Promise<void>;
  clearExpiredCache: () => Promise<void>;
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

const defaultNetworkStatus: NetworkStatus = {
  isConnected: false,
  type: null,
  isInternetReachable: null,
  strength: null,
  speed: null,
};

const defaultSyncProgress: SyncProgress = {
  total: 0,
  completed: 0,
  failed: 0,
  inProgress: false,
};

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: React.ReactNode;
  enableAutoSync?: boolean;
  syncInterval?: number;
  maxQueueSize?: number;
  defaultCacheTTL?: number;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  enableAutoSync = true,
  syncInterval = 30000, // 30 seconds
  maxQueueSize = 100,
  defaultCacheTTL = 3600000, // 1 hour
}) => {
  const [networkStatus, setNetworkStatus] =
    useState<NetworkStatus>(defaultNetworkStatus);
  const [offlineQueue, setOfflineQueue] = useState<OfflineData[]>([]);
  const [syncProgress, setSyncProgress] =
    useState<SyncProgress>(defaultSyncProgress);
  const [cache, setCache] = useState<Map<string, CacheItem>>(new Map());

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);

  useEffect(() => {
    initializeOfflineSystem();
    setupNetworkListener();
    loadOfflineQueue();
    loadCache();

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (networkStatus.isConnected && enableAutoSync) {
      setupAutoSync();
    } else {
      clearAutoSync();
    }
  }, [networkStatus.isConnected, enableAutoSync]);

  const initializeOfflineSystem = async () => {
    try {
      // Clear expired cache on startup
      await clearExpiredCache();
    } catch (error) {
      console.error('Error initializing offline system:', error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        strength: getConnectionStrength(state),
        speed: getConnectionSpeed(state),
      };

      const wasOffline = !networkStatus.isConnected;
      const isNowOnline = newStatus.isConnected;

      setNetworkStatus(newStatus);

      // Trigger haptic feedback on connection change
      if (wasOffline && isNowOnline) {
        HapticFeedbackService.triggerSuccess();
        // Auto-sync when coming back online
        if (enableAutoSync) {
          setTimeout(() => syncOfflineData(), 1000);
        }
      } else if (!wasOffline && !isNowOnline) {
        HapticFeedbackService.triggerWarning();
      }
    });

    return unsubscribe;
  };

  const getConnectionStrength = (
    state: NetInfoState,
  ): NetworkStatus['strength'] => {
    if (!state.isConnected) return null;

    if (state.type === 'wifi') {
      const details = state.details as any;
      if (details?.strength !== undefined) {
        if (details.strength > 75) return 'excellent';
        if (details.strength > 50) return 'good';
        if (details.strength > 25) return 'fair';
        return 'poor';
      }
    } else if (state.type === 'cellular') {
      const details = state.details as any;
      if (details?.cellularGeneration) {
        if (details.cellularGeneration === '5g') return 'excellent';
        if (details.cellularGeneration === '4g') return 'good';
        if (details.cellularGeneration === '3g') return 'fair';
        return 'poor';
      }
    }

    return 'good'; // Default assumption
  };

  const getConnectionSpeed = (state: NetInfoState): number | null => {
    if (!state.isConnected) return null;

    // This would typically be measured through actual network tests
    // For now, we'll estimate based on connection type
    switch (state.type) {
      case 'wifi':
        return 50; // Mbps estimate
      case 'cellular': {
        const details = state.details as any;
        if (details?.cellularGeneration === '5g') return 100;
        if (details?.cellularGeneration === '4g') return 25;
        if (details?.cellularGeneration === '3g') return 5;
        return 1;
      }
      default:
        return 10;
    }
  };

  const setupAutoSync = () => {
    clearAutoSync();
    syncIntervalRef.current = setInterval(() => {
      if (offlineQueue.length > 0) {
        syncOfflineData();
      }
    }, syncInterval);
  };

  const clearAutoSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  const loadOfflineQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        const queue = JSON.parse(stored);
        setOfflineQueue(queue.slice(0, maxQueueSize));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const saveOfflineQueue = async (queue: OfflineData[]) => {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  };

  const loadCache = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        const cacheMap = new Map<string, CacheItem>();
        Object.entries(cacheData).forEach(([key, value]) => {
          cacheMap.set(key, value as CacheItem);
        });
        setCache(cacheMap);
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  };

  const saveCache = async (cacheMap: Map<string, CacheItem>) => {
    try {
      const cacheData = Object.fromEntries(cacheMap);
      await AsyncStorage.setItem('offline_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const addToOfflineQueue = useCallback(
    (data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount' | 'synced'>) => {
      const newItem: OfflineData = {
        ...data,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false,
      };

      setOfflineQueue(prev => {
        const updated = [newItem, ...prev].slice(0, maxQueueSize);
        saveOfflineQueue(updated);
        return updated;
      });

      // Trigger haptic feedback
      HapticFeedbackService.triggerSelection();
    },
    [maxQueueSize],
  );

  const removeFromOfflineQueue = useCallback((id: string) => {
    setOfflineQueue(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveOfflineQueue(updated);
      return updated;
    });
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!networkStatus.isConnected || syncProgress.inProgress) {
      return;
    }

    const itemsToSync = offlineQueue.filter(item => !item.synced);
    if (itemsToSync.length === 0) {
      return;
    }

    setSyncProgress({
      total: itemsToSync.length,
      completed: 0,
      failed: 0,
      inProgress: true,
    });

    let completed = 0;
    let failed = 0;

    for (const item of itemsToSync) {
      try {
        setSyncProgress(prev => ({
          ...prev,
          currentItem: `${item.type} - ${item.action}`,
        }));

        // Simulate API call (replace with actual sync logic)
        await simulateSync(item);

        // Mark as synced
        setOfflineQueue(prev =>
          prev.map(queueItem =>
            queueItem.id === item.id
              ? { ...queueItem, synced: true }
              : queueItem,
          ),
        );

        completed++;
      } catch (error) {
        console.error('Sync error for item:', item.id, error);

        // Increment retry count
        setOfflineQueue(prev =>
          prev.map(queueItem =>
            queueItem.id === item.id
              ? { ...queueItem, retryCount: queueItem.retryCount + 1 }
              : queueItem,
          ),
        );

        failed++;
      }

      setSyncProgress(prev => ({
        ...prev,
        completed,
        failed,
      }));
    }

    // Clean up synced items
    setOfflineQueue(prev => {
      const updated = prev.filter(
        item => !item.synced || item.retryCount < item.maxRetries,
      );
      saveOfflineQueue(updated);
      return updated;
    });

    setSyncProgress({
      total: itemsToSync.length,
      completed,
      failed,
      inProgress: false,
    });

    lastSyncTime.current = Date.now();

    // Trigger haptic feedback based on results
    if (failed === 0) {
      HapticFeedbackService.triggerSuccess();
    } else if (completed > 0) {
      HapticFeedbackService.triggerWarning();
    } else {
      HapticFeedbackService.triggerError();
    }
  }, [networkStatus.isConnected, offlineQueue, syncProgress.inProgress]);

  const simulateSync = async (_item: OfflineData): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 500 + Math.random() * 1000),
    );

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Sync failed');
    }
  };

  const clearOfflineData = useCallback(() => {
    setOfflineQueue([]);
    saveOfflineQueue([]);
    HapticFeedbackService.triggerImpact('medium');
  }, []);

  const getOfflineData = useCallback(
    (type: string) => {
      return offlineQueue.filter(item => item.type === type);
    },
    [offlineQueue],
  );

  const isDataAvailableOffline = useCallback(
    (type: string, id?: string) => {
      if (id) {
        return offlineQueue.some(
          item => item.type === type && item.data.id === id,
        );
      }
      return offlineQueue.some(item => item.type === type);
    },
    [offlineQueue],
  );

  const getCachedData = useCallback(
    async (key: string): Promise<any> => {
      const item = cache.get(key);
      if (!item) return null;

      // Check if expired
      if (Date.now() > item.timestamp + item.ttl) {
        cache.delete(key);
        setCache(new Map(cache));
        return null;
      }

      return item.data;
    },
    [cache],
  );

  const setCachedData = useCallback(
    async (
      key: string,
      data: any,
      ttl: number = defaultCacheTTL,
    ): Promise<void> => {
      const item: CacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const newCache = new Map(cache);
      newCache.set(key, item);
      setCache(newCache);
      await saveCache(newCache);
    },
    [cache, defaultCacheTTL],
  );

  const clearExpiredCache = useCallback(async (): Promise<void> => {
    const now = Date.now();
    const newCache = new Map<string, CacheItem>();

    cache.forEach((item, key) => {
      if (now <= item.timestamp + item.ttl) {
        newCache.set(key, item);
      }
    });

    setCache(newCache);
    await saveCache(newCache);
  }, [cache]);

  const contextValue: OfflineContextType = {
    networkStatus,
    isOnline: networkStatus.isConnected,
    offlineQueue,
    syncProgress,
    addToOfflineQueue,
    removeFromOfflineQueue,
    syncOfflineData,
    clearOfflineData,
    getOfflineData,
    isDataAvailableOffline,
    getCachedData,
    setCachedData,
    clearExpiredCache,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

// Network Status Indicator Component
interface NetworkStatusIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  autoHide?: boolean;
  testID?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  position = 'top',
  showDetails = false,
  autoHide = true,
  testID,
}) => {
  const { theme } = useTheme();
  const { networkStatus, isOnline } = useOffline();
  const [visible, setVisible] = useState(!isOnline);
  const slideAnim = useRef(
    new Animated.Value(position === 'top' ? -100 : 100),
  ).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (autoHide) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: position === 'top' ? -100 : 100,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }
  }, [isOnline, autoHide, position]);

  const getStatusColor = () => {
    if (!isOnline) return '#F44336';

    switch (networkStatus.strength) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#FF5722';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'cloud-offline';

    switch (networkStatus.type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      default:
        return 'cloud-done';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'No internet connection';

    if (showDetails) {
      return `${networkStatus.type?.toUpperCase()} - ${networkStatus.strength?.toUpperCase()}`;
    }

    return 'Connected';
  };

  if (!visible && autoHide) {
    return null;
  }

  const containerStyle = {
    [position]: 0,
    transform: [{ translateY: slideAnim }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View
      style={[
        styles.statusIndicator,
        {
          backgroundColor: getStatusColor(),
        },
        containerStyle,
      ]}
      testID={testID}
    >
      <Ionicons name={getStatusIcon() as any} size={16} color='white' />
      <Text style={styles.statusText}>{getStatusText()}</Text>
      {showDetails && networkStatus.speed && (
        <Text style={styles.speedText}>
          {networkStatus.speed.toFixed(0)} Mbps
        </Text>
      )}
    </Animated.View>
  );
};

// Offline Queue Status Component
interface OfflineQueueStatusProps {
  showSyncButton?: boolean;
  showClearButton?: boolean;
  testID?: string;
}

export const OfflineQueueStatus: React.FC<OfflineQueueStatusProps> = ({
  showSyncButton = true,
  showClearButton = false,
  testID,
}) => {
  const { theme } = useTheme();
  const {
    offlineQueue,
    syncProgress,
    syncOfflineData,
    clearOfflineData,
    isOnline,
  } = useOffline();

  const pendingItems = offlineQueue.filter(item => !item.synced);
  const failedItems = offlineQueue.filter(
    item => item.retryCount >= item.maxRetries,
  );

  if (pendingItems.length === 0 && !syncProgress.inProgress) {
    return null;
  }

  return (
    <View
      style={[
        styles.queueStatus,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      testID={testID}
    >
      <View style={styles.queueHeader}>
        <View style={styles.queueInfo}>
          <Ionicons
            name='cloud-upload'
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.queueTitle, { color: theme.colors.onSurface }]}>
            Offline Queue
          </Text>
        </View>

        <View style={styles.queueActions}>
          {showSyncButton && isOnline && (
            <AnimatedTouchable
              onPress={syncOfflineData}
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              disabled={syncProgress.inProgress}
              hapticType='medium'
              animationType='scale'
              accessible={true}
              accessibilityRole='button'
              accessibilityLabel='Sync offline data'
            >
              <Ionicons
                name={syncProgress.inProgress ? 'sync' : 'cloud-upload'}
                size={16}
                color='white'
              />
              <Text style={styles.actionButtonText}>
                {syncProgress.inProgress ? 'Syncing...' : 'Sync'}
              </Text>
            </AnimatedTouchable>
          )}

          {showClearButton && (
            <AnimatedTouchable
              onPress={() => {
                Alert.alert(
                  'Clear Offline Data',
                  'Are you sure you want to clear all offline data? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: clearOfflineData,
                    },
                  ],
                );
              }}
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              hapticType='medium'
              animationType='scale'
              accessible={true}
              accessibilityRole='button'
              accessibilityLabel='Clear offline data'
            >
              <Ionicons name='trash' size={16} color='white' />
              <Text style={styles.actionButtonText}>Clear</Text>
            </AnimatedTouchable>
          )}
        </View>
      </View>

      <View style={styles.queueStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {pendingItems.length}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Pending
          </Text>
        </View>

        {failedItems.length > 0 && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {failedItems.length}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Failed
            </Text>
          </View>
        )}

        {syncProgress.inProgress && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
              {syncProgress.completed}/{syncProgress.total}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Synced
            </Text>
          </View>
        )}
      </View>

      {syncProgress.inProgress && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${
                    (syncProgress.completed / syncProgress.total) * 100
                  }%`,
                },
              ]}
            />
          </View>
          {syncProgress.currentItem && (
            <Text
              style={[
                styles.currentItem,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {syncProgress.currentItem}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Hook for offline-first data operations
export const useOfflineData = () => {
  const { addToOfflineQueue, getCachedData, setCachedData, isOnline } =
    useOffline();

  const createOffline = useCallback(
    async (type: string, data: any, endpoint?: string) => {
      // Add to offline queue
      addToOfflineQueue({
        type,
        data,
        action: 'create',
        endpoint,
        priority: 'medium',
        maxRetries: 3,
      });

      // Cache locally
      await setCachedData(`${type}_${data.id}`, data);

      return data;
    },
    [addToOfflineQueue, setCachedData],
  );

  const updateOffline = useCallback(
    async (type: string, data: any, endpoint?: string) => {
      addToOfflineQueue({
        type,
        data,
        action: 'update',
        endpoint,
        priority: 'medium',
        maxRetries: 3,
      });

      // Update cache
      await setCachedData(`${type}_${data.id}`, data);

      return data;
    },
    [addToOfflineQueue, setCachedData],
  );

  const deleteOffline = useCallback(
    async (type: string, id: string, endpoint?: string) => {
      addToOfflineQueue({
        type,
        data: { id },
        action: 'delete',
        endpoint,
        priority: 'high',
        maxRetries: 5,
      });

      return { id };
    },
    [addToOfflineQueue],
  );

  const getOffline = useCallback(
    async (type: string, id: string) => {
      return await getCachedData(`${type}_${id}`);
    },
    [getCachedData],
  );

  return {
    createOffline,
    updateOffline,
    deleteOffline,
    getOffline,
    isOnline,
  };
};

const styles = StyleSheet.create({
  statusIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 1000,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  speedText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  queueStatus: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  queueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  queueStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  currentItem: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default OfflineProvider;
