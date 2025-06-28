import analytics from '@react-native-firebase/analytics';
import firebase from '@react-native-firebase/app';
import crashlytics from '@react-native-firebase/crashlytics';

interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  [key: string]: any;
}

export class CrashReportingService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await firebase.crashlytics().setCrashlyticsCollectionEnabled(true);
      this.isInitialized = true;
      console.log('Crash reporting initialized successfully');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  static async setUser(userId: string): Promise<void> {
    try {
      await Promise.all([
        crashlytics().setUserId(userId),
        analytics().setUserId(userId),
      ]);
    } catch (error) {
      console.error('Failed to set user for crash reporting:', error);
    }
  }

  static async logError(error: Error, context?: ErrorContext): Promise<void> {
    try {
      // Log to crashlytics
      await crashlytics().recordError(error, {
        ...context,
        timestamp: Date.now(),
      });

      // Log to analytics
      await analytics().logEvent('app_error', {
        error_name: error.name,
        error_message: error.message,
        ...context,
      });

      // Additional error details
      if (context?.userId) {
        await crashlytics().setUserId(context.userId);
      }

      await crashlytics().setAttributes({
        error_name: error.name,
        error_message: error.message,
        stack_trace: error.stack || 'No stack trace available',
        ...context,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  static async logWarning(
    message: string,
    context?: ErrorContext,
  ): Promise<void> {
    try {
      await analytics().logEvent('app_warning', {
        warning_message: message,
        ...context,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log warning:', error);
    }
  }

  static async logBreadcrumb(
    message: string,
    category: string = 'app',
    level: 'error' | 'warning' | 'info' = 'info',
  ): Promise<void> {
    try {
      await crashlytics().log(`[${category}] ${message}`);
    } catch (error) {
      console.error('Failed to log breadcrumb:', error);
    }
  }

  static async setAttribute(key: string, value: string): Promise<void> {
    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Failed to set attribute:', error);
    }
  }

  static async setAttributes(
    attributes: Record<string, string>,
  ): Promise<void> {
    try {
      await crashlytics().setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set attributes:', error);
    }
  }

  static enableCollection(): Promise<void> {
    return crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  static disableCollection(): Promise<void> {
    return crashlytics().setCrashlyticsCollectionEnabled(false);
  }

  static async handleUnhandledRejection(promise: Promise<any>): Promise<void> {
    try {
      await promise;
    } catch (error) {
      await this.logError(
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }
}
