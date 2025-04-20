import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import { loggingService } from './LoggingService';

export type ScreenName =
  | 'Login'
  | 'Register'
  | 'Home'
  | 'Profile'
  | 'Settings'
  | 'Activity'
  | 'CarbonTracker'
  | 'EcoTips';

export interface AnalyticsUser {
  id: string;
  email?: string;
  role?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = !__DEV__;
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(this.isEnabled);
      loggingService.info('Analytics initialized successfully');
    } catch (error) {
      loggingService.error('Failed to initialize analytics', { error });
    }
  }

  async setUser(user: AnalyticsUser): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await analytics().setUserId(user.id);
      const userProperties: Record<string, string> = {
        platform: Platform.OS,
        appVersion: Platform.select({
          ios: require('../../ios/Kindred/Info.plist').CFBundleShortVersionString,
          android: require('../../android/app/build.gradle').android.defaultConfig.versionName,
        }),
      };

      if (user.email) {
        userProperties.email = user.email;
      }
      if (user.role) {
        userProperties.role = user.role;
      }

      await analytics().setUserProperties(userProperties);
    } catch (error) {
      loggingService.error('Failed to set analytics user', { error, userId: user.id });
    }
  }

  async logScreen(screenName: ScreenName, params?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
        ...params,
      });
    } catch (error) {
      loggingService.error('Failed to log screen view', { error, screenName });
    }
  }

  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await analytics().logEvent(eventName, {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        ...params,
      });
    } catch (error) {
      loggingService.error('Failed to log event', { error, eventName });
    }
  }

  // Carbon footprint tracking events
  async logCarbonFootprintAdded(value: number, category: string): Promise<void> {
    await this.logEvent('carbon_footprint_added', {
      value,
      category,
      timestamp: new Date().toISOString(),
    });
  }

  async logActivityCompleted(type: string, duration: number, carbonSaved: number): Promise<void> {
    await this.logEvent('activity_completed', {
      type,
      duration,
      carbon_saved: carbonSaved,
    });
  }

  async logEcoTipViewed(tipId: string, category: string): Promise<void> {
    await this.logEvent('eco_tip_viewed', {
      tip_id: tipId,
      category,
    });
  }

  // User engagement events
  async logUserEngagement(
    actionName: string,
    duration: number,
    params?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('user_engagement', {
      action: actionName,
      duration,
      ...params,
    });
  }

  // Error tracking
  async logError(errorCode: string, message: string, fatal: boolean = false): Promise<void> {
    await this.logEvent('app_error', {
      error_code: errorCode,
      error_message: message,
      fatal,
    });
  }

  // Performance tracking
  async logPerformanceMetric(
    metricName: string,
    value: number,
    params?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('performance_metric', {
      metric_name: metricName,
      value,
      ...params,
    });
  }

  enableAnalytics(enabled: boolean): void {
    this.isEnabled = enabled;
    analytics().setAnalyticsCollectionEnabled(enabled);
  }

  async resetAnalyticsData(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await analytics().resetAnalyticsData();
      loggingService.info('Analytics data reset successfully');
    } catch (error) {
      loggingService.error('Failed to reset analytics data', { error });
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;
