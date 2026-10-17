import * as Sentry from '@sentry/react-native';
import { TelemetryService } from '../TelemetryService';
import logger from '../LoggerService';

describe('TelemetryService', () => {
  let telemetry: TelemetryService;

  beforeEach(() => {
    jest.clearAllMocks();
    telemetry = TelemetryService.getInstance();
    telemetry.init();
  });

  it('initializes PostHog and Sentry with proper configuration', () => {
    expect(telemetry.getPostHogClient()).toBeDefined();
    expect(Sentry.init).toHaveBeenCalled();
  });

  it('identifies users across both PostHog and Sentry', () => {
    const posthog = telemetry.getPostHogClient();
    telemetry.identify('user_123', {
      email: 'alex@company.com',
      corporateDomain: 'company.com',
    });

    expect(posthog.identify).toHaveBeenCalledWith('user_123', {
      email: 'alex@company.com',
      corporateDomain: 'company.com',
    });
    expect(Sentry.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user_123',
        email: 'alex@company.com',
        corporateDomain: 'company.com',
      }),
    );
    expect(Sentry.setTag).toHaveBeenCalledWith('posthog_distinct_id', 'user_123');
  });

  it('resets identity on logout', () => {
    const posthog = telemetry.getPostHogClient();
    telemetry.reset();

    expect(posthog.reset).toHaveBeenCalled();
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('tracks custom business events in PostHog and leaves Sentry breadcrumbs', () => {
    const posthog = telemetry.getPostHogClient();
    telemetry.track('voucher_redeemed', {
      brand: 'Amazon India',
      amountCents: 500,
    });

    expect(posthog.capture).toHaveBeenCalledWith('voucher_redeemed', {
      brand: 'Amazon India',
      amountCents: 500,
    });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'user_action',
        message: 'voucher_redeemed',
        data: { brand: 'Amazon India', amountCents: 500 },
      }),
    );
  });

  it('tracks screen views and adds Sentry navigation breadcrumbs', () => {
    const posthog = telemetry.getPostHogClient();
    telemetry.screen('WalletScreen', { tab: 'vouchers' });

    expect(posthog.screen).toHaveBeenCalledWith('WalletScreen', { tab: 'vouchers' });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'navigation',
        message: 'Navigated to WalletScreen',
        data: { tab: 'vouchers' },
      }),
    );
  });

  it('captures exceptions in both Sentry and PostHog', () => {
    const posthog = telemetry.getPostHogClient();
    const testError = new Error('Payment gateway timeout');

    telemetry.captureException(testError, { screen: 'WalletScreen', action: 'payout' });

    expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
      extra: { screen: 'WalletScreen', action: 'payout' },
    });
    expect(posthog.capture).toHaveBeenCalledWith('app_exception', {
      error_name: 'Error',
      error_message: 'Payment gateway timeout',
      stack: expect.any(String),
      screen: 'WalletScreen',
      action: 'payout',
    });
  });

  it('forwards LoggerService errors and warnings to Sentry and PostHog', () => {
    const testLog = logger.withTag('TestComponent');

    testLog.warn('Potential memory spike detected', { memMb: 450 });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'TestComponent',
        message: 'Potential memory spike detected',
        level: 'warning',
      }),
    );

    testLog.error('Unhandled failure', { detail: 'fatal crash' });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      '[TestComponent] Unhandled failure',
      expect.objectContaining({
        level: 'error',
      }),
    );
  });
});
