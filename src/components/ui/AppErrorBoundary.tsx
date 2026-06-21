/**
 * AppErrorBoundary.tsx — React Error Boundary
 *
 * Catches render-time JS errors in child component trees.
 * Logs them via LoggerService and shows a recovery UI.
 *
 * Standards:
 *  - Error boundaries must be class components (React requirement)
 *  - Logs error + component stack to LoggerService
 *  - Exposes onReset prop for retry action
 *  - tag prop identifies which part of UI threw (e.g. 'HomeScreen', 'Navigator')
 *
 * Usage:
 *   <AppErrorBoundary tag="HomeScreen" onReset={() => navigation.navigate('Home')}>
 *     <HomeScreen />
 *   </AppErrorBoundary>
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import logger from '../../services/LoggerService';
import ErrorHandler from '../../utils/errorHandler';
import {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} from '../../constants/theme';

interface Props {
  tag?: string;
  children: React.ReactNode;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  recoverable: boolean;
}

class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorMessage: '', recoverable: true };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const tag = this.props.tag ?? 'AppErrorBoundary';
    const typed = ErrorHandler.handle(error, tag);
    // Log component stack separately for readability
    logger.error(tag, 'Component stack', {
      componentStack: info.componentStack,
    });
    this.setState({ recoverable: typed.recoverable });
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', recoverable: true });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Allow fully custom fallback
    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>{this.state.recoverable ? '⚠️' : '💥'}</Text>
        <Text style={styles.title}>
          {this.state.recoverable ? 'Something went wrong' : 'Unexpected error'}
        </Text>
        <Text style={styles.message} numberOfLines={4}>
          {this.state.errorMessage}
        </Text>
        {this.state.recoverable && (
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleReset}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>
          {this.state.recoverable
            ? 'This screen had an issue. Tap above to reload it.'
            : 'Please restart the app. Your data is safe.'}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.backgroundPrimary || '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing?.xxxl || 32,
  },
  icon: { fontSize: 56, marginBottom: spacing?.lg || 16 },
  title: {
    fontSize: typography?.xxl || 22,
    fontWeight: typography?.bold || 'bold',
    color: colors?.textPrimary || '#1a1a1a',
    textAlign: 'center',
    marginBottom: spacing?.md || 12,
  },
  message: {
    fontSize: typography?.sm || 14,
    color: colors?.textMuted || '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing?.xxl || 24,
  },
  retryBtn: {
    backgroundColor: colors?.green800 || '#2e7d32',
    borderRadius: radii?.lg || 8,
    paddingVertical: spacing?.md || 12,
    paddingHorizontal: spacing?.xxxl || 32,
    marginBottom: spacing?.lg || 16,
    ...(shadows?.card || {}),
  },
  retryText: {
    color: colors?.textOnDark || '#ffffff',
    fontSize: typography?.md || 16,
    fontWeight: typography?.bold || 'bold',
  },
  hint: {
    fontSize: typography?.xs || 12,
    color: colors?.textMuted || '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AppErrorBoundary;
