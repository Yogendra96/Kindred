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
export const createLogger = (tag: string) => logger.withTag(tag);

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
}

// ─── API logging helpers (absorbed into LoggerService.info) ──────────────────

/** @deprecated Use logger.info(tag, 'api:request', {url, method}) */
export const logAPIRequest = (tag: string, url: string, method: string): void =>
  logger.info(tag, 'api:request', { url, method });

/** @deprecated Use logger.info(tag, 'api:response', {...}) */
export const logAPIResponse = (
  tag: string,
  url: string,
  status: number,
  latencyMs?: number,
): void => logger.info(tag, 'api:response', { url, status, latencyMs });

/** @deprecated Use logger.error(tag, 'api:error', error) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAPIError = (tag: string, url: string, error: any): void =>
  logger.error(tag, `api:error ${url}`, error);

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
