/**
 * TelemetryService.ts — Unified User Action Telemetry & Crash Reporting
 *
 * Integrates PostHog (Product Analytics, Autocapture, Clicks, Funnels, Session Replay)
 * with Sentry (Native/JS Crash Symbolication, Release Health, Error Grouping).
 *
 * Sentry issues are tagged with PostHog's distinct ID and session ID, enabling
 * 1-click jumps from a Sentry error directly into the PostHog session replay.
 */

import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import Config from 'react-native-config';
import logger from './LoggerService';

const log = logger.withTag('TelemetryService');

export interface UserTraits {
  email?: string;
  name?: string;
  corporateDomain?: string;
  isCorporateVerified?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class TelemetryService {
  private static instance: TelemetryService | null = null;
  private posthog: PostHog | null = null;
  private isInitialized = false;

  private readonly posthogApiKey: string;
  private readonly posthogHost: string;
  private readonly sentryDsn: string;

  private constructor() {
    this.posthogApiKey = (Config.POSTHOG_API_KEY as string) || '';
    this.posthogHost = (Config.POSTHOG_HOST as string) || 'https://us.i.posthog.com';
    this.sentryDsn = (Config.SENTRY_DSN as string) || '';
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Initializes both PostHog and Sentry, establishes cross-service linking,
   * and hooks LoggerService remote handler.
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // 1. Initialize PostHog client
      const apiKey = this.posthogApiKey || 'phc_kindred_dev_placeholder';
      this.posthog = new PostHog(apiKey, {
        host: this.posthogHost,
        captureAppLifecycleEvents: true,
        persistence: 'file',
        enablePersistSessionIdAcrossRestart: true,
      });

      // 2. Initialize Sentry (if valid DSN provided)
      const hasValidSentryDsn =
        Boolean(this.sentryDsn) &&
        this.sentryDsn !== 'your_sentry_dsn' &&
        this.sentryDsn.startsWith('http');

      Sentry.init({
        dsn: this.sentryDsn,
        enabled: hasValidSentryDsn,
        tracesSampleRate: 1.0,
        enableAutoSessionTracking: true,
        attachStacktrace: true,
      });

      // 3. Cross-link PostHog with Sentry
      if (hasValidSentryDsn && this.posthog) {
        const distinctId = this.posthog.getDistinctId();
        if (distinctId) {
          Sentry.setTag('posthog_distinct_id', distinctId);
        }
      }

      // 4. Connect LoggerService to forward errors and warnings
      logger.setRemoteHandler(entry => {
        if (entry.level === 'ERROR') {
          if (entry.error) {
            Sentry.captureException(entry.error, {
              extra: { tag: entry.tag, message: entry.message, data: entry.data },
            });
          } else {
            Sentry.captureMessage(`[${entry.tag}] ${entry.message}`, {
              level: 'error',
              extra: entry.data,
            });
          }

          this.track('app_logger_error', {
            tag: entry.tag,
            message: entry.message,
            timestamp: entry.timestamp,
          });
        } else if (entry.level === 'WARN') {
          Sentry.addBreadcrumb({
            category: entry.tag,
            message: entry.message,
            level: 'warning',
            data: entry.data,
          });
        }
      });

      this.isInitialized = true;
      log.info('TelemetryService initialized successfully', {
        posthogEnabled: Boolean(this.posthogApiKey),
        sentryEnabled: hasValidSentryDsn,
      });
    } catch (error) {
      log.error('Failed to initialize TelemetryService', error as Error);
    }
  }

  /**
   * Returns the underlying PostHog client for PostHogProvider
   */
  public getPostHogClient(): PostHog {
    if (!this.posthog) {
      this.init();
    }
    return this.posthog as PostHog;
  }

  /**
   * Identifies user across both PostHog and Sentry
   */
  public identify(userId: string, traits?: UserTraits): void {
    try {
      if (this.posthog) {
        this.posthog.identify(userId, traits);
      }

      Sentry.setUser({
        id: userId,
        email: traits?.email,
        username: traits?.name,
        ...traits,
      });

      Sentry.setTag('posthog_distinct_id', userId);
      log.debug(`User identified for telemetry: ${userId}`);
    } catch (error) {
      log.warn('Failed to identify user in telemetry', error);
    }
  }

  /**
   * Resets identity across both platforms on logout
   */
  public reset(): void {
    try {
      if (this.posthog) {
        this.posthog.reset();
      }
      Sentry.setUser(null);
      log.debug('Telemetry identity reset');
    } catch (error) {
      log.warn('Failed to reset telemetry identity', error);
    }
  }

  /**
   * Tracks a custom action or business event in PostHog
   * and leaves a breadcrumb in Sentry.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public track(event: string, properties?: Record<string, any>): void {
    try {
      if (this.posthog) {
        this.posthog.capture(event, properties);
      }

      Sentry.addBreadcrumb({
        category: 'user_action',
        message: event,
        data: properties,
        level: 'info',
      });
    } catch (error) {
      log.warn(`Failed to track event ${event}`, error);
    }
  }

  /**
   * Tracks a screen navigation in PostHog and records a Sentry breadcrumb
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public screen(screenName: string, properties?: Record<string, any>): void {
    try {
      if (this.posthog) {
        this.posthog.screen(screenName, properties);
      }

      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${screenName}`,
        data: properties,
        level: 'info',
      });
    } catch (error) {
      log.warn(`Failed to track screen ${screenName}`, error);
    }
  }

  /**
   * Captures an unexpected exception in Sentry and logs it to PostHog
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public captureException(error: Error | unknown, context?: Record<string, any>): void {
    try {
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: context });
        if (this.posthog) {
          this.posthog.capture('app_exception', {
            error_name: error.name,
            error_message: error.message,
            stack: error.stack ?? '',
            ...context,
          });
        }
      } else {
        Sentry.captureMessage(String(error), { extra: context });
        if (this.posthog) {
          this.posthog.capture('app_exception', {
            error_message: String(error),
            ...context,
          });
        }
      }
    } catch (err) {
      log.error('Failed to capture exception in telemetry', err as Error);
    }
  }

  /**
   * Flushes queued events
   */
  public async flush(): Promise<void> {
    try {
      if (this.posthog) {
        await this.posthog.flush();
      }
    } catch (error) {
      log.warn('Failed to flush telemetry events', error);
    }
  }
}

export const telemetryService = TelemetryService.getInstance();
export default telemetryService;
