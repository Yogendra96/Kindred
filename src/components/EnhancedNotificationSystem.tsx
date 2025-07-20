import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { PanGestureHandlerGestureEvent } from 'react-native';
import {
  Animated,
  Dimensions,
  PanGestureHandler,
  // TouchableOpacity,
  Platform,
  State,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@theme/ThemeProvider';
import { BlurView } from 'expo-blur';

import { HapticFeedbackService } from '../services/HapticFeedbackService';

const { width: screenWidth, height: _screenHeight } = Dimensions.get('window');

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'carbon' | 'activity' | 'achievement' | 'tip' | 'system';
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
  sound?: boolean;
  vibration?: boolean;
  timestamp?: Date;
  data?: Record<string, unknown>;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  style?: 'default' | 'destructive' | 'primary';
}

interface NotificationItemProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionId: string) => void;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onAction,
  index,
}) => {
  const { theme, isDark } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation with stagger
    const delay = index * 100;

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    }, delay);

    // Auto-hide animation
    if (notification.autoHide !== false && !notification.persistent) {
      const duration = notification.duration || 5000;

      Animated.timing(progressAnim, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start(() => {
        handleDismiss();
      });
    }
  }, []);

  const handleDismiss = () => {
    HapticFeedbackService.triggerImpact('light');

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  const onGestureEvent = Animated.event([{ nativeEvent: { translationX: translateX } }], {
    useNativeDriver: true,
  });

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const threshold = screenWidth * 0.3;
      const shouldDismiss = Math.abs(translationX) > threshold || Math.abs(velocityX) > 500;

      if (shouldDismiss) {
        handleDismiss();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }).start();
      }
    }
  };

  const getNotificationStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.primary,
    };

    switch (notification.type) {
      case 'success':
        return {
          ...baseStyle,
          borderLeftColor: '#4CAF50',
          backgroundColor: isDark ? '#1B5E20' : '#E8F5E8',
        };
      case 'error':
        return {
          ...baseStyle,
          borderLeftColor: '#F44336',
          backgroundColor: isDark ? '#B71C1C' : '#FFEBEE',
        };
      case 'warning':
        return {
          ...baseStyle,
          borderLeftColor: '#FF9800',
          backgroundColor: isDark ? '#E65100' : '#FFF3E0',
        };
      case 'achievement':
        return {
          ...baseStyle,
          borderLeftColor: '#9C27B0',
          backgroundColor: isDark ? '#4A148C' : '#F3E5F5',
        };
      case 'tip':
        return {
          ...baseStyle,
          borderLeftColor: '#2196F3',
          backgroundColor: isDark ? '#0D47A1' : '#E3F2FD',
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = () => {
    if (notification.icon) {
      return notification.icon;
    }

    switch (notification.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'achievement':
        return 'trophy';
      case 'tip':
        return 'bulb';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'achievement':
        return '#9C27B0';
      case 'tip':
        return '#2196F3';
      default:
        return theme.colors.primary;
    }
  };

  const animatedStyle = {
    transform: [{ translateX }, { translateY }, { scale }],
    opacity,
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View
        style={[styles.notificationContainer, getNotificationStyle(), animatedStyle]}
        accessible={true}
        accessibilityRole='alert'
        accessibilityLabel={`${notification.type} notification: ${notification.title}`}
        accessibilityHint='Swipe right to dismiss'
      >
        {/* Progress bar for auto-hide */}
        {notification.autoHide !== false && !notification.persistent && (
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: getIconColor(),
              },
            ]}
          />
        )}

        <View style={styles.contentContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIcon() as string}
              size={24}
              color={getIconColor()}
              accessible={true}
              accessibilityLabel={`${notification.type} icon`}
            />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
              accessible={true}
              accessibilityRole='header'
            >
              {notification.title}
            </Text>
            <Text
              style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={3}
              accessible={true}
            >
              {notification.message}
            </Text>

            {notification.timestamp && (
              <Text
                style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
                accessible={true}
              >
                {notification.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          {/* Dismiss button */}
          <AnimatedTouchable
            onPress={handleDismiss}
            style={styles.dismissButton}
            hapticType='light'
            animationType='scale'
            accessible={true}
            accessibilityRole='button'
            accessibilityLabel='Dismiss notification'
          >
            <Ionicons name='close' size={20} color={theme.colors.onSurfaceVariant} />
          </AnimatedTouchable>
        </View>

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {notification.actions.map(action => (
              <AnimatedTouchable
                key={action.id}
                onPress={() => {
                  HapticFeedbackService.triggerSelection();
                  onAction(notification.id, action.id);
                  action.action();
                }}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      action.style === 'primary'
                        ? theme.colors.primary
                        : action.style === 'destructive'
                          ? theme.colors.error
                          : 'transparent',
                    borderColor:
                      action.style === 'primary'
                        ? theme.colors.primary
                        : action.style === 'destructive'
                          ? theme.colors.error
                          : theme.colors.outline,
                  },
                ]}
                hapticType='medium'
                animationType='scale'
                accessible={true}
                accessibilityRole='button'
                accessibilityLabel={action.label}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color:
                        action.style === 'primary'
                          ? theme.colors.onPrimary
                          : action.style === 'destructive'
                            ? theme.colors.onError
                            : theme.colors.onSurface,
                    },
                  ]}
                >
                  {action.label}
                </Text>
              </AnimatedTouchable>
            ))}
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

interface EnhancedNotificationSystemProps {
  maxNotifications?: number;
  position?: 'top' | 'bottom';
  enableBlur?: boolean;
  enableHaptics?: boolean;
  enableSounds?: boolean;
  testID?: string;
}

export const EnhancedNotificationSystem: React.FC<EnhancedNotificationSystemProps> = ({
  maxNotifications = 5,
  position = 'top',
  enableBlur = true,
  enableHaptics = true,
  enableSounds = true,
  testID,
}) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState({
    enableHaptics,
    enableSounds,
    enableBlur,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const _saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const _addNotification = useCallback(
    (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
      const newNotification: NotificationData = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications);

        // Trigger haptic feedback based on priority
        if (settings.enableHaptics) {
          switch (newNotification.priority) {
            case 'urgent':
              HapticFeedbackService.triggerError();
              break;
            case 'high':
              HapticFeedbackService.triggerImpact('heavy');
              break;
            case 'medium':
              HapticFeedbackService.triggerImpact('medium');
              break;
            default:
              HapticFeedbackService.triggerImpact('light');
          }
        }

        return updated;
      });

      return newNotification.id;
    },
    [maxNotifications, settings.enableHaptics],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    HapticFeedbackService.triggerImpact('medium');
    setNotifications([]);
  }, []);

  const handleAction = useCallback((notificationId: string, actionId: string) => {
    // Log action for analytics
    console.warn('Notification action:', { notificationId, actionId });
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  const containerStyle = {
    top: position === 'top' ? 50 : undefined,
    bottom: position === 'bottom' ? 50 : undefined,
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID} pointerEvents='box-none'>
      {settings.enableBlur && Platform.OS === 'ios' ? (
        <BlurView intensity={20} style={styles.blurContainer}>
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
              onAction={handleAction}
              index={index}
            />
          ))}
        </BlurView>
      ) : (
        <View style={styles.regularContainer}>
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
              onAction={handleAction}
              index={index}
            />
          ))}
        </View>
      )}

      {/* Clear all button */}
      {notifications.length > 1 && (
        <View style={styles.clearAllContainer}>
          <AnimatedTouchable
            onPress={clearAllNotifications}
            style={[styles.clearAllButton, { backgroundColor: theme.colors.surfaceVariant }]}
            hapticType='medium'
            animationType='scale'
            accessible={true}
            accessibilityRole='button'
            accessibilityLabel='Clear all notifications'
          >
            <Text style={[styles.clearAllText, { color: theme.colors.onSurfaceVariant }]}>
              Clear All ({notifications.length})
            </Text>
          </AnimatedTouchable>
        </View>
      )}
    </View>
  );
};

// Hook for using the notification system
export const useNotifications = () => {
  const [notificationSystem, setNotificationSystem] = useState<{
    addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => string;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
  } | null>(null);

  const showNotification = useCallback(
    (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
      return notificationSystem?.addNotification(notification) || '';
    },
    [notificationSystem],
  );

  const hideNotification = useCallback(
    (id: string) => {
      notificationSystem?.removeNotification(id);
    },
    [notificationSystem],
  );

  const clearAll = useCallback(() => {
    notificationSystem?.clearAllNotifications();
  }, [notificationSystem]);

  // Convenience methods for different notification types
  const showSuccess = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'success',
        priority: 'medium',
        ...options,
      });
    },
    [showNotification],
  );

  const showError = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'error',
        priority: 'high',
        persistent: true,
        ...options,
      });
    },
    [showNotification],
  );

  const showWarning = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'warning',
        priority: 'medium',
        ...options,
      });
    },
    [showNotification],
  );

  const showInfo = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'info',
        priority: 'low',
        ...options,
      });
    },
    [showNotification],
  );

  const showAchievement = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'achievement',
        priority: 'high',
        duration: 8000,
        ...options,
      });
    },
    [showNotification],
  );

  const showTip = useCallback(
    (title: string, message: string, options?: Partial<NotificationData>) => {
      return showNotification({
        title,
        message,
        type: 'tip',
        priority: 'low',
        category: 'tip',
        ...options,
      });
    },
    [showNotification],
  );

  return {
    setNotificationSystem,
    showNotification,
    hideNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAchievement,
    showTip,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  regularContainer: {
    // No additional styles needed
  },
  notificationContainer: {
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 18, // Account for progress bar
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  dismissButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EnhancedNotificationSystem;
