import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';
import * as Haptics from 'expo-haptics';

import { ErrorMonitoringService } from '../services/ErrorMonitoringService';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isRetrying: boolean;
}

const { width: _screenWidth, height: _screenHeight } = Dimensions.get('window');

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
    };
    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();

    this.setState({
      errorInfo,
      errorId,
    });

    // Log error details
    this.logError(error, errorInfo, errorId);

    // Report to enhanced error monitoring service
    if (this.props.enableReporting !== false) {
      const sentryEventId = ErrorMonitoringService.reportError(error, {
        component: 'ErrorBoundary',
        action: 'component_error_caught',
        severity: 'high',
        extra: {
          errorId,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });

      // Update error ID with Sentry event ID if available
      if (sentryEventId) {
        this.setState({ errorId: sentryEventId });
      }

      // Legacy Sentry reporting for backward compatibility
      this.reportError(error, errorInfo, errorId);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Haptic feedback
    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      // Reset if any prop changed
      if (prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys) {
      // Reset if resetKeys changed
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => this.previousResetKeys[index] !== key,
      );

      if (hasResetKeyChanged) {
        this.previousResetKeys = resetKeys;
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  private logError = async (
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
  ) => {
    const errorLog = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location?.href || 'react-native-app',
    };

    try {
      // Store error log locally
      const existingLogs = await AsyncStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      await AsyncStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }

    // Console log for development
    console.warn(`🚨 Error Boundary Caught Error [${errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    // console.groupEnd();
  };

  private reportError = async (
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
  ) => {
    try {
      // Report to Sentry
      captureException(error, {
        tags: {
          errorBoundary: true,
          errorId,
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
    });
  };

  private handleRetry = () => {
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    this.setState({ isRetrying: true });

    // Add a small delay to show loading state
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 500);
  };

  private handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;

    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const errorDetails = {
      id: errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    };

    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Here you could integrate with your issue reporting system
            console.warn('Reporting issue:', errorDetails);
            Alert.alert('Thank you', 'Your report has been submitted.');
          },
        },
      ],
    );
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    const { showDetails = __DEV__ } = this.props;

    if (!showDetails || !error) return null;

    return (
      <View style={styles.detailsContainer}>
        <TouchableOpacity
          style={styles.detailsHeader}
          onPress={() => {
            // Toggle details visibility could be implemented here
          }}
        >
          <Text style={{ color: '#666', fontSize: 16 }}>ℹ️</Text>
          <Text style={styles.detailsHeaderText}>Error Details</Text>
          <Text style={{ color: '#666', fontSize: 16 }}>▼</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.detailsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Error ID:</Text>
            <Text style={styles.detailValue}>{errorId}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Message:</Text>
            <Text style={styles.detailValue}>{error.message}</Text>
          </View>

          {error.stack && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Stack Trace:</Text>
              <Text style={styles.detailValue}>{error.stack}</Text>
            </View>
          )}

          {errorInfo?.componentStack && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Component Stack:</Text>
              <Text style={styles.detailValue}>{errorInfo.componentStack}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  render() {
    const { hasError, error, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.state.errorInfo!);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              <View style={styles.iconContainer}>
                <Text style={{ fontSize: 64, textAlign: 'center' }}>⚠️</Text>
              </View>

              <Text style={styles.title}>Oops! Something went wrong</Text>

              <Text style={styles.message}>
                We're sorry, but something unexpected happened. The error has
                been logged and we'll look into it.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Retrying...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={{ color: 'white', fontSize: 16 }}>🔄</Text>
                      <Text style={styles.buttonText}>Try Again</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleReportIssue}
                >
                  <View style={styles.buttonContent}>
                    <Text style={{ color: '#007AFF', fontSize: 16 }}>🐛</Text>
                    <Text style={styles.secondaryButtonText}>Report Issue</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {this.renderErrorDetails()}
            </View>
          </ScrollView>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  detailLabel: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailValue: {
    color: '#6c757d',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 32,
    overflow: 'hidden',
    width: '100%',
  },
  detailsContent: {
    maxHeight: 200,
    padding: 16,
  },
  detailsHeader: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomColor: '#e9ecef',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  detailsHeaderText: {
    color: '#495057',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ErrorBoundary;

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = React.useCallback(
    (error: Error, errorInfo?: Record<string, unknown>) => {
      // Use enhanced error monitoring service
      const eventId = ErrorMonitoringService.reportError(error, {
        component: 'manual_report',
        action: 'hook_error_report',
        severity: 'medium',
        extra: errorInfo,
      });

      console.error('Manual error report:', { error, errorInfo, eventId });
    },
    [],
  );

  const reportPerformanceIssue = React.useCallback(
    (operation: string, duration: number, threshold?: number) => {
      ErrorMonitoringService.reportPerformanceIssue(
        {
          operation,
          duration,
        },
        threshold,
      );
    },
    [],
  );

  const addBreadcrumb = React.useCallback(
    (message: string, category?: string, data?: any) => {
      ErrorMonitoringService.addBreadcrumb(message, category, 'info', data);
    },
    [],
  );

  return {
    reportError,
    reportPerformanceIssue,
    addBreadcrumb,
  };
};
