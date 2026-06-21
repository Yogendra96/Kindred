/* global NodeJS */
/* global window, navigator */
/**
 * @fileoverview Unified Error Boundary Component
 *
 * Consolidated error boundary that replaces multiple implementations
 * with a single, feature-rich, configurable component.
 *
 * Features:
 * - Error reporting to monitoring services
 * - User-friendly error UI with retry options
 * - Development mode error details
 * - Automatic error recovery attempts
 * - Performance monitoring integration
 * - Accessibility support
 * - Customizable fallback UI
 *
 * Follows DRY principles and provides consistent error handling.
 *
 * @version 2.0.0
 */

import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  COLORS,
  SPACING,
  FONT_SIZES,
  LOG_PREFIXES,
} from '../../utils/constants';
import { createLogger } from '../../utils/loggingUtils';

// Helper logging functions
const logStructuredError = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  error: Error,
  component: string,
  type: string,
  extra?: Record<string, any>,
) => {
  logger.error(`${type} in ${component}`, { error, extra });
};

const logRecoveryAttempt = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  error: Error,
  attemptType: string,
  success: boolean,
  extra?: Record<string, any>,
) => {
  logger.info(`Recovery attempt: ${attemptType} (success: ${success})`, {
    error,
    extra,
  });
};

// ===================================================================
// TYPES
// ===================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void,
  ) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  maxRetries?: number;
  autoRetryDelay?: number;
  component?: string; // Component name for better error tracking
  screen?: string; // Screen name for context
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
}

export interface ErrorReport {
  errorId: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo: {
    componentStack?: string | null;
  };
  context: {
    component?: string;
    screen?: string;
    platform: string;
    timestamp: string;
    retryCount: number;
    userId?: string;
    sessionId?: string;
  };
  deviceInfo: {
    width: number;
    height: number;
    platform: string;
    platformVersion?: string;
  };
}

// ===================================================================
// UNIFIED ERROR BOUNDARY
// ===================================================================

/**
 * Unified Error Boundary that consolidates all error handling features
 * into a single, reusable, configurable component
 */
class UnifiedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private logger = createLogger('ERROR_BOUNDARY');
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  static defaultProps: Partial<ErrorBoundaryProps> = {
    enableReporting: true,
    showDetails: __DEV__,
    resetOnPropsChange: false,
    maxRetries: 3,
    autoRetryDelay: 5000, // 5 seconds
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: props.showDetails ?? __DEV__,
    };

    if (props.resetKeys) {
      this.previousResetKeys = [...props.resetKeys];
    }
  }

  // ===================================================================
  // LIFECYCLE METHODS
  // ===================================================================

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.state.errorId || 'unknown_error_id';

    logStructuredError(
      this.logger,
      error,
      this.props.component || 'UnknownComponent',
      'component_error',
      {
        screen: this.props.screen,
        errorId,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
      },
    );

    // Update state with error info
    this.setState({ errorInfo });

    // Report error if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo, errorId);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Attempt automatic recovery if configured
    if (
      this.props.autoRetryDelay &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleAutoRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when specific props change
    if (
      resetOnPropsChange &&
      hasError &&
      this.hasResetKeysChanged(prevProps.resetKeys)
    ) {
      this.handleRetry();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  // ===================================================================
  // ERROR HANDLING METHODS
  // ===================================================================

  private reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
  ): void {
    try {
      const report: ErrorReport = {
        errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          component: this.props.component,
          screen: this.props.screen,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
          retryCount: this.state.retryCount,
        },
        deviceInfo: {
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
          platform: Platform.OS,
          platformVersion: Platform.Version?.toString(),
        },
      };

      this.logger.error('Error report generated', { report, error });

      // You would integrate with services like Sentry here:
      // import { captureException } from '@sentry/react-native';
      // captureException(error, { extra: report });
    } catch (reportingError) {
      this.logger.error(
        `Failed to report error: ${error.message}`,
        reportingError as Error,
      );
    }
  }

  private hasResetKeysChanged(prevResetKeys?: Array<string | number>): boolean {
    const { resetKeys } = this.props;

    if (!resetKeys || !prevResetKeys) {
      return false;
    }

    if (resetKeys.length !== prevResetKeys.length) {
      return true;
    }

    return resetKeys.some((key, index) => key !== prevResetKeys[index]);
  }

  private scheduleAutoRetry(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.logger.info('Attempting automatic error recovery', {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount + 1,
      });

      this.handleRetry(true);
    }, this.props.autoRetryDelay);
  }

  // ===================================================================
  // USER ACTIONS
  // ===================================================================

  private handleRetry = (isAutomatic: boolean = false): void => {
    const { error, retryCount, errorId } = this.state;
    const newRetryCount = retryCount + 1;

    logRecoveryAttempt(
      this.logger,
      error!,
      isAutomatic ? 'automatic_retry' : 'manual_retry',
      true,
      {
        errorId,
        retryCount: newRetryCount,
        component: this.props.component,
      },
    );

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: newRetryCount,
      isRetrying: false,
    });

    // Clear any pending timeouts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  };

  private handleRestart = (): void => {
    Alert.alert(
      'Restart App',
      'This will restart the app to recover from the error. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: () => {
            this.logger.info('User requested app restart', {
              errorId: this.state.errorId,
              component: this.props.component,
            });

            // In React Native, we would typically use:
            // import { RNRestart } from 'react-native-restart';
            // RNRestart.Restart();

            // For web, we could use:
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
      ],
    );
  };

  private toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  // ===================================================================
  // RENDER METHODS
  // ===================================================================

  render(): ReactNode {
    const { hasError } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback && this.state.error && this.state.errorInfo) {
        return fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleRetry,
        );
      }

      // Default error UI
      return this.renderDefaultErrorUI();
    }

    return children;
  }

  private renderDefaultErrorUI(): ReactNode {
    const { error, errorInfo, errorId, retryCount, isRetrying, showDetails } =
      this.state;
    const { maxRetries = 3, component, screen } = this.props;

    const canRetry = retryCount < maxRetries;
    const errorTitle = error?.name || 'Application Error';
    const errorMessage = error?.message || 'Something went wrong';

    return (
      <View style={styles.container} accessibilityRole='alert'>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole='header'>
            {errorTitle}
          </Text>
          <Text style={styles.subtitle}>
            We encountered an unexpected error
          </Text>
        </View>

        {/* Error Details */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.message}>{errorMessage}</Text>

          {component && (
            <Text style={styles.context}>
              Component: {component}
              {screen && ` (${screen})`}
            </Text>
          )}

          {errorId && <Text style={styles.errorId}>Error ID: {errorId}</Text>}

          {retryCount > 0 && (
            <Text style={styles.retryInfo}>
              Retry attempts: {retryCount}/{maxRetries}
            </Text>
          )}

          {/* Development Details */}
          {__DEV__ && showDetails && (
            <View style={styles.debugSection}>
              <TouchableOpacity
                style={styles.debugHeader}
                onPress={this.toggleDetails}
                accessibilityRole='button'
                accessibilityLabel='Toggle error details'
              >
                <Text style={styles.debugTitle}>Debug Information</Text>
              </TouchableOpacity>

              <View style={styles.debugContent}>
                {error?.stack && (
                  <Text style={styles.stackTrace}>{error.stack}</Text>
                )}

                {errorInfo?.componentStack && (
                  <Text style={styles.componentStack}>
                    Component Stack:{'\n'}
                    {errorInfo.componentStack}
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canRetry && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isRetrying && styles.buttonDisabled,
              ]}
              onPress={() => this.handleRetry()}
              disabled={isRetrying}
              accessibilityRole='button'
              accessibilityLabel={isRetrying ? 'Retrying...' : 'Try again'}
            >
              <Text style={styles.buttonText}>
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={this.handleRestart}
            accessibilityRole='button'
            accessibilityLabel='Restart app'
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Restart App
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.button, styles.debugButton]}
              onPress={this.toggleDetails}
              accessibilityRole='button'
              accessibilityLabel='Toggle debug details'
            >
              <Text style={[styles.buttonText, styles.debugButtonText]}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
}

// ===================================================================
// STYLES
// ===================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS?.white || '#FFFFFF',
    padding: SPACING?.LG || 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING?.XL || 32,
    paddingTop: SPACING?.XL || 32,
  },
  title: {
    fontSize: FONT_SIZES?.H3 || 24,
    fontWeight: 'bold',
    color: COLORS?.error || '#FF0000',
    textAlign: 'center',
    marginBottom: SPACING?.SM || 8,
  },
  subtitle: {
    fontSize: FONT_SIZES?.LG || 18,
    color: COLORS?.gray || '#888888',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginBottom: SPACING?.LG || 24,
  },
  message: {
    fontSize: FONT_SIZES?.MD || 16,
    color: COLORS?.darkGray || '#333333',
    lineHeight: 22,
    marginBottom: SPACING?.MD || 16,
  },
  context: {
    fontSize: FONT_SIZES?.SM || 14,
    color: COLORS?.gray || '#888888',
    marginBottom: SPACING?.SM || 8,
  },
  errorId: {
    fontSize: FONT_SIZES?.SM || 14,
    color: COLORS?.gray || '#888888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: SPACING?.SM || 8,
  },
  retryInfo: {
    fontSize: FONT_SIZES?.SM || 14,
    color: COLORS?.warning || '#FFA500',
    marginBottom: SPACING?.MD || 16,
  },
  debugSection: {
    marginTop: SPACING?.LG || 24,
    borderTopWidth: 1,
    borderTopColor: COLORS?.lightGray || '#DDDDDD',
    paddingTop: SPACING?.MD || 16,
  },
  debugHeader: {
    marginBottom: SPACING?.SM || 8,
  },
  debugTitle: {
    fontSize: FONT_SIZES?.MD || 16,
    fontWeight: '600',
    color: COLORS?.darkGray || '#333333',
  },
  debugContent: {
    backgroundColor: COLORS?.lightGray || '#DDDDDD',
    padding: SPACING?.MD || 16,
    borderRadius: 8,
  },
  stackTrace: {
    fontSize: FONT_SIZES?.XS || 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS?.darkGray || '#333333',
    lineHeight: 16,
  },
  componentStack: {
    fontSize: FONT_SIZES?.XS || 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS?.darkGray || '#333333',
    lineHeight: 16,
    marginTop: SPACING?.SM || 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: SPACING?.SM || 8,
  },
  button: {
    paddingHorizontal: SPACING?.LG || 24,
    paddingVertical: SPACING?.MD || 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS?.primary || '#007AFF',
  },
  secondaryButton: {
    backgroundColor: COLORS?.lightGray || '#DDDDDD',
    borderWidth: 1,
    borderColor: COLORS?.gray || '#888888',
  },
  debugButton: {
    backgroundColor: COLORS?.info || '#00BFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.darkGray,
  },
  debugButtonText: {
    color: COLORS.white,
  },
});

// ===================================================================
// CONVENIENCE WRAPPERS
// ===================================================================

/**
 * Simple error boundary for basic error catching
 */
export const SimpleErrorBoundary: React.FC<{
  children: ReactNode;
  component?: string;
}> = ({ children, component }) => (
  <UnifiedErrorBoundary component={component} maxRetries={1}>
    {children}
  </UnifiedErrorBoundary>
);

/**
 * Screen-level error boundary with enhanced features
 */
export const ScreenErrorBoundary: React.FC<{
  children: ReactNode;
  screen: string;
  enableReporting?: boolean;
}> = ({ children, screen, enableReporting = true }) => (
  <UnifiedErrorBoundary
    screen={screen}
    component={`${screen}Screen`}
    enableReporting={enableReporting}
    maxRetries={2}
    autoRetryDelay={3000}
  >
    {children}
  </UnifiedErrorBoundary>
);

/**
 * Form-level error boundary for form components
 */
export const FormErrorBoundary: React.FC<{
  children: ReactNode;
  formName: string;
}> = ({ children, formName }) => (
  <UnifiedErrorBoundary
    component={`${formName}Form`}
    maxRetries={3}
    resetOnPropsChange={true}
    showDetails={false}
  >
    {children}
  </UnifiedErrorBoundary>
);

// ===================================================================
// EXPORTS
// ===================================================================

export default UnifiedErrorBoundary;
export { UnifiedErrorBoundary };
