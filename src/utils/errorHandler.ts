/**
 * errorHandler.ts — Typed error classes + global exception wiring
 *
 * Standards applied:
 *  - Error taxonomy: every failure has a typed class (NetworkError, ApiError, etc.)
 *  - Each class carries { code, context, recoverable } — drives UI retry logic
 *  - Global handlers: unhandledRejection + global JS error capture
 *  - ErrorHandler.handle() — single entry point for all caught errors
 *  - Never swallows errors silently — always logs + optionally re-throws
 *
 * Usage:
 *   throw new ApiError('Carbon API unreachable', 503, { endpoint: '/estimate' });
 *
 *   // In catch blocks:
 *   ErrorHandler.handle(error, 'useApiData');
 *
 *   // App entry point:
 *   ErrorHandler.installGlobalHandlers();
 */

import logger from '../services/LoggerService';

// ─── Error Taxonomy ───────────────────────────────────────────────────────────

/** Base class — all Kindred errors extend this */
export class KindredError extends Error {
  readonly code: string;
  readonly context?: Record<string, any>;
  readonly recoverable: boolean; // true = show retry UI, false = show fatal screen

  constructor(
    message: string,
    code: string,
    options: { context?: Record<string, any>; recoverable?: boolean } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;

    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** HTTP/network level failures */
export class NetworkError extends KindredError {
  readonly statusCode?: number;
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, any>,
  ) {
    super(message, 'NETWORK_ERROR', { context, recoverable: true });
    this.statusCode = statusCode;
  }
}

/** API returned a well-formed error response */
export class ApiError extends KindredError {
  readonly statusCode: number;
  constructor(
    message: string,
    statusCode: number,
    context?: Record<string, any>,
  ) {
    super(message, `API_${statusCode}`, {
      context,
      recoverable: statusCode < 500,
    });
    this.statusCode = statusCode;
  }
}

/** Auth / session failures */
export class AuthError extends KindredError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', { context, recoverable: true });
  }
}

/** Request timed out */
export class TimeoutError extends KindredError {
  constructor(message = 'Request timed out', context?: Record<string, any>) {
    super(message, 'TIMEOUT', { context, recoverable: true });
  }
}

/** Data validation / parse failures */
export class ValidationError extends KindredError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', { context, recoverable: false });
  }
}

/** IoT device connection failures */
export class IoTConnectionError extends KindredError {
  constructor(message: string, deviceId?: string) {
    super(message, 'IOT_CONNECTION_ERROR', {
      context: { deviceId },
      recoverable: true,
    });
  }
}

// ─── Error Classification ─────────────────────────────────────────────────────

/** Classify an any caught value into our typed hierarchy */
export function classifyError(err: any): KindredError {
  if (err instanceof KindredError) return err;

  if (err instanceof TypeError && err.message.includes('Network')) {
    return new NetworkError(err.message);
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') return new TimeoutError(err.message);
    return new KindredError(err.message, 'UNKNOWN_ERROR', {
      recoverable: true,
    });
  }

  return new KindredError(
    typeof err === 'string' ? err : 'An any error occurred',
    'UNKNOWN_ERROR',
    { recoverable: true },
  );
}

// ─── ErrorHandler (Strategy pattern — pluggable behaviour per error type) ────

class ErrorHandlerClass {
  private readonly log = logger.withTag('ErrorHandler');

  /**
   * Central error processing.
   * @param err    The caught value (any — could be anything)
   * @param source A string identifying where the error came from (e.g. 'useApiData')
   * @param rethrow Set true to rethrow after logging (default: false)
   */
  handle(err: any, source: string, rethrow = false): KindredError {
    const typed = classifyError(err);

    // Structured log with full context
    this.log.error(`[${source}] ${typed.code}: ${typed.message}`, {
      code: typed.code,
      source,
      context: typed.context,
      recoverable: typed.recoverable,
      stack: typed.stack,
    });

    if (rethrow) throw typed;
    return typed;
  }

  /**
   * Install global handlers for uncaught JS errors and unhandled promise rejections.
   * Call once from App.tsx / index.ts.
   */
  installGlobalHandlers(): void {
    // React Native global error handler
    const globalAny = global as any;
    const previousHandler = globalAny.ErrorUtils?.getGlobalHandler?.();

    globalAny.ErrorUtils?.setGlobalHandler?.(
      (error: Error, isFatal?: boolean) => {
        logger.error(
          'Global',
          isFatal ? 'FATAL JS ERROR' : 'Uncaught JS Error',
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
        );
        if (previousHandler) previousHandler(error, isFatal);
      },
    );

    // Unhandled promise rejections (works in hermes/JSC)
    const HermesInternal = (global as any).HermesInternal;
    if (HermesInternal?.hasPromise?.()) {
      (global as any).onunhandledrejection = (event: { reason: any }) => {
        logger.error(
          'Global',
          'Unhandled Promise Rejection',
          event.reason instanceof Error
            ? { message: event.reason.message, stack: event.reason.stack }
            : event.reason,
        );
      };
    }

    logger.info('ErrorHandler', 'Global error handlers installed');
  }
}

export const ErrorHandler = new ErrorHandlerClass();
export default ErrorHandler;
