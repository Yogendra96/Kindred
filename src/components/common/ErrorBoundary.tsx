import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import { performanceService } from '@services/PerformanceService';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    if (__DEV__) {
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
    }

    try {
      // Log to Firebase Analytics
      await analytics().logEvent('app_error', {
        error_message: error.message,
        error_stack: error.stack,
        error_component: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });

      // Log performance impact
      await performanceService.stopTrace('error_impact', {
        error_count: 1,
        error_timestamp: Date.now(),
      });
    } catch (loggingError) {
      console.error('Error logging failed:', loggingError);
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRestart = (): void => {
    // Force a full app reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleRetry}
              testID="retry-button"
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={this.handleRestart}
              testID="restart-button"
            >
              <Text style={styles.buttonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
          {__DEV__ && (
            <Text style={styles.stackTrace}>
              {this.state.error?.stack}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#343a40',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#495057',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  restartButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stackTrace: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default ErrorBoundary;