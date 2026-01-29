/**
 * @fileoverview Shared Logging Utilities
 *
 * Common logging patterns to eliminate code duplication across services.
 * Follows DRY principles and provides consistent logging interface.
 *
 * @version 1.0.0
 */

import { LOG_PREFIXES, type LogPrefix } from './constants';

// ===================================================================
// TYPES
// ===================================================================

export interface LogContext {
  [key: string]: any;
}

export interface LogConfig {
  prefix: LogPrefix;
  enableTimestamps?: boolean;
  enableDetails?: boolean;
  enableColors?: boolean;
}

export interface LogMetrics {
  duration?: number;
  startTime?: number;
  endTime?: number;
  success?: boolean;
  errorCode?: string;
}

// ===================================================================
// CORE LOGGING UTILITIES
// ===================================================================

/**
 * Create a structured logger with consistent prefix and formatting
 */
export const createLogger = (config: LogConfig) => {
  const { prefix, enableTimestamps = true, enableDetails = true } = config;
  const logPrefix = LOG_PREFIXES[prefix];

  const formatMessage = (
    level: string,
    message: string,
    context?: LogContext,
  ) => {
    const timestamp = enableTimestamps ? new Date().toISOString() : '';
    const contextStr = context && enableDetails ? JSON.stringify(context) : '';

    return [
      logPrefix,
      timestamp && `[${timestamp}]`,
      `${level.toUpperCase()}:`,
      message,
      contextStr,
    ]
      .filter(Boolean)
      .join(' ');
  };

  return {
    trace: (message: string, context?: LogContext) => {
      console.trace(formatMessage('trace', message, context));
    },
    debug: (message: string, context?: LogContext) => {
      if (__DEV__) {
        console.debug(formatMessage('debug', message, context));
      }
    },
    info: (message: string, context?: LogContext) => {
      console.info(formatMessage('info', message, context));
    },
    warn: (message: string, context?: LogContext) => {
      console.warn(formatMessage('warn', message, context));
    },
    error: (message: string, context?: LogContext, error?: Error) => {
      const errorContext = error
        ? {
            ...context,
            error: error.message,
            stack: error.stack,
          }
        : context;
      console.error(formatMessage('error', message, errorContext));
    },
    success: (message: string, context?: LogContext) => {
      console.log(formatMessage('✅ success', message, context));
    },
    failure: (message: string, context?: LogContext) => {
      console.error(formatMessage('❌ failure', message, context));
    },
  };
};

// ===================================================================
// PERFORMANCE LOGGING
// ===================================================================

/**
 * Performance measurement utility with automatic timing
 */
export class PerformanceLogger {
  private timers = new Map<string, number>();
  private logger: ReturnType<typeof createLogger>;

  constructor(logPrefix: LogPrefix) {
    this.logger = createLogger({ prefix: logPrefix });
  }

  startTimer(operation: string, context?: LogContext): void {
    const startTime = performance.now();
    this.timers.set(operation, startTime);

    this.logger.debug(`Starting operation: ${operation}`, {
      ...context,
      startTime,
    });
  }

  endTimer(operation: string, context?: LogContext): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      this.logger.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.timers.delete(operation);

    const logMethod = duration > 100 ? this.logger.warn : this.logger.info;
    logMethod(`Operation completed: ${operation}`, {
      ...context,
      duration: `${duration.toFixed(2)}ms`,
      startTime,
      endTime,
    });

    return duration;
  }

  measureAsync<T>(
    operation: string,
    asyncFn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    this.startTimer(operation, context);

    return asyncFn()
      .then(result => {
        this.endTimer(operation, { ...context, success: true });
        return result;
      })
      .catch(error => {
        this.endTimer(operation, {
          ...context,
          success: false,
          error: error.message,
        });
        throw error;
      });
  }
}

// ===================================================================
// API LOGGING UTILITIES
// ===================================================================

/**
 * Standardized API request/response logging
 */
export const logAPIRequest = (
  logger: ReturnType<typeof createLogger>,
  method: string,
  url: string,
  requestId?: string,
  context?: LogContext,
) => {
  logger.info(`API Request: ${method.toUpperCase()} ${url}`, {
    method,
    url,
    requestId,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

export const logAPIResponse = (
  logger: ReturnType<typeof createLogger>,
  method: string,
  url: string,
  status: number,
  duration: number,
  requestId?: string,
  context?: LogContext,
) => {
  const logMethod = status >= 400 ? logger.error : logger.success;
  logMethod(`API Response: ${method.toUpperCase()} ${url}`, {
    method,
    url,
    status,
    duration: `${duration}ms`,
    requestId,
    success: status < 400,
    ...context,
  });
};

export const logAPIError = (
  logger: ReturnType<typeof createLogger>,
  method: string,
  url: string,
  error: Error,
  requestId?: string,
  context?: LogContext,
) => {
  logger.error(
    `API Error: ${method.toUpperCase()} ${url}`,
    {
      method,
      url,
      requestId,
      error: error.message,
      stack: error.stack,
      ...context,
    },
    error,
  );
};

// ===================================================================
// BUSINESS LOGIC LOGGING
// ===================================================================

/**
 * Carbon calculation specific logging
 */
export const logCarbonCalculation = (
  logger: ReturnType<typeof createLogger>,
  activityType: string,
  amount: number,
  emissions: number,
  method: 'api' | 'offline',
  duration: number,
  context?: LogContext,
) => {
  logger.success(`Carbon calculation completed`, {
    activityType,
    amount,
    emissions: `${emissions.toFixed(3)}kg CO2`,
    method,
    duration: `${duration}ms`,
    efficiency: `${(emissions / amount).toFixed(4)}kg CO2 per unit`,
    ...context,
  });
};

export const logFormValidation = (
  logger: ReturnType<typeof createLogger>,
  formName: string,
  isValid: boolean,
  errors: string[],
  context?: LogContext,
) => {
  const logMethod = isValid ? logger.success : logger.warn;
  logMethod(`Form validation: ${formName}`, {
    formName,
    isValid,
    errorCount: errors.length,
    errors: isValid ? undefined : errors,
    ...context,
  });
};

export const logUserAction = (
  logger: ReturnType<typeof createLogger>,
  action: string,
  component: string,
  success: boolean = true,
  context?: LogContext,
) => {
  const logMethod = success ? logger.info : logger.warn;
  logMethod(`User action: ${action}`, {
    action,
    component,
    success,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

// ===================================================================
// CACHE LOGGING
// ===================================================================

export const logCacheOperation = (
  logger: ReturnType<typeof createLogger>,
  operation: 'get' | 'set' | 'delete' | 'clear',
  key: string,
  hit: boolean = true,
  ttl?: number,
  context?: LogContext,
) => {
  const logMethod = hit ? logger.debug : logger.info;
  logMethod(`Cache ${operation}: ${key}`, {
    operation,
    key,
    hit,
    ttl: ttl ? `${ttl}ms` : undefined,
    ...context,
  });
};

// ===================================================================
// ERROR HANDLING UTILITIES
// ===================================================================

/**
 * Structured error logging with context
 */
export const logStructuredError = (
  logger: ReturnType<typeof createLogger>,
  error: Error,
  component: string,
  action: string,
  context?: LogContext,
) => {
  logger.error(
    `Error in ${component}`,
    {
      component,
      action,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context,
    },
    error,
  );
};

export const logRecoveryAttempt = (
  logger: ReturnType<typeof createLogger>,
  error: Error,
  recoveryMethod: string,
  success: boolean,
  context?: LogContext,
) => {
  const logMethod = success ? logger.success : logger.error;
  logMethod(`Error recovery attempt: ${recoveryMethod}`, {
    originalError: error.message,
    recoveryMethod,
    success,
    ...context,
  });
};

// ===================================================================
// SECURITY LOGGING
// ===================================================================

export const logSecurityEvent = (
  logger: ReturnType<typeof createLogger>,
  event:
    | 'auth_success'
    | 'auth_failure'
    | 'permission_denied'
    | 'token_expired',
  userId?: string,
  context?: LogContext,
) => {
  const logMethod = event.includes('success') ? logger.info : logger.warn;
  logMethod(`Security event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

// ===================================================================
// BATCH LOGGING
// ===================================================================

/**
 * Batch logging for performance in high-frequency operations
 */
export class BatchLogger {
  private batch: Array<{
    level: string;
    message: string;
    context?: LogContext;
    timestamp: number;
  }> = [];

  private batchSize: number;
  private flushInterval: number;
  private logger: ReturnType<typeof createLogger>;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    logPrefix: LogPrefix,
    batchSize: number = 10,
    flushInterval: number = 5000,
  ) {
    this.logger = createLogger({ prefix: logPrefix });
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }

  add(level: string, message: string, context?: LogContext): void {
    this.batch.push({
      level,
      message,
      context,
      timestamp: Date.now(),
    });

    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.batch.length === 0) return;

    this.logger.info('Batch log flush', {
      batchSize: this.batch.length,
      items: this.batch,
    });

    this.batch = [];
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export default {
  createLogger,
  PerformanceLogger,
  BatchLogger,
  logAPIRequest,
  logAPIResponse,
  logAPIError,
  logCarbonCalculation,
  logFormValidation,
  logUserAction,
  logCacheOperation,
  logStructuredError,
  logRecoveryAttempt,
  logSecurityEvent,
};
