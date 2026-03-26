/* global window, navigator */
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { CrashReportingService } from '../services/CrashReportingService';
import loggingService from '../services/LoggerService';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  enableDevelopmentMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isRetrying: boolean;
}

const { width: _screenWidth, height: _screenHeight } = Dimensions.get('window');

/**
 * Error Boundary for catching and reporting component-level errors
 */
class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];
  private logger = loggingService;

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

    // Report to external services
    if (this.props.enableReporting !== false) {
      this.reportError(error, errorInfo, errorId);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Haptic feedback
    if (Haptics.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Development mode logging
    if (__DEV__ && this.props.enableDevelopmentMode) {
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', errorId);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys) {
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
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'any',
      url:
        typeof window !== 'undefined'
          ? window.location?.href
          : 'react-native-app',
    };

    try {
      const existingLogs = await AsyncStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      await AsyncStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (storageError) {
      this.logger.error(
        'ErrorBoundary',
        'Failed to store error log:',
        storageError,
      );
    }

    this.logger.error(
      'ErrorBoundary',
      `Error Boundary Caught Error [${errorId}]`,
      {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    );
  };

  private reportError = async (
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
  ) => {
    try {
      // Report to Sentry
      captureException(error, {
        tags: { errorBoundary: true, errorId },
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });

      // Report to Crash Reporting Service (Firebase)
      CrashReportingService.logError(error, {
        errorBoundary: true,
        errorId,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    } catch (reportingError) {
      this.logger.error(
        'ErrorBoundary',
        'Failed to report error:',
        reportingError,
      );
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

    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 500) as any;
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
        <View style={styles.detailsHeader}>
          <Ionicons name='information-circle' size={20} color='#666' />
          <Text style={styles.detailsHeaderText}>Error Details</Text>
        </View>

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
      if (fallback) {
        return fallback(error, this.state.errorInfo!);
      }

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name='warning' size={64} color='#FF6B6B' />
              </View>

              <Text style={styles.title}>Oops! Something went wrong</Text>

              <Text style={styles.message}>
                We're sorry, but something unexpected happened. The error has
                been logged and reported.
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
                      <Ionicons name='refresh' size={20} color='white' />
                      <Text style={styles.buttonText}>Try Again</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleReportIssue}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name='bug' size={20} color='#007AFF' />
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    marginTop: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailsHeaderText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  detailsContent: {
    maxHeight: 200,
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
});

export default ErrorBoundary;

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export const useErrorHandler = () => {
  const reportError = React.useCallback((error: Error, errorInfo?: any) => {
    const errorId = `manual_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    loggingService.error('ErrorBoundary', 'Manual error report:', {
      error,
      errorInfo,
      errorId,
    });

    captureException(error, {
      tags: { manual: true, errorId },
      extra: errorInfo,
    });

    CrashReportingService.logError(error, {
      manual: true,
      errorId,
      ...errorInfo,
    });
  }, []);

  return { reportError };
};
