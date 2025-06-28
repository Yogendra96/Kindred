import { CrashReportingService } from './CrashReportingService';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  channelId?: string;
  priority?: 'high' | 'default' | 'low';
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private defaultChannelId = 'default_channel';

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      await this.requestPermissions();

      // Create default channel for Android
      if (Platform.OS === 'android') {
        await this.createDefaultChannel();
      }

      // Get FCM token
      const token = await this.getFCMToken();
      if (token) {
        console.log('FCM Token:', token);
      }

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
    } catch (error) {
      CrashReportingService.logError(
        error instanceof Error
          ? error
          : new Error('Failed to initialize notifications'),
      );
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await notifee.requestPermission({
          sound: true,
          announcement: true,
          criticalAlert: true,
        });
      }

      return enabled;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  private async createDefaultChannel(): Promise<void> {
    await notifee.createChannel({
      id: this.defaultChannelId,
      name: 'Default Channel',
      sound: 'default',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  }

  async getFCMToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      await this.displayNotification({
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      });
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      await this.displayNotification({
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      });
    });

    // Handle notification press
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification', detail.notification);
        // Handle notification press
      }
    });
  }

  async subscribe(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
    }
  }

  async unsubscribe(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  async displayNotification(payload: NotificationPayload): Promise<void> {
    try {
      const channelId =
        Platform.OS === 'android'
          ? payload.channelId || this.defaultChannelId
          : undefined;

      await notifee.displayNotification({
        title: payload.title,
        body: payload.body,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          pressAction: {
            id: 'default',
          },
          ...(payload.imageUrl && {
            largeIcon: payload.imageUrl,
          }),
        },
        ios: {
          sound: 'default',
          critical: payload.priority === 'high',
          importance: payload.priority === 'high' ? 5 : 3,
        },
        data: payload.data,
      });
    } catch (error) {
      console.error('Failed to display notification:', error);
    }
  }

  async scheduleNotification(
    payload: NotificationPayload,
    date: Date,
  ): Promise<string> {
    try {
      const channelId =
        Platform.OS === 'android'
          ? payload.channelId || this.defaultChannelId
          : undefined;

      const trigger = {
        type: Platform.select({
          ios: 1,
          android: 'timestamp',
        }),
        timestamp: date.getTime(),
      };

      return await notifee.createTriggerNotification(
        {
          title: payload.title,
          body: payload.body,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            sound: 'default',
          },
          ios: {
            sound: 'default',
            critical: payload.priority === 'high',
          },
          data: payload.data,
        },
        trigger,
      );
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return '';
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    return await notifee.getBadgeCount();
  }

  async setBadgeCount(count: number): Promise<void> {
    await notifee.setBadgeCount(count);
  }

  async incrementBadgeCount(): Promise<void> {
    const currentCount = await this.getBadgeCount();
    await this.setBadgeCount(currentCount + 1);
  }

  async decrementBadgeCount(): Promise<void> {
    const currentCount = await this.getBadgeCount();
    await this.setBadgeCount(Math.max(0, currentCount - 1));
  }

  async clearBadgeCount(): Promise<void> {
    await this.setBadgeCount(0);
  }

  cleanup(): void {
    // Clean up any event listeners or subscriptions
    messaging().onMessage(() => {});
    messaging().setBackgroundMessageHandler(() => {});
    notifee.onForegroundEvent(() => {});
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
