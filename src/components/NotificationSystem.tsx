// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { BlurView } from 'expo-blur';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatedTouchable } from './MicroInteractions';

const { width: screenWidth } = Dimensions.get('window');

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: NotificationAction[];
  autoHide?: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
}

interface NotificationItemProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss, index }) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    if (notification.autoHide !== false) {
      setTimeout(() => onDismiss(notification.id), 5000);
    }
  }, []);

  return (
    <Animated.View
      style={[styles.notificationContainer, { opacity, backgroundColor: theme.colors.surface }]}
    >
      <Text style={{ color: theme.colors.onSurface }}>{notification.title}</Text>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{notification.message}</Text>
    </Animated.View>
  );
};

interface NotificationSystemProps {
  maxNotifications?: number;
  testID?: string;
}

/**
 * Notification System Component
 * Manages app-wide notifications and alerts
 */
export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxNotifications = 5,
  testID,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.container} testID={testID} pointerEvents='box-none'>
      {notifications.map((n, i) => (
        <NotificationItem key={n.id} notification={n} onDismiss={removeNotification} index={i} />
      ))}
    </View>
  );
};

export const useNotifications = () => {
  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    // Logic to trigger NotificationSystem globally would go here
    console.log('Show Notification:', notification.title);
    return 'id';
  };
  return { showNotification };
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 1000 },
  notificationContainer: { padding: 16, borderRadius: 12, marginBottom: 8, elevation: 4 },
});

export default NotificationSystem;
