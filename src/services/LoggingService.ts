import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
  platform: string;
  userId?: string;
}

class LoggingService {
  private static instance: LoggingService;
  private isEnabled: boolean;
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    this.isEnabled = true;
    this.minLevel = __DEV__ ? 'debug' : 'info';
    this.loadStoredLogs();
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private async loadStoredLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem('@logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  private async persistLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@logs',
        JSON.stringify(this.logs.slice(-this.maxLogs)),
      );
    } catch (error) {
      console.warn('Failed to persist logs:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false;

    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);

    return currentLevelIndex >= minLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: Date.now(),
      platform: Platform.OS,
      userId: context?.userId,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist logs periodically
    if (this.logs.length % 10 === 0) {
      this.persistLogs();
    }

    // Also log to console in development
    if (__DEV__) {
      const logMethod =
        entry.level === 'error'
          ? console.error
          : entry.level === 'warn'
          ? console.warn
          : entry.level === 'info'
          ? console.info
          : console.log;

      logMethod(
        `[${entry.level.toUpperCase()}] ${entry.message}`,
        entry.context || '',
      );
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.addLog(this.createLogEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.addLog(this.createLogEntry('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.addLog(this.createLogEntry('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.addLog(this.createLogEntry('error', message, context));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    const filteredLogs = level
      ? this.logs.filter(log => log.level === level)
      : this.logs;
    return limit ? filteredLogs.slice(-limit) : filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
    AsyncStorage.removeItem('@logs');
  }

  async exportLogs(): Promise<string> {
    await this.persistLogs();
    return JSON.stringify(this.logs, null, 2);
  }
}

export const loggingService = LoggingService.getInstance();
export default LoggingService;
