/**
 * LoggerService.ts — Structured, levelled logger for Kindred
 *
 * Standards applied:
 *  - Structured logs: always { level, tag, message, data?, timestamp, env }
 *  - Log levels: DEBUG < INFO < WARN < ERROR — configurable minimum per env
 *  - Silent in production (no console output unless explicit override)
 *  - Performance timing: logger.perf(label) → stop() → logs elapsed ms
 *  - Context tags: every call-site passes a TAG for grep-ability
 *  - Remote hook: plug in Sentry / Amplitude / Datadog via setRemoteHandler()
 *
 * Usage:
 *   const log = logger.withTag('HomeScreen');
 *   log.info('mounted');
 *   log.warn('slow API', { latencyMs: 1240 });
 *   log.error('fetch failed', error);
 *   const stop = log.perf('loadCarbonData'); // returns stopper
 *   ...await fetch...
 *   stop(); // logs: [perf] loadCarbonData took 312ms
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'PERF';

export interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: Error;
  timestamp: string; // ISO-8601
  elapsedMs?: number; // perf entries only
}

export type RemoteLogHandler = (entry: LogEntry) => void;

// ─── Level ordering ───────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  PERF: 1, // treated same priority as INFO for filtering
};

// ─── Logger class (SRP — only logs, no business logic) ────────────────────────

class Logger {
  private minLevel: LogLevel;
  private remoteHandler?: RemoteLogHandler;
  private readonly isProd: boolean;

  constructor() {
    this.isProd = process.env.NODE_ENV === 'production';
    this.minLevel = this.isProd ? 'WARN' : 'DEBUG';
  }

  // ── Configuration ────────────────────────────────────────────────────────

  /** Override minimum log level (e.g. for debugging in staging) */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /** Plug in remote handler: Sentry, Amplitude, Datadog, etc. */
  setRemoteHandler(handler: RemoteLogHandler): void {
    this.remoteHandler = handler;
  }

  // ── Core emit ────────────────────────────────────────────────────────────

  private emit(entry: LogEntry): void {
    // Filter by level
    if (LEVEL_ORDER[entry.level] < LEVEL_ORDER[this.minLevel]) return;

    // Console output (never in prod unless ERROR)
    if (!this.isProd || entry.level === 'ERROR') {
      const prefix = `[${entry.level}][${entry.tag}]`;
      const ts = entry.timestamp.slice(11, 23); // HH:MM:SS.mmm

      switch (entry.level) {
        case 'ERROR':
          // eslint-disable-next-line no-console
          console.error(
            `${prefix} ${ts} ${entry.message}`,
            entry.data ?? '',
            entry.error ?? '',
          );
          break;
        case 'WARN':
          // eslint-disable-next-line no-console
          console.warn(`${prefix} ${ts} ${entry.message}`, entry.data ?? '');
          break;
        case 'PERF':
          // eslint-disable-next-line no-console
          console.log(
            `${prefix} ${ts} ${entry.message} — ${entry.elapsedMs}ms`,
          );
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`${prefix} ${ts} ${entry.message}`, entry.data ?? '');
      }
    }

    // Always send ERROR + WARN to remote handler (e.g. Sentry)
    if (
      this.remoteHandler &&
      (entry.level === 'ERROR' || entry.level === 'WARN')
    ) {
      try {
        this.remoteHandler(entry);
      } catch {
        // Remote handler must never throw
      }
    }
  }

  private buildEntry(
    level: LogLevel,
    tag: string,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataOrError?: any,
  ): LogEntry {
    const isError = dataOrError instanceof Error;
    return {
      level,
      tag,
      message,
      data: isError ? undefined : dataOrError,
      error: isError ? dataOrError : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(tag: string, message: string, data?: any): void {
    this.emit(this.buildEntry('DEBUG', tag, message, data));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(tag: string, message: string, data?: any): void {
    this.emit(this.buildEntry('INFO', tag, message, data));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(tag: string, message: string, data?: any): void {
    this.emit(this.buildEntry('WARN', tag, message, data));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(tag: string, message: string, errorOrData?: any): void {
    this.emit(this.buildEntry('ERROR', tag, message, errorOrData));
  }

  /**
   * Start a performance timer. Returns a stop function.
   * Usage: const stop = logger.perf('TAG', 'fetchCarbonData'); await fetch(); stop();
   */
  perf(tag: string, label: string): () => void {
    const start = Date.now();
    return () => {
      const elapsedMs = Date.now() - start;
      this.emit({
        level: 'PERF',
        tag,
        message: label,
        timestamp: new Date().toISOString(),
        elapsedMs,
      });
    };
  }

  /**
   * Returns a scoped logger bound to a specific tag.
   * Usage: const log = logger.withTag('useApiData');
   *        log.info('fetching', { url });
   */
  withTag(tag: string) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      debug: (message: string, data?: any) => this.debug(tag, message, data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info: (message: string, data?: any) => this.info(tag, message, data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warn: (message: string, data?: any) => this.warn(tag, message, data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (message: string, err?: any) => this.error(tag, message, err),
      perf: (label: string) => this.perf(tag, label),
    };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const logger = new Logger();
export default logger;
