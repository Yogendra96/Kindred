import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import { CrashReportingService } from './CrashReportingService';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class LoggingService {
  private static instance: LoggingService;
  private isEnabled: boolean;
  private minLevel: LogLevel;

  private constructor() {
    this.isEnabled = !__DEV__;
    this.minLevel = __DEV__ ? 'debug' : 'info';
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false;
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private async logToAnalytics(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): Promise<void> {
    try {
      await analytics().logEvent('app_log', {
        level,
        message,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        ...context,
      });
    } catch (error) {
      console.error('Failed to log to analytics:', error);
    }
  }

  private formatMessage(message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextString = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${message}${contextString}`;
  }

  async debug(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message, context));
      await this.logToAnalytics('debug', message, context);
    }
  }

  async info(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message, context));
      await this.logToAnalytics('info', message, context);
    }
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message, context));
      await this.logToAnalytics('warn', message, context);
    }
  }

  async error(error: Error | string, context?: LogContext): Promise<void> {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : error;
      console.error(this.formatMessage(errorMessage, context));

      if (error instanceof Error) {
        await CrashReportingService.logError(error, context);
      } else {
        await CrashReportingService.logError(new Error(error), context);
      }

      await this.logToAnalytics('error', errorMessage, {
        ...context,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async logEvent(eventName: string, params?: { [key: string]: any }): Promise<void> {
    if (this.isEnabled) {
      try {
        await analytics().logEvent(eventName, {
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          ...params,
        });
      } catch (error) {
        console.error('Failed to log event:', error);
      }
    }
  }

  setMinimumLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  enableLogging(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export const loggingService = LoggingService.getInstance();
export default loggingService;
