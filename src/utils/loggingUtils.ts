/**
 * loggingUtils.ts — DEPRECATED / CONSOLIDATED
 *
 * @deprecated Use `logger` from `../../services/LoggerService` instead.
 *
 * Backward-compatible re-exports. Convenience functions here are thin wrappers
 * around the canonical LoggerService so no call-site changes are required.
 */
import logger from '../services/LoggerService';

// ─── createLogger (most-used export) ─────────────────────────────────────────

/** @deprecated Use logger.withTag(tag) */
export const createLogger = (tagOrOpts: string | { prefix: string }) => {
  const tag = typeof tagOrOpts === 'string' ? tagOrOpts : tagOrOpts.prefix;
  return logger.withTag(tag);
};

// ─── PerformanceLogger ────────────────────────────────────────────────────────

/** @deprecated Use const stop = logger.perf(tag, label); ... stop(); */
export class PerformanceLogger {
  private readonly tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
  startTimer(label: string): () => void {
    return logger.perf(this.tag, label);
  }
  endTimer(_label: string): void {
    /* no-op — use the returned stopper from startTimer */
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async measureAsync<T>(label: string, fn: () => Promise<T>, _metadata?: any): Promise<T> {
    const stop = this.startTimer(label);
    try {
      return await fn();
    } finally {
      stop();
    }
  }
}

// ─── API logging helpers (absorbed into LoggerService.info) ──────────────────

/** @deprecated Use logger.info(tag, 'api:request', {url, method}) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAPIRequest = (
  tagOrLogger: any,
  arg1?: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
): void => {
  const tag = typeof tagOrLogger === 'string' ? tagOrLogger : 'API';
  logger.info(tag, 'api:request', { arg1, arg2, arg3, arg4 });
};

/** @deprecated Use logger.info(tag, 'api:response', {...}) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAPIResponse = (
  tagOrLogger: any,
  arg1?: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
  arg5?: any,
): void => {
  const tag = typeof tagOrLogger === 'string' ? tagOrLogger : 'API';
  logger.info(tag, 'api:response', { arg1, arg2, arg3, arg4, arg5 });
};

/** @deprecated Use logger.error(tag, 'api:error', error) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAPIError = (
  tagOrLogger: any,
  arg1?: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
): void => {
  const tag = typeof tagOrLogger === 'string' ? tagOrLogger : 'API';
  logger.error(tag, 'api:error', { arg1, arg2, arg3, arg4 });
};

/** @deprecated Use logger.info(tag, 'carbon:calc', data) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logCarbonCalculation = (tag: string, data: any): void =>
  logger.info(tag, 'carbon:calc', data);

/** @deprecated Use logger.info(tag, 'form:validation', data) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logFormValidation = (tag: string, data: any): void =>
  logger.info(tag, 'form:validation', data);

/** @deprecated Use logger.info(tag, 'user:action', data) */
export const logUserAction = (
  tag: string,
  action: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
): void => logger.info(tag, `user:action ${action}`, data);

// ─── BatchLogger ──────────────────────────────────────────────────────────────

/** @deprecated Use logger directly — no batching needed (env-aware) */
export class BatchLogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(tag: string, message: string, data?: any): void {
    logger.info(tag, message, data);
  }
  flush(): void {
    /* no-op */
  }
  destroy(): void {
    /* no-op */
  }
}
