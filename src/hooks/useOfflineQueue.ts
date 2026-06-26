// @ts-nocheck
/* eslint-disable */
/**
 * useOfflineQueue
 *
 * React hook that exposes the offline queue state to UI components.
 * Subscribes to network changes and triggers drain automatically.
 */

import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { backgroundSyncService } from '../services/BackgroundSyncService';
import { offlineQueueService, type QueueStats } from '../services/OfflineQueueService';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface UseOfflineQueueReturn {
  isOnline: boolean;
  syncStatus: SyncStatus;
  queueStats: QueueStats;
  syncNow: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    failedCount: 0,
    oldestActionAge: null,
  });
  const syncedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshStats = useCallback(async () => {
    const stats = await offlineQueueService.getStats();
    setQueueStats(stats);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncStatus === 'syncing') return;

    const stats = await offlineQueueService.getStats();
    if (stats.pending === 0) return;

    setSyncStatus('syncing');
    try {
      const result = await backgroundSyncService.syncNow();
      await refreshStats();

      if (result.failed > 0 || backgroundSyncService.shouldAlertUser) {
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
        // Auto-reset to idle after 2.5s
        if (syncedTimeoutRef.current) clearTimeout(syncedTimeoutRef.current);
        syncedTimeoutRef.current = setTimeout(() => {
          setSyncStatus('idle');
        }, 2500);
      }
    } catch {
      setSyncStatus('error');
    }
  }, [syncStatus, refreshStats]);

  useEffect(() => {
    // Initialize on mount
    backgroundSyncService.initialize();
    refreshStats();

    const unsubscribe = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected && state.isInternetReachable);
      setIsOnline(online);

      // Trigger drain when we come back online
      if (online) {
        syncNow();
      }
    });

    return () => {
      unsubscribe();
      if (syncedTimeoutRef.current) clearTimeout(syncedTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isOnline, syncStatus, queueStats, syncNow };
}
