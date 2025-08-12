import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// TODO: Add analytics and performance monitoring when needed
// import analytics from '@react-native-firebase/analytics';
// import { performanceService } from '@services/PerformanceService';

// Color constants to avoid literals
const COLORS = {
  blue: '#007AFF',
  white: '#fff',
  gray: '#666',
  darkGray: '#6c757d',
  lightGray: '#e9ecef',
  darkText: '#333',
} as const;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleRestart = (): void => {
    // Force a full app reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={this.handleRestart}
              testID='restart-button'
            >
              <Text style={styles.buttonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
          {__DEV__ && (
            <Text style={styles.stackTrace}>{this.state.error?.stack}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    color: COLORS.gray,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: COLORS.darkGray,
  },
  stackTrace: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 20,
    padding: 10,
  },
  title: {
    color: COLORS.darkText,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ErrorBoundary;
