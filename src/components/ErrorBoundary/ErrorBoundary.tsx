/* global NodeJS */
import type { ReactNode } from 'react';
import React, { Component } from 'react';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import { modernAPMService } from '../../services/ModernAPMService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Types for Error Boundary
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorDetails {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  appVersion?: string;
  platform: string;
  deviceInfo?: {
    model?: string;
    systemVersion?: string;
    buildNumber?: string;
  };
  breadcrumbs?: ErrorBreadcrumb[];
  userActions?: UserAction[];
  memoryUsage?: number;
  networkStatus?: string;
  location?: string;
}

export interface ErrorBreadcrumb {
  timestamp: number;
  category:
    | 'navigation'
    | 'user_action'
    | 'api_call'
    | 'state_change'
    | 'lifecycle';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface UserAction {
  timestamp: number;
  action: string;
  component?: string;
  data?: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isReporting: boolean;
  showDetails: boolean;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void,
  ) => ReactNode;
  onError?: (
    error: Error,
    errorInfo: ErrorInfo,
    errorDetails: ErrorDetails,
  ) => void;
  enableReporting?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: string[];
  isolate?: boolean;
  level?: 'page' | 'component' | 'feature';
  name?: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private performanceMonitor: typeof modernAPMService;
  private hapticService: typeof HapticFeedbackService;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private userActions: UserAction[] = [];
  private sessionId: string;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isReporting: false,
      showDetails: false,
    };

    this.performanceMonitor = modernAPMService;
    this.hapticService = HapticFeedbackService;
    this.sessionId = this.generateSessionId();

    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'lifecycle',
      message: `ErrorBoundary initialized: ${props.name || 'unnamed'}`,
      level: 'info',
    });
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Add error breadcrumb
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'lifecycle',
      message: `Error caught: ${error.message}`,
      level: 'error',
      data: { stack: error.stack },
    });

    // Trigger haptic feedback
    this.hapticService.triggerError();

    // Create detailed error information
    const errorDetails = this.createErrorDetails(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo, errorDetails);

    // Report error if enabled
    if (this.props.enableReporting !== false) {
      this.reportError(errorDetails);
    }

    // Log error for debugging
    this.logError(errorDetails);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          key =>
            prevProps[key as keyof ErrorBoundaryProps] !==
            this.props[key as keyof ErrorBoundaryProps],
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        // Reset if any prop changed
        if (prevProps !== this.props) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private createErrorDetails(error: Error, errorInfo: ErrorInfo): ErrorDetails {
    return {
      error,
      errorInfo,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      platform: Platform.OS,
      deviceInfo: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: (Platform.constants as any)?.Model || 'unknown',
        systemVersion: Platform.Version.toString(),
      },
      breadcrumbs: [...this.breadcrumbs],
      userActions: [...this.userActions],
      location: this.props.name || 'unknown',
    };
  }

  private async reportError(errorDetails: ErrorDetails): Promise<void> {
    if (this.state.isReporting) return;

    this.setState({ isReporting: true });

    try {
      // Store error locally
      await this.storeErrorLocally(errorDetails);

      // Send to crash reporting service (e.g., Crashlytics, Sentry)
      await this.sendToReportingService(errorDetails);

      // Record performance impact
      this.performanceMonitor.logCustomMetric('error_boundary_triggered', 1);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private async storeErrorLocally(errorDetails: ErrorDetails): Promise<void> {
    try {
      const existingErrors = await AsyncStorage.getItem('stored_errors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];

      errors.push({
        ...errorDetails,
        error: {
          message: errorDetails.error.message,
          stack: errorDetails.error.stack,
          name: errorDetails.error.name,
        },
      });

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      await AsyncStorage.setItem('stored_errors', JSON.stringify(errors));
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  private async sendToReportingService(
    errorDetails: ErrorDetails,
  ): Promise<void> {
    // This would integrate with your crash reporting service
    // Example: Crashlytics, Sentry, Bugsnag, etc.
    try {
      // Placeholder for actual reporting service integration
      // Example Sentry integration:
      // Sentry.captureException(errorDetails.error, {
      //   extra: errorDetails,
      //   tags: {
      //     component: this.props.name,
      //     level: this.props.level,
      //   },
      // });
    } catch (error) {
      console.error('Failed to send error to reporting service:', error);
    }
  }

  private logError(errorDetails: ErrorDetails): void {
    console.error('Error:', errorDetails.error);
    console.error('Component Stack:', errorDetails.errorInfo.componentStack);
  }

  private addBreadcrumb(breadcrumb: ErrorBreadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  private addUserAction(action: UserAction): void {
    this.userActions.push(action);

    // Keep only last 20 user actions
    if (this.userActions.length > 20) {
      this.userActions.shift();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private resetErrorBoundary = (): void => {
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'user_action',
      message: 'Error boundary reset',
      level: 'info',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      showDetails: false,
    });
  };

  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'The error persists after multiple attempts. Please restart the app.',
        [{ text: 'OK' }],
      );
      return;
    }

    this.addUserAction({
      timestamp: Date.now(),
      action: 'retry_error_boundary',
      data: { retryCount: retryCount + 1 },
    });

    // Trigger haptic feedback
    this.hapticService.triggerButtonPress();

    // Add delay before retry to prevent rapid retries
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);

    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        showDetails: false,
      }));
    }, retryDelay);

    this.retryTimeouts.push(timeout);
  };

  private toggleDetails = (): void => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
    this.hapticService.triggerButtonPress();
  };

  private handleReportIssue = (): void => {
    const { error, errorInfo } = this.state;
    if (!error || !errorInfo) return;

    const errorDetails = this.createErrorDetails(error, errorInfo);

    // Create a user-friendly error report
    const reportData = {
      errorMessage: error.message,
      timestamp: new Date(errorDetails.timestamp).toISOString(),
      component: this.props.name || 'Unknown Component',
      platform: Platform.OS,
      appVersion: errorDetails.appVersion || 'Unknown',
    };

    // This could open an email client, feedback form, or support chat
    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Implement your reporting mechanism here

            this.hapticService.triggerSuccess();
          },
        },
      ],
    );
  };

  private renderErrorFallback(): ReactNode {
    const { error, errorInfo, showDetails, retryCount, isReporting } =
      this.state;
    const {
      enableRetry = true,
      maxRetries = 3,
      level = 'component',
    } = this.props;

    if (!error || !errorInfo) return null;

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback(error, errorInfo, this.handleRetry);
    }

    const canRetry = enableRetry && retryCount < maxRetries;
    const errorTitle = level === 'page' ? 'Page Error' : 'Something went wrong';
    const errorMessage =
      level === 'page'
        ? 'This page encountered an error and cannot be displayed.'
        : 'This component encountered an error.';

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>

          {/* Error Title */}
          <Text style={styles.title}>{errorTitle}</Text>

          {/* Error Message */}
          <Text style={styles.message}>{errorMessage}</Text>

          {/* Error Details Toggle */}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={this.toggleDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsButtonText}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
          </TouchableOpacity>

          {/* Error Details */}
          {showDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Error Details:</Text>
              <Text style={styles.errorText}>{error.message}</Text>

              {error.stack && (
                <>
                  <Text style={styles.detailsTitle}>Stack Trace:</Text>
                  <Text style={styles.stackText}>{error.stack}</Text>
                </>
              )}

              {errorInfo.componentStack && (
                <>
                  <Text style={styles.detailsTitle}>Component Stack:</Text>
                  <Text style={styles.stackText}>
                    {errorInfo.componentStack}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {canRetry && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>
                  {retryCount > 0
                    ? `Retry (${retryCount}/${maxRetries})`
                    : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.reportButton]}
              onPress={this.handleReportIssue}
              activeOpacity={0.8}
              disabled={isReporting}
            >
              <Text style={styles.reportButtonText}>
                {isReporting ? 'Reporting...' : 'Report Issue'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Retry Count Info */}
          {retryCount > 0 && (
            <Text style={styles.retryInfo}>
              Attempted {retryCount} time{retryCount > 1 ? 's' : ''}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }

  // Public methods for external breadcrumb/action tracking
  public static addBreadcrumb = (breadcrumb: ErrorBreadcrumb): void => {
    // This would need to be implemented with a global error boundary manager
  };

  public static addUserAction = (action: UserAction): void => {
    // This would need to be implemented with a global error boundary manager
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: height * 0.8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: width - 40,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#28a745',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#6c757d',
  },
  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryInfo: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ErrorBoundary;

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    addBreadcrumb: ErrorBoundary.addBreadcrumb,
    addUserAction: ErrorBoundary.addUserAction,
  };
}
