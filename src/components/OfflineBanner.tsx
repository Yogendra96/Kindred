// @ts-nocheck
/* eslint-disable */
/**
 * OfflineBanner
 *
 * A sticky status bar shown at the top of the screen when:
 *  - The device is offline
 *  - The offline queue is syncing
 *  - The sync just completed (briefly flashes green then fades out)
 *
 * Automatically hidden when online and idle with no pending actions.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useTheme } from '../theme/ThemeProvider';

export const OfflineBanner: React.FC = () => {
  const { isOnline, syncStatus, queueStats, syncNow } = useOfflineQueue();
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const shouldShow =
    !isOnline ||
    syncStatus === 'syncing' ||
    syncStatus === 'error' ||
    (syncStatus === 'synced' && queueStats.pending === 0) ||
    (isOnline && queueStats.pending > 0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: shouldShow ? 0 : -60,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldShow]);

  const getBannerConfig = () => {
    if (syncStatus === 'synced') {
      return {
        bg: '#22C55E',
        icon: 'checkmark-circle' as const,
        text: 'All data synced ✓',
        showTap: false,
      };
    }
    if (syncStatus === 'syncing') {
      return {
        bg: '#F59E0B',
        icon: 'sync' as const,
        text: `Syncing ${queueStats.pending} pending action${queueStats.pending !== 1 ? 's' : ''}…`,
        showTap: false,
      };
    }
    if (syncStatus === 'error') {
      return {
        bg: '#EF4444',
        icon: 'warning' as const,
        text: 'Sync failed — tap to retry',
        showTap: true,
      };
    }
    if (!isOnline) {
      return {
        bg: '#6B7280',
        icon: 'cloud-offline' as const,
        text:
          queueStats.pending > 0
            ? `Offline · ${queueStats.pending} action${
                queueStats.pending !== 1 ? 's' : ''
              } pending sync`
            : "You're offline",
        showTap: false,
      };
    }
    // Online with pending queue
    return {
      bg: '#3B82F6',
      icon: 'cloud-upload' as const,
      text: `${queueStats.pending} item${queueStats.pending !== 1 ? 's' : ''} pending sync`,
      showTap: true,
    };
  };

  const config = getBannerConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={config.showTap ? syncNow : undefined}
        activeOpacity={config.showTap ? 0.7 : 1}
        disabled={!config.showTap}
      >
        <View style={styles.left}>
          <Ionicons name={config.icon} size={14} color='white' style={styles.icon} />
          <Text style={styles.text}>{config.text}</Text>
        </View>
        {config.showTap && (
          <Ionicons name='chevron-forward' size={14} color='rgba(255,255,255,0.8)' />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    paddingTop: 44, // safe area top
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    flex: 1,
  },
});

export default OfflineBanner;
