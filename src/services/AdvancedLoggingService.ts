/**
 * 🚀 Advanced Logging Service
 * Modern, searchable, structured logging system for React Native
 * Features: Real-time search, performance tracking, error correlation, analytics integration
 */

import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import { observabilityService } from './ObservabilityService';

// Enhanced log levels with numeric priorities
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogMetadata {
  // User Context
  userId?: string;
  sessionId?: string;
  deviceId?: string;

  // App Context
  screen?: string;
  component?: string;
  action?: string;
  feature?: string;

  // Technical Context
  function?: string;
  file?: string;
  line?: number;
  stack?: string;

  // Performance Context
  duration?: number;
  memoryUsage?: number;
  networkLatency?: number;

  // Business Context
  category?:
    | 'auth'
    | 'carbon'
    | 'navigation'
    | 'user'
    | 'performance'
    | 'security'
    | 'payment'
    | 'sync'
    | 'system';
  tags?: string[];

  // Request/Response Context
  requestId?: string;
  correlationId?: string;
  traceId?: string;

  // Custom Context
  [key: string]: string | number | boolean | undefined;
}

export interface LogEntry {
  // Core Fields
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;

  // Context
  metadata: LogMetadata;

  // Environment
  platform: 'ios' | 'android';
  appVersion: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';

  // Performance
  performanceMarks?: PerformanceMark[];

  // Error Context (for error logs)
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    cause?: unknown;
  };

  // Search & Analytics
  searchableText: string; // Pre-computed for fast search
  fingerprint?: string; // For deduplication
}

export interface PerformanceMark {
  name: string;
  timestamp: number;
  duration?: number;
  memory?: number;
}

export interface LogQuery {
  // Text Search
  query?: string;

  // Filters
  levels?: LogLevel[];
  categories?: string[];
  tags?: string[];
  userId?: string;
  screen?: string;
  component?: string;

  // Time Range
  fromTimestamp?: number;
  toTimestamp?: number;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'timestamp' | 'level' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface LogAnalytics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<string, number>;
  topErrors: Array<{ message: string; count: number; lastSeen: number }>;
  performanceMetrics: {
    averageRenderTime: number;
    memoryUsage: number;
    errorRate: number;
  };
  timeSeriesData: Array<{ timestamp: number; count: number; level: LogLevel }>;
}

// Performance tracking utilities
class PerformanceTracker {
  private marks: Map<string, PerformanceMark> = new Map();

  mark(name: string): void {
    this.marks.set(name, {
      name,
      timestamp: performance.now(),
      memory: this.getMemoryUsage(),
    });
  }

  measure(startMark: string, endMark?: string): PerformanceMark | null {
    const start = this.marks.get(startMark);
    if (!start) return null;

    const end = endMark ? this.marks.get(endMark) : null;
    const endTime = end?.timestamp ?? performance.now();

    return {
      name: `${startMark}-duration`,
      timestamp: start.timestamp,
      duration: endTime - start.timestamp,
      memory: this.getMemoryUsage(),
    };
  }

  private getMemoryUsage(): number {
    // In React Native, we can estimate memory usage
    try {
      const globalWithPerformance = global as unknown as {
        performance?: {
          memory?: {
            usedJSHeapSize?: number;
          };
        };
      };
      return globalWithPerformance.performance?.memory?.usedJSHeapSize ?? 0;
    } catch {
      return 0;
    }
  }
}

export class AdvancedLoggingService {
  private static instance: AdvancedLoggingService;
  private logs: LogEntry[] = [];
  private performanceTracker = new PerformanceTracker();

  // Configuration
  private config = {
    maxLogs: 10000,
    maxSearchResults: 1000,
    persistBatchSize: 50,
    autoFlushInterval: 30000, // 30 seconds
    enablePerformanceTracking: true,
    enableAnalytics: true,
  };

  // State
  private isInitialized = false;
  private sessionId = uuidv4();
  private deviceId = '';
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AdvancedLoggingService {
    if (!AdvancedLoggingService.instance) {
      AdvancedLoggingService.instance = new AdvancedLoggingService();
    }
    return AdvancedLoggingService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Load device ID
      this.deviceId = await this.getDeviceId();

      // Load persisted logs
      await this.loadPersistedLogs();

      // Start auto-flush timer
      this.startAutoFlush();

      this.isInitialized = true;

      this.info('AdvancedLoggingService initialized', {
        category: 'system',
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        maxLogs: this.config.maxLogs,
      });
    } catch (error) {
      console.error('Failed to initialize AdvancedLoggingService:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('@device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        await AsyncStorage.setItem('@device_id', deviceId);
      }
      return deviceId;
    } catch {
      return 'unknown-device';
    }
  }

  private async loadPersistedLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem('@advanced_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        this.logs = Array.isArray(parsedLogs) ? parsedLogs : [];
      }
    } catch (error) {
      console.warn('Failed to load persisted logs:', error);
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.autoFlushInterval);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata: LogMetadata = {},
  ): LogEntry {
    const timestamp = Date.now();
    const id = uuidv4();

    // Build searchable text for fast searching
    const searchableText = [
      message,
      metadata.screen,
      metadata.component,
      metadata.action,
      metadata.feature,
      metadata.category,
      metadata.userId,
      ...(metadata.tags ?? []),
      JSON.stringify(metadata),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Generate fingerprint for deduplication
    const fingerprint = this.generateFingerprint(level, message, metadata);

    return {
      id,
      level,
      message,
      timestamp,
      metadata: {
        ...metadata,
        sessionId: this.sessionId,
        deviceId: this.deviceId,
      },
      platform: Platform.OS as 'ios' | 'android',
      appVersion: '1.0.0', // Should come from app config
      buildNumber: '1', // Should come from app config
      environment: __DEV__ ? 'development' : 'production',
      searchableText,
      fingerprint,
    };
  }

  private generateFingerprint(
    level: LogLevel,
    message: string,
    metadata: LogMetadata,
  ): string {
    // Create a hash-like fingerprint for deduplication
    const key = `${level}-${message}-${metadata.component}-${metadata.action}`;
    return btoa(key)
      .replace(/[^\dA-Za-z]/g, '')
      .substring(0, 16);
  }

  private addLog(entry: LogEntry): void {
    // Add to in-memory logs
    this.logs.push(entry);

    // Maintain size limit
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }

    // Console output in development
    if (__DEV__) {
      this.outputToConsole(entry);
    }

    // Send to observability service for analytics
    if (this.config.enableAnalytics) {
      this.sendToAnalytics(entry);
    }

    // Auto-flush if batch size reached
    if (this.logs.length % this.config.persistBatchSize === 0) {
      this.flush();
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] ${new Date(entry.timestamp).toISOString()}`;
    const context = entry.metadata.component
      ? ` [${entry.metadata.component}]`
      : '';
    const logLine = `${prefix}${context} ${entry.message}`;

    const logMethod = {
      trace: console.debug,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      fatal: console.error,
    }[entry.level];

    logMethod(logLine, entry.metadata);

    if (entry.error) {
      console.error('Error details:', entry.error);
    }
  }

  private sendToAnalytics(entry: LogEntry): void {
    try {
      // Send structured log data to observability service
      observabilityService.trackEvent('log_event', {
        level: entry.level,
        category: entry.metadata.category,
        screen: entry.metadata.screen,
        component: entry.metadata.component,
        hasError: !!entry.error,
        fingerprint: entry.fingerprint,
      });

      // Track performance metrics
      if (entry.metadata.duration) {
        observabilityService.trackPerformanceMetric(
          'log_performance',
          entry.metadata.duration,
        );
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      if (__DEV__) {
        console.warn('Failed to send log to analytics:', error);
      }
    }
  }

  // Public Logging Methods
  trace(message: string, metadata: LogMetadata = {}): void {
    this.addLog(this.createLogEntry('trace', message, metadata));
  }

  debug(message: string, metadata: LogMetadata = {}): void {
    this.addLog(this.createLogEntry('debug', message, metadata));
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.addLog(this.createLogEntry('info', message, metadata));
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.addLog(this.createLogEntry('warn', message, metadata));
  }

  error(message: string, metadata: LogMetadata = {}, error?: Error): void {
    const entry = this.createLogEntry('error', message, metadata);

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as unknown as { code?: string }).code,
        cause: (error as unknown as { cause?: unknown }).cause,
      };
    }

    this.addLog(entry);
  }

  fatal(message: string, metadata: LogMetadata = {}, error?: Error): void {
    const entry = this.createLogEntry('fatal', message, metadata);

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as unknown as { code?: string }).code,
        cause: (error as unknown as { cause?: unknown }).cause,
      };
    }

    this.addLog(entry);

    // Immediately flush fatal errors
    this.flush();
  }

  // Performance Tracking
  startPerformanceTracking(name: string): void {
    if (this.config.enablePerformanceTracking) {
      this.performanceTracker.mark(name);
    }
  }

  endPerformanceTracking(name: string, metadata: LogMetadata = {}): void {
    if (this.config.enablePerformanceTracking) {
      const measurement = this.performanceTracker.measure(name);
      if (measurement) {
        this.info(`Performance: ${name}`, {
          ...metadata,
          duration: measurement.duration,
          memoryUsage: measurement.memory,
          category: 'performance',
        });
      }
    }
  }

  // Context Methods
  setUserId(userId: string): void {
    this.info('User context updated', {
      userId,
      category: 'auth',
      action: 'context_update',
    });
  }

  setScreen(screen: string, metadata: LogMetadata = {}): void {
    this.info(`Screen navigation: ${screen}`, {
      ...metadata,
      screen,
      category: 'navigation',
      action: 'screen_change',
    });
  }

  // Search & Query Methods
  search(query: LogQuery): LogEntry[] {
    let results = [...this.logs];

    // Text search
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(log => log.searchableText.includes(searchTerm));
    }

    // Level filter
    if (query.levels?.length) {
      results = results.filter(log => query.levels!.includes(log.level));
    }

    // Category filter
    if (query.categories?.length) {
      results = results.filter(log =>
        query.categories!.includes(log.metadata.category ?? ''),
      );
    }

    // Tags filter
    if (query.tags?.length) {
      results = results.filter(log =>
        query.tags!.some(tag => log.metadata.tags?.includes(tag)),
      );
    }

    // User filter
    if (query.userId) {
      results = results.filter(log => log.metadata.userId === query.userId);
    }

    // Screen filter
    if (query.screen) {
      results = results.filter(log => log.metadata.screen === query.screen);
    }

    // Component filter
    if (query.component) {
      results = results.filter(
        log => log.metadata.component === query.component,
      );
    }

    // Time range filter
    if (query.fromTimestamp) {
      results = results.filter(log => log.timestamp >= query.fromTimestamp!);
    }
    if (query.toTimestamp) {
      results = results.filter(log => log.timestamp <= query.toTimestamp!);
    }

    // Sorting
    const sortBy = query.sortBy ?? 'timestamp';
    const sortOrder = query.sortOrder ?? 'desc';

    results.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'timestamp') {
        compareValue = a.timestamp - b.timestamp;
      } else if (sortBy === 'level') {
        const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
        compareValue = levels.indexOf(a.level) - levels.indexOf(b.level);
      } else if (sortBy === 'category') {
        compareValue = (a.metadata.category ?? '').localeCompare(
          b.metadata.category ?? '',
        );
      }

      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    // Pagination
    const start = query.offset ?? 0;
    const end = start + (query.limit ?? this.config.maxSearchResults);

    return results.slice(start, end);
  }

  // Analytics & Reporting
  getAnalytics(timeRange?: { from: number; to: number }): LogAnalytics {
    let logs = this.logs;

    if (timeRange) {
      logs = logs.filter(
        log => log.timestamp >= timeRange.from && log.timestamp <= timeRange.to,
      );
    }

    const logsByLevel = logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] ?? 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>,
    );

    const logsByCategory = logs.reduce(
      (acc, log) => {
        const category = log.metadata.category ?? 'uncategorized';
        acc[category] = (acc[category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const errorLogs = logs.filter(log =>
      ['error', 'fatal'].includes(log.level),
    );
    const errorGroups = errorLogs.reduce(
      (acc, log) => {
        const key = log.fingerprint ?? log.message;
        if (!acc[key]) {
          acc[key] = { message: log.message, count: 0, lastSeen: 0 };
        }
        acc[key].count++;
        acc[key].lastSeen = Math.max(acc[key].lastSeen, log.timestamp);
        return acc;
      },
      {} as Record<
        string,
        { message: string; count: number; lastSeen: number }
      >,
    );

    const topErrors = Object.values(errorGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const performanceLogs = logs.filter(log => log.metadata.duration);
    const averageRenderTime =
      performanceLogs.length > 0
        ? performanceLogs.reduce(
            (sum, log) => sum + (log.metadata.duration ?? 0),
            0,
          ) / performanceLogs.length
        : 0;

    const memoryUsageLogs = logs.filter(log => log.metadata.memoryUsage);
    const averageMemoryUsage =
      memoryUsageLogs.length > 0
        ? memoryUsageLogs.reduce(
            (sum, log) => sum + (log.metadata.memoryUsage ?? 0),
            0,
          ) / memoryUsageLogs.length
        : 0;

    const errorRate = logs.length > 0 ? errorLogs.length / logs.length : 0;

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsByCategory,
      topErrors,
      performanceMetrics: {
        averageRenderTime,
        memoryUsage: averageMemoryUsage,
        errorRate,
      },
      timeSeriesData: this.generateTimeSeriesData(logs),
    };
  }

  private generateTimeSeriesData(
    logs: LogEntry[],
  ): Array<{ timestamp: number; count: number; level: LogLevel }> {
    // Group logs by hour for time series
    const hourlyData = logs.reduce(
      (acc, log) => {
        const hour =
          Math.floor(log.timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60);
        const key = `${hour}-${log.level}`;

        if (!acc[key]) {
          acc[key] = { timestamp: hour, count: 0, level: log.level };
        }
        acc[key].count++;

        return acc;
      },
      {} as Record<
        string,
        { timestamp: number; count: number; level: LogLevel }
      >,
    );

    return Object.values(hourlyData).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Export & Persistence
  async flush(): Promise<void> {
    try {
      await AsyncStorage.setItem('@advanced_logs', JSON.stringify(this.logs));
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to flush logs:', error);
      }
    }
  }

  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    await this.flush();

    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = [
        'timestamp',
        'level',
        'message',
        'category',
        'screen',
        'component',
        'userId',
      ];
      const csvRows = [
        headers.join(','),
        ...this.logs.map(log =>
          [
            new Date(log.timestamp).toISOString(),
            log.level,
            `"${log.message.replace(/"/g, '""')}"`,
            log.metadata.category ?? '',
            log.metadata.screen ?? '',
            log.metadata.component ?? '',
            log.metadata.userId ?? '',
          ].join(','),
        ),
      ];
      return csvRows.join('\n');
    }
  }

  clearLogs(): void {
    this.logs = [];
    AsyncStorage.removeItem('@advanced_logs');
    this.info('Logs cleared', { category: 'system', action: 'clear_logs' });
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Export singleton instance
export const advancedLoggingService = AdvancedLoggingService.getInstance();

// Export logging utilities for easy use throughout the app
export const Logger = {
  trace: (message: string, metadata?: LogMetadata) =>
    advancedLoggingService.trace(message, metadata),
  debug: (message: string, metadata?: LogMetadata) =>
    advancedLoggingService.debug(message, metadata),
  info: (message: string, metadata?: LogMetadata) =>
    advancedLoggingService.info(message, metadata),
  warn: (message: string, metadata?: LogMetadata) =>
    advancedLoggingService.warn(message, metadata),
  error: (message: string, metadata?: LogMetadata, error?: Error) =>
    advancedLoggingService.error(message, metadata, error),
  fatal: (message: string, metadata?: LogMetadata, error?: Error) =>
    advancedLoggingService.fatal(message, metadata, error),

  // Performance tracking
  startTimer: (name: string) =>
    advancedLoggingService.startPerformanceTracking(name),
  endTimer: (name: string, metadata?: LogMetadata) =>
    advancedLoggingService.endPerformanceTracking(name, metadata),

  // Context
  setUserId: (userId: string) => advancedLoggingService.setUserId(userId),
  setScreen: (screen: string, metadata?: LogMetadata) =>
    advancedLoggingService.setScreen(screen, metadata),

  // Search
  search: (query: LogQuery) => advancedLoggingService.search(query),

  // Analytics
  getAnalytics: (timeRange?: { from: number; to: number }) =>
    advancedLoggingService.getAnalytics(timeRange),
};

export default AdvancedLoggingService;
