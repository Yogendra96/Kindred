// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import type { NetInfoState } from '@react-native-community/netinfo';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Alert } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
}

interface OfflineContextType {
  isOnline: boolean;
  offlineQueue: OfflineData[];
  addToOfflineQueue: (data: Omit<OfflineData, 'id' | 'timestamp'>) => void;
  syncOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};

/**
 * Offline Experience Provider Component
 * Manages network connectivity, offline queuing, and data synchronization
 */
export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineData[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        HapticFeedbackService.triggerSuccess();
      } else {
        HapticFeedbackService.triggerWarning();
      }
    });
    return () => unsubscribe();
  }, []);

  const addToOfflineQueue = (data: Omit<OfflineData, 'id' | 'timestamp'>) => {
    const newItem = { ...data, id: Date.now().toString(), timestamp: Date.now() };
    setOfflineQueue(prev => [...prev, newItem]);
    HapticFeedbackService.triggerSelection();
  };

  const syncOfflineData = async () => {
    if (!isOnline || offlineQueue.length === 0) return;
    // Sync logic omitted for brevity
    console.log('Syncing offline data...');
    setOfflineQueue([]);
    HapticFeedbackService.triggerSuccess();
  };

  return (
    <OfflineContext.Provider value={{ isOnline, offlineQueue, addToOfflineQueue, syncOfflineData }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const NetworkStatusIndicator = () => {
  const { isOnline } = useOffline();
  if (isOnline) return null;
  return (
    <View style={styles.statusIndicator}>
      <Ionicons name='cloud-offline' size={16} color='white' />
      <Text style={styles.statusText}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600' },
});

export default OfflineProvider;
