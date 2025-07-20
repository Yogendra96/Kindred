import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { loggingService } from '../services/LoggingService';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableDevelopmentMode?: boolean;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Enhanced Error Boundary with comprehensive debugging and reporting
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error details
    loggingService.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Development mode logging
    if (__DEV__ && this.props.enableDevelopmentMode) {
      console.warn('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', errorId);
      // console.groupEnd();
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error || !errorInfo) return;

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    // Show alert with error details
    Alert.alert(
      'Error Report',
      `Error ID: ${errorId}\n\nWould you like to copy the error details?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy Details',
          onPress: () => {
            console.warn('Error Report:', JSON.stringify(errorReport, null, 2));
          },
        },
      ],
    );
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error || !errorInfo || !this.props.showErrorDetails) return null;

    return (
      <ScrollView style={styles.errorDetails}>
        <Text style={styles.errorDetailsTitle}>Error Details</Text>

        <View style={styles.errorSection}>
          <Text style={styles.errorSectionTitle}>Error ID:</Text>
          <Text style={styles.errorText}>{errorId}</Text>
        </View>

        <View style={styles.errorSection}>
          <Text style={styles.errorSectionTitle}>Message:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>

        <View style={styles.errorSection}>
          <Text style={styles.errorSectionTitle}>Stack Trace:</Text>
          <Text style={styles.errorText}>{error.stack}</Text>
        </View>

        <View style={styles.errorSection}>
          <Text style={styles.errorSectionTitle}>Component Stack:</Text>
          <Text style={styles.errorText}>{errorInfo.componentStack}</Text>
        </View>
      </ScrollView>
    );
  };

  private renderFallbackUI = () => {
    const { error, errorInfo } = this.state;

    // Use custom fallback if provided
    if (this.props.fallback && error && errorInfo) {
      return this.props.fallback(error, errorInfo);
    }

    // Default fallback UI
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            We're sorry, but something unexpected happened. The error has been reported and we'll
            fix it soon.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity style={styles.reportButton} onPress={this.handleReportError}>
                <Text style={styles.reportButtonText}>Report Error</Text>
              </TouchableOpacity>
            )}
          </View>

          {this.renderErrorDetails()}
        </View>
      </View>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#f57c00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 300,
  },
  errorDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  errorSection: {
    marginBottom: 16,
  },
  errorSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
});

// Hook for functional components
export const useErrorHandler = () => {
  const reportError = React.useCallback((error: Error, errorInfo?: Record<string, unknown>) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    loggingService.error('Manual error report:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId,
    });

    if (__DEV__) {
      console.error('Manual Error Report:', { error, errorInfo, errorId });
    }

    return errorId;
  }, []);

  return { reportError };
};

export default EnhancedErrorBoundary;
