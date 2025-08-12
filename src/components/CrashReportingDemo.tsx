/**
 * Crash Reporting Demo Component
 * Demonstrates various error monitoring and crash reporting scenarios
 * FOR DEVELOPMENT/TESTING PURPOSES ONLY
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';

import { ErrorMonitoringService } from '../services/ErrorMonitoringService';
import type {
  CrashReport,
  ErrorPattern,
  PerformanceMetrics,
} from '../services/ErrorMonitoringService';
import { useErrorHandler } from './ErrorBoundary';

// Color constants to avoid literals
const COLORS = {
  white: 'white',
  black: '#000',
  green: '#28a745',
  red: '#dc3545',
  blue: '#007bff',
  gray: '#6c757d',
  darkGray: '#495057',
  lightGray: '#f8f9fa',
  orange: '#e67e22',
  lightYellow: '#fef9e7',
} as const;

interface CrashReportingDemoProps {
  visible: boolean;
  onClose: () => void;
}

interface ErrorStatistics {
  totalErrors: number;
  recentErrors: CrashReport[];
  errorPatterns: ErrorPattern[];
  performanceMetrics: PerformanceMetrics[];
}

/**
 * Demo component for testing error monitoring features
 * This component should only be available in development builds
 */
export const CrashReportingDemo: React.FC<CrashReportingDemoProps> = ({
  visible,
  onClose,
}) => {
  const [performanceMonitoring, setPerformanceMonitoring] = useState(true);
  const [errorStats, setErrorStats] = useState<ErrorStatistics | null>(null);
  const { reportError, reportPerformanceIssue, addBreadcrumb } =
    useErrorHandler();

  useEffect(() => {
    if (visible) {
      updateErrorStats();
      addBreadcrumb('Crash Reporting Demo opened', 'demo', 'info');
    }
  }, [visible, addBreadcrumb]);

  const updateErrorStats = () => {
    const stats = ErrorMonitoringService.getErrorStatistics();
    setErrorStats(stats);
  };

  // Demo error scenarios
  const triggerJavaScriptError = () => {
    try {
      // Intentional error for testing
      throw new Error('Demo JavaScript error from Crash Reporting Demo');
    } catch (error) {
      reportError(error as Error, {
        demo: true,
        trigger: 'manual_js_error',
        timestamp: Date.now(),
      });
    }
  };

  const triggerAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Demo async operation failed'));
        }, 1000);
      });
    } catch (error) {
      reportError(error as Error, {
        demo: true,
        trigger: 'async_error',
        operation: 'fake_api_call',
      });
    }
  };

  const triggerNetworkError = () => {
    reportError(new Error('Network request failed: timeout after 30s'), {
      demo: true,
      trigger: 'network_error',
      url: 'https://api.example.com/carbon-data',
      method: 'POST',
      statusCode: 0,
    });
  };

  const triggerCarbonCalculationError = () => {
    const carbonError = new Error(
      'Carbon calculation API returned invalid response',
    );

    ErrorMonitoringService.reportCarbonError(
      carbonError,
      {
        type: 'transport',
        distance: 15.5,
        fuelType: 'electric',
        location: { lat: 40.7128, lng: -74.006 },
      },
      'demo-user-123',
    );
  };

  const triggerPerformanceIssue = () => {
    // Simulate slow operation
    const startTime = Date.now();

    // Fake slow operation
    const slowOperation = () => {
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random();
      }
      return result;
    };

    slowOperation();

    const duration = Date.now() - startTime;

    reportPerformanceIssue('demo_slow_calculation', duration, 100); // 100ms threshold
  };

  const triggerMemoryIssue = () => {
    reportPerformanceIssue('demo_memory_intensive', 2000, 1000);

    ErrorMonitoringService.reportPerformanceIssue({
      operation: 'memory_allocation',
      duration: 500,
      memory: 50 * 1024 * 1024, // 50MB
      cpu: 85, // 85% CPU usage
    });
  };

  const addTestBreadcrumbs = () => {
    addBreadcrumb('User started carbon tracking session', 'user_action');
    addBreadcrumb('Selected transportation mode: car', 'user_input');
    addBreadcrumb('Entered distance: 25.5 km', 'user_input');
    addBreadcrumb('API request started', 'network');
    addBreadcrumb('API request completed successfully', 'network');
    addBreadcrumb('Carbon footprint calculated: 5.2 kg CO2', 'calculation');
  };

  const simulateUserJourney = async () => {
    addBreadcrumb('Demo user journey started', 'demo');

    // Simulate multiple user actions
    const actions = [
      { action: 'app_opened', delay: 100 },
      { action: 'login_attempted', delay: 500 },
      { action: 'dashboard_viewed', delay: 200 },
      { action: 'carbon_tracker_opened', delay: 300 },
      { action: 'transport_selected', delay: 250 },
      { action: 'calculation_triggered', delay: 400 },
    ];

    for (const { action, delay } of actions) {
      await new Promise(resolve => setTimeout(resolve, delay));
      addBreadcrumb(`User action: ${action}`, 'user_journey');
    }

    // End with a simulated error
    setTimeout(() => {
      reportError(new Error('User journey ended with calculation timeout'), {
        demo: true,
        journey_step: 'calculation',
        total_actions: actions.length,
      });
    }, 500);
  };

  const testTransactionMonitoring = async () => {
    const transaction = ErrorMonitoringService.startTransaction(
      'demo_carbon_calculation',
      'performance',
    );

    addBreadcrumb('Performance transaction started', 'performance');

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (transaction) {
      transaction.setTag('demo', 'true');
      transaction.setTag('calculation_type', 'transport');
    }

    ErrorMonitoringService.finishTransaction();
    addBreadcrumb('Performance transaction completed', 'performance');
  };

  const clearDemoData = () => {
    ErrorMonitoringService.clearErrorData();
    updateErrorStats();
    Alert.alert('Demo Data Cleared', 'All demo error data has been cleared.');
  };

  const exportErrorReport = async () => {
    const stats = ErrorMonitoringService.getErrorStatistics();
    const report = {
      timestamp: new Date().toISOString(),
      app_version: '1.0.0',
      platform: 'react-native',
      demo_mode: true,
      ...stats,
    };

    // Log error report for development debugging
    if (__DEV__) {
      console.warn('📊 Error Report Export:', JSON.stringify(report, null, 2));
    }
    Alert.alert(
      'Error Report Exported',
      'Check the console for the full error report data.',
    );
  };

  if (!visible || !__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🚨 Crash Reporting Demo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Test Error Monitoring & Crash Reporting
        </Text>
        <Text style={styles.warning}>
          ⚠️ Development Only - Do not use in production!
        </Text>

        {/* Error Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Error Statistics</Text>
          {errorStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statText}>
                Total Errors: {errorStats.totalErrors}
              </Text>
              <Text style={styles.statText}>
                Error Patterns: {errorStats.errorPatterns.length}
              </Text>
              <Text style={styles.statText}>
                Performance Metrics: {errorStats.performanceMetrics.length}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={updateErrorStats}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>🔄 Refresh Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Error Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐛 Error Testing</Text>

          <TouchableOpacity
            onPress={triggerJavaScriptError}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Trigger JavaScript Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerAsyncError}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Trigger Async Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerNetworkError}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Trigger Network Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerCarbonCalculationError}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>
              Trigger Carbon Calculation Error
            </Text>
          </TouchableOpacity>
        </View>

        {/* Performance Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Performance Testing</Text>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Performance Monitoring:</Text>
            <Switch
              value={performanceMonitoring}
              onValueChange={setPerformanceMonitoring}
            />
          </View>

          <TouchableOpacity
            onPress={triggerPerformanceIssue}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Trigger Performance Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerMemoryIssue}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Trigger Memory Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={testTransactionMonitoring}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>
              Test Transaction Monitoring
            </Text>
          </TouchableOpacity>
        </View>

        {/* Breadcrumb Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍞 Breadcrumb Testing</Text>

          <TouchableOpacity
            onPress={addTestBreadcrumbs}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Add Test Breadcrumbs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={simulateUserJourney}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>Simulate User Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗂️ Data Management</Text>

          <TouchableOpacity
            onPress={exportErrorReport}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>📤 Export Error Report</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={clearDemoData} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>🗑️ Clear Demo Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          This demo helps test error monitoring in development. All errors are
          intentional for testing purposes.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 6,
    marginBottom: 8,
    padding: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: COLORS.red,
    borderRadius: 6,
    padding: 12,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: COLORS.lightGray,
    flex: 1,
  },
  content: {
    padding: 16,
  },
  footer: {
    color: COLORS.gray,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    color: COLORS.darkGray,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statText: {
    color: COLORS.gray,
    fontSize: 14,
    marginBottom: 4,
  },
  statsContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 12,
    padding: 12,
  },
  subtitle: {
    color: COLORS.darkGray,
    fontSize: 16,
    marginBottom: 8,
  },
  switchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 6,
    marginBottom: 8,
    padding: 12,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: COLORS.red,
    fontSize: 20,
    fontWeight: 'bold',
  },
  warning: {
    backgroundColor: COLORS.lightYellow,
    borderRadius: 4,
    color: COLORS.orange,
    fontSize: 14,
    marginBottom: 16,
    padding: 8,
    textAlign: 'center',
  },
});
