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

  debug(message: string, data?: unknown): void {
    logger.debug(this._tag, message, data);
  }
  info(message: string, data?: unknown): void {
    logger.info(this._tag, message, data);
  }
  warn(message: string, data?: unknown): void {
    logger.warn(this._tag, message, data);
  }
  error(message: string, err?: unknown): void {
    logger.error(this._tag, message, err);
  }
  setLogLevel(level: string): void {
    logger.setMinLevel(level as any);
  }
}

export default LoggingService.getInstance();
