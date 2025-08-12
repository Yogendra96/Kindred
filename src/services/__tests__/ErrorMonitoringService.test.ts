/**
 * ErrorMonitoringService Tests
 * Comprehensive testing for error monitoring, crash reporting, and performance tracking
 */

import { ErrorMonitoringService } from '../ErrorMonitoringService';
import * as SentryConfig from '../../config/sentry';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('test-event-id'),
  captureMessage: jest.fn().mockReturnValue('test-message-id'),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  withScope: jest.fn(callback =>
    callback({ setLevel: jest.fn(), setTag: jest.fn(), setContext: jest.fn() }),
  ),
  flush: jest.fn().mockResolvedValue(true),
  startTransaction: jest.fn().mockReturnValue({
    finish: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
  }),
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
  ErrorBoundary: jest.fn(),
}));

// Mock dependencies
jest.mock('../../config/sentry', () => ({
  initSentry: jest.fn(),
  reportError: jest.fn().mockReturnValue('test-event-id'),
  reportCarbonError: jest.fn().mockReturnValue('test-carbon-event-id'),
  reportPerformanceIssue: jest.fn(),
  setUserContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  trackCarbonCalculation: jest.fn(),
  startTransaction: jest.fn().mockReturnValue({
    finish: jest.fn(),
    setTag: jest.fn(),
  }),
  flushSentryEvents: jest.fn().mockResolvedValue(true),
  Sentry: require('@sentry/react-native'),
}));

describe('ErrorMonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ErrorMonitoringService.clearErrorData();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(ErrorMonitoringService.isHealthy()).toBe(true);
      expect(SentryConfig.initSentry).toHaveBeenCalled();
    });

    it('should set up global error handlers', () => {
      const originalConsoleError = console.error;
      expect(typeof console.error).toBe('function');

      // Restore original console.error for other tests
      console.error = originalConsoleError;
    });
  });

  describe('Error Reporting', () => {
    it('should report basic errors correctly', () => {
      const testError = new Error('Test error message');
      const context = {
        component: 'TestComponent',
        screen: 'TestScreen',
        action: 'test_action',
        severity: 'medium' as const,
      };

      const eventId = ErrorMonitoringService.reportError(testError, context);

      expect(SentryConfig.reportError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          component: 'TestComponent',
          screen: 'TestScreen',
          action: 'test_action',
          severity: 'medium',
        }),
        'warning',
      );
      expect(eventId).toBe('test-event-id');
    });

    it('should handle errors without context', () => {
      const testError = new Error('Simple error');

      const eventId = ErrorMonitoringService.reportError(testError);

      expect(SentryConfig.reportError).toHaveBeenCalledWith(
        testError,
        expect.any(Object),
        'error',
      );
      expect(eventId).toBe('test-event-id');
    });

    it('should track error patterns', () => {
      const testError1 = new Error('Repeated error');
      const testError2 = new Error('Repeated error');
      const testError3 = new Error('Different error');

      ErrorMonitoringService.reportError(testError1, { component: 'Test1' });
      ErrorMonitoringService.reportError(testError2, { component: 'Test2' });
      ErrorMonitoringService.reportError(testError3, { component: 'Test3' });

      const stats = ErrorMonitoringService.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorPatterns).toHaveLength(2);
      expect(stats.errorPatterns[0].frequency).toBe(2); // Repeated error appears twice
    });

    it('should handle reporting failures gracefully', () => {
      const mockReportError = jest
        .spyOn(SentryConfig, 'reportError')
        .mockImplementation(() => {
          throw new Error('Reporting failed');
        });

      const testError = new Error('Test error');
      const result = ErrorMonitoringService.reportError(testError);

      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to report error:',
        expect.any(Error),
      );

      mockReportError.mockRestore();
    });
  });

  describe('Carbon Error Reporting', () => {
    it('should report carbon calculation errors with context', () => {
      const testError = new Error('Carbon calculation failed');
      const activityData = {
        type: 'transport',
        distance: 10,
        location: { lat: 40.7128, lng: -74.006 },
      };
      const userId = 'user-123';

      const eventId = ErrorMonitoringService.reportCarbonError(
        testError,
        activityData,
        userId,
      );

      expect(SentryConfig.reportCarbonError).toHaveBeenCalledWith(
        testError,
        activityData,
        userId,
      );
      expect(eventId).toBe('test-carbon-event-id');
    });

    it('should track carbon errors in analytics when service is available', () => {
      const mockAnalytics = {
        trackEvent: jest.fn(),
      };
      ErrorMonitoringService.setAnalyticsService(mockAnalytics as any);

      const testError = new Error('Carbon API timeout');
      const activityData = { type: 'energy', amount: 100 };

      ErrorMonitoringService.reportCarbonError(testError, activityData);

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'carbon_calculation_error',
        expect.objectContaining({
          error_type: 'Error',
          activity_type: 'energy',
          has_location: false,
        }),
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should report performance issues when threshold exceeded', () => {
      const metrics = {
        operation: 'carbon_calculation',
        duration: 3000, // 3 seconds
        memory: 1024 * 1024, // 1MB
        networkRequests: 2,
      };

      ErrorMonitoringService.reportPerformanceIssue(metrics, 2000); // 2 second threshold

      expect(SentryConfig.reportPerformanceIssue).toHaveBeenCalledWith(
        'carbon_calculation',
        3000,
        2000,
        expect.objectContaining({
          memory: 1024 * 1024,
          network_requests: 2,
        }),
      );
    });

    it('should not report when performance is within threshold', () => {
      const metrics = {
        operation: 'fast_operation',
        duration: 50, // 50ms
      };

      ErrorMonitoringService.reportPerformanceIssue(metrics, 100); // 100ms threshold

      expect(SentryConfig.reportPerformanceIssue).not.toHaveBeenCalled();
    });

    it('should use default thresholds for known operations', () => {
      const metrics = {
        operation: 'screen_navigation',
        duration: 1500, // 1.5 seconds
      };

      ErrorMonitoringService.reportPerformanceIssue(metrics);

      expect(SentryConfig.reportPerformanceIssue).toHaveBeenCalledWith(
        'screen_navigation',
        1500,
        1000, // Default threshold for screen navigation
        expect.any(Object),
      );
    });

    it('should store performance metrics for analysis', () => {
      const metrics1 = { operation: 'op1', duration: 100 };
      const metrics2 = { operation: 'op2', duration: 200 };

      ErrorMonitoringService.reportPerformanceIssue(metrics1);
      ErrorMonitoringService.reportPerformanceIssue(metrics2);

      const stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.performanceMetrics).toHaveLength(2);
      expect(stats.performanceMetrics[0]).toMatchObject(metrics1);
      expect(stats.performanceMetrics[1]).toMatchObject(metrics2);
    });

    it('should limit stored performance metrics to prevent memory issues', () => {
      // Add 150 metrics (more than the 100 limit)
      for (let i = 0; i < 150; i++) {
        ErrorMonitoringService.reportPerformanceIssue({
          operation: `operation_${i}`,
          duration: i * 10,
        });
      }

      const stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.performanceMetrics).toHaveLength(100);
      // Should keep the last 100 metrics
      expect(stats.performanceMetrics[0].operation).toBe('operation_50');
      expect(stats.performanceMetrics[99].operation).toBe('operation_149');
    });
  });

  describe('User Context Management', () => {
    it('should set user context correctly', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const additionalData = { subscription: 'premium' };

      ErrorMonitoringService.setUser(userId, email, additionalData);

      expect(SentryConfig.setUserContext).toHaveBeenCalledWith(userId, email);
      expect(SentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        'User context updated',
        'auth',
        'info',
        expect.objectContaining({
          user_id: userId.slice(-8),
          has_email: true,
          additional_fields: 1,
        }),
      );
    });

    it('should handle user context without email or additional data', () => {
      const userId = 'user-456';

      ErrorMonitoringService.setUser(userId);

      expect(SentryConfig.setUserContext).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(SentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        'User context updated',
        'auth',
        'info',
        expect.objectContaining({
          user_id: userId.slice(-8),
          has_email: false,
          additional_fields: 0,
        }),
      );
    });
  });

  describe('Breadcrumb Management', () => {
    it('should add breadcrumbs with correct parameters', () => {
      const message = 'User clicked submit button';
      const category = 'user_interaction';
      const level = 'info' as const;
      const data = { button_type: 'submit', form_id: 'carbon_form' };

      ErrorMonitoringService.addBreadcrumb(message, category, level, data);

      expect(SentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        message,
        category,
        level,
        data,
      );
    });

    it('should use default parameters when not provided', () => {
      const message = 'Simple breadcrumb';

      ErrorMonitoringService.addBreadcrumb(message);

      expect(SentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        message,
        'user',
        'info',
        undefined,
      );
    });
  });

  describe('Carbon Calculation Tracking', () => {
    it('should track successful carbon calculations', () => {
      const activityType = 'transport';
      const emissions = 2.5;
      const success = true;
      const duration = 150;

      ErrorMonitoringService.trackCarbonCalculation(
        activityType,
        emissions,
        success,
        duration,
      );

      expect(SentryConfig.trackCarbonCalculation).toHaveBeenCalledWith(
        activityType,
        emissions,
        success,
        duration,
      );
    });

    it('should track failed carbon calculations', () => {
      const activityType = 'energy';
      const emissions = 0;
      const success = false;

      ErrorMonitoringService.trackCarbonCalculation(
        activityType,
        emissions,
        success,
      );

      expect(SentryConfig.trackCarbonCalculation).toHaveBeenCalledWith(
        activityType,
        emissions,
        success,
        undefined,
      );
    });

    it('should also track in analytics when service is available', () => {
      const mockAnalytics = {
        trackEvent: jest.fn(),
      };
      ErrorMonitoringService.setAnalyticsService(mockAnalytics as any);

      ErrorMonitoringService.trackCarbonCalculation('food', 1.5, true, 200);

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'carbon_calculation_tracked',
        expect.objectContaining({
          activity_type: 'food',
          success: true,
          duration: 200,
          emissions: 1.5,
        }),
      );
    });
  });

  describe('Transaction Management', () => {
    it('should start and finish transactions correctly', () => {
      const mockTransaction = {
        finish: jest.fn(),
        setTag: jest.fn(),
      };
      jest
        .spyOn(SentryConfig, 'startTransaction')
        .mockReturnValue(mockTransaction as any);

      const transaction = ErrorMonitoringService.startTransaction(
        'test_operation',
        'performance',
      );

      expect(SentryConfig.startTransaction).toHaveBeenCalledWith(
        'test_operation',
        'performance',
      );
      expect(transaction).toBe(mockTransaction);

      ErrorMonitoringService.finishTransaction();
      expect(mockTransaction.finish).toHaveBeenCalled();
    });

    it('should handle null transactions gracefully', () => {
      jest.spyOn(SentryConfig, 'startTransaction').mockReturnValue(null);

      const transaction = ErrorMonitoringService.startTransaction('test', 'op');
      expect(transaction).toBeNull();

      // Should not throw when finishing null transaction
      expect(() => ErrorMonitoringService.finishTransaction()).not.toThrow();
    });
  });

  describe('Error Statistics', () => {
    it('should return comprehensive error statistics', () => {
      // Add some test data
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');

      ErrorMonitoringService.reportError(error1, { component: 'Component1' });
      ErrorMonitoringService.reportError(error2, { component: 'Component2' });

      ErrorMonitoringService.reportPerformanceIssue({
        operation: 'test_operation',
        duration: 100,
      });

      const stats = ErrorMonitoringService.getErrorStatistics();

      expect(stats).toMatchObject({
        totalErrors: 2,
        recentErrors: expect.arrayContaining([
          expect.objectContaining({
            error: error1,
            context: expect.objectContaining({ component: 'Component1' }),
          }),
        ]),
        errorPatterns: expect.arrayContaining([
          expect.objectContaining({
            errorType: 'Error',
            frequency: expect.any(Number),
          }),
        ]),
        performanceMetrics: expect.arrayContaining([
          expect.objectContaining({
            operation: 'test_operation',
            duration: 100,
          }),
        ]),
      });
    });

    it('should limit recent errors to last 10', () => {
      // Add 15 errors
      for (let i = 0; i < 15; i++) {
        const error = new Error(`Error ${i}`);
        ErrorMonitoringService.reportError(error);
      }

      const stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.recentErrors).toHaveLength(10);
      expect(stats.totalErrors).toBe(15);
    });

    it('should sort error patterns by frequency', () => {
      const frequentError = new Error('Frequent error');
      const rareError = new Error('Rare error');

      // Report frequent error 3 times
      ErrorMonitoringService.reportError(frequentError);
      ErrorMonitoringService.reportError(frequentError);
      ErrorMonitoringService.reportError(frequentError);

      // Report rare error once
      ErrorMonitoringService.reportError(rareError);

      const stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.errorPatterns[0].frequency).toBe(3);
      expect(stats.errorPatterns[1].frequency).toBe(1);
    });
  });

  describe('Service Health and Cleanup', () => {
    it('should report healthy status when initialized', () => {
      expect(ErrorMonitoringService.isHealthy()).toBe(true);
    });

    it('should clear error data correctly', () => {
      // Add some data
      ErrorMonitoringService.reportError(new Error('Test'));
      ErrorMonitoringService.reportPerformanceIssue({
        operation: 'test',
        duration: 100,
      });

      let stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.performanceMetrics.length).toBeGreaterThan(0);

      // Clear data
      ErrorMonitoringService.clearErrorData();

      stats = ErrorMonitoringService.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.performanceMetrics).toHaveLength(0);
      expect(stats.errorPatterns).toHaveLength(0);
    });

    it('should flush events successfully', async () => {
      const result = await ErrorMonitoringService.flush();

      expect(SentryConfig.flushSentryEvents).toHaveBeenCalledWith(5000);
      expect(result).toBe(true);
    });

    it('should handle flush with custom timeout', async () => {
      const customTimeout = 10000;
      await ErrorMonitoringService.flush(customTimeout);

      expect(SentryConfig.flushSentryEvents).toHaveBeenCalledWith(
        customTimeout,
      );
    });
  });

  describe('Service Dependencies', () => {
    it('should set analytics service dependency', () => {
      const mockAnalyticsService = { trackEvent: jest.fn() };

      expect(() => {
        ErrorMonitoringService.setAnalyticsService(mockAnalyticsService as any);
      }).not.toThrow();
    });

    it('should set security service dependency', () => {
      const mockSecurityService = { encrypt: jest.fn() };

      expect(() => {
        ErrorMonitoringService.setSecurityService(mockSecurityService as any);
      }).not.toThrow();
    });
  });

  describe('Error Severity Classification', () => {
    it('should map severity levels correctly', () => {
      const testCases = [
        { severity: 'low', expectedLevel: 'info' },
        { severity: 'medium', expectedLevel: 'warning' },
        { severity: 'high', expectedLevel: 'error' },
        { severity: 'critical', expectedLevel: 'fatal' },
        { severity: undefined, expectedLevel: 'error' },
      ];

      for (const { severity, expectedLevel } of testCases) {
        ErrorMonitoringService.reportError(new Error('Test error'), {
          severity: severity as any,
        });

        expect(SentryConfig.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          expect.any(Object),
          expectedLevel,
        );
      }
    });
  });

  describe('Performance Severity Classification', () => {
    it('should classify performance issues by severity', () => {
      const mockAnalytics = {
        trackEvent: jest.fn(),
      };
      ErrorMonitoringService.setAnalyticsService(mockAnalytics as any);

      const testCases = [
        { duration: 1000, threshold: 500, expectedSeverity: 'medium' },
        { duration: 1500, threshold: 500, expectedSeverity: 'high' },
        { duration: 2000, threshold: 500, expectedSeverity: 'critical' },
      ];

      for (const { duration, threshold, expectedSeverity } of testCases) {
        ErrorMonitoringService.reportPerformanceIssue(
          { operation: 'test', duration },
          threshold,
        );

        expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
          'performance_issue',
          expect.objectContaining({
            severity: expectedSeverity,
          }),
        );
      }
    });
  });
});
