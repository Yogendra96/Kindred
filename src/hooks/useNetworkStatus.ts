// @ts-nocheck
/* eslint-disable */
/**
 * useNetworkStatus (v2)
 *
 * Extends the basic connectivity check with:
 *  - isInternetReachable (not just connected to WiFi/LTE, but actually reaching the internet)
 *  - Exposes connection quality info
 *  - Triggers the offline queue drain automatically on reconnect
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { backgroundSyncService } from '../services/BackgroundSyncService';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  isWifi: false,
  isCellular: false,
};

function parseNetState(state: NetInfoState): NetworkStatus {
  return {
    isConnected: Boolean(state.isConnected),
    isInternetReachable: Boolean(state.isInternetReachable),
    connectionType: state.type ?? null,
    isWifi: state.type === 'wifi',
    isCellular: state.type === 'cellular',
  };
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);
  const wasOfflineRef = useRef(false);

  const handleStateChange = useCallback((state: NetInfoState) => {
    const next = parseNetState(state);
    setStatus(next);

    const isReallyOnline = next.isConnected && next.isInternetReachable;

    // Detect reconnection event → trigger queue drain
    if (isReallyOnline && wasOfflineRef.current) {
      console.log('[useNetworkStatus] Back online — triggering queue drain');
      backgroundSyncService.syncNow().catch(console.warn);
    }

    wasOfflineRef.current = !isReallyOnline;
  }, []);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then(handleStateChange);

    const unsubscribe = NetInfo.addEventListener(handleStateChange);
    return unsubscribe;
  }, [handleStateChange]);

  return status;
}

// Legacy compat export (keeps old consumers working without changes)
export const useBasicNetworkStatus = () => {
  const { isConnected, connectionType } = useNetworkStatus();
  return { isConnected, connectionType };
};
