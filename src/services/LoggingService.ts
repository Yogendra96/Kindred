/**
 * LoggingService.ts — DEPRECATED
 *
 * @deprecated Use `logger` from `../../services/LoggerService` instead.
 *
 * This file is a backward-compatible barrel re-export.
 * All imports of `LoggingService` continue to work without changes,
 * but now route through the canonical `LoggerService`.
 */
import logger from './LoggerService';

/** @deprecated Use logger.withTag(tag) from LoggerService */
export class LoggingService {
  private static _instance: LoggingService | null = null;
  private readonly _tag: string;

  private constructor(tag: string) {
    this._tag = tag;
  }

  static getInstance(): LoggingService {
    if (!LoggingService._instance) {
      LoggingService._instance = new LoggingService('LoggingService');
    }
    return LoggingService._instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, data?: any): void {
    logger.debug(this._tag, message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: any): void {
    logger.info(this._tag, message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: any): void {
    logger.warn(this._tag, message, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, err?: any): void {
    logger.error(this._tag, message, err);
  }
  setLogLevel(level: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.setMinLevel(level as any);
  }
}

export default LoggingService.getInstance();
