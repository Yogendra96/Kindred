import React, {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
} from 'react';

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Mock ErrorBoundary for development
interface ErrorBoundaryProps {
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: unknown) => void;
  onReset?: () => void;
  children: ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  FallbackComponent: _FallbackComponent,
  onError: _onError,
  onReset: _onReset,
}) => {
  // Simple implementation - in production, use a proper error boundary
  return <>{children}</>;
};

// Loading component for lazy-loaded screens
interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

const LoadingComponent: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'large',
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={size} color='#4CAF50' />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>{error.message}</Text>
    <Text style={styles.retryButton} onPress={resetErrorBoundary}>
      Try again
    </Text>
  </View>
);

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: unknown) => void;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <LoadingComponent />,
  errorFallback = ErrorFallback,
  onError,
}) => (
  <ErrorBoundary
    FallbackComponent={errorFallback}
    onError={onError}
    onReset={() => {
      // Reset any state if needed
    }}
  >
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

// Utility function to create lazy-loaded components with enhanced error handling
export const createLazyComponent = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: unknown) => void;
    preload?: boolean;
  } = {},
) => {
  const LazyComponent = lazy(importFn);

  // Preload the component if requested
  if (options.preload) {
    importFn().catch(error => {
      console.error('Failed to preload component:', error);
    });
  }

  const WrappedComponent: React.FC<Record<string, unknown>> & {
    preload: () => Promise<{ default: T }>;
  } = props => (
    <LazyWrapper
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      onError={options.onError}
    >
      <LazyComponent {...(props as Record<string, unknown>)} />
    </LazyWrapper>
  );

  // Add preload method to the component
  WrappedComponent.preload = () => importFn();

  return WrappedComponent;
};

// Preloader utility for multiple components
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();

  static preload(
    componentName: string,
    importFn: () => Promise<unknown>,
  ): void {
    if (!this.preloadedComponents.has(componentName)) {
      this.preloadedComponents.add(componentName);
      importFn().catch(error => {
        console.error(`Failed to preload component ${componentName}:`, error);
        this.preloadedComponents.delete(componentName);
      });
    }
  }

  static preloadMultiple(
    components: Array<{ name: string; importFn: () => Promise<unknown> }>,
  ): void {
    for (const { name, importFn } of components) {
      this.preload(name, importFn);
    }
  }

  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  static clear(): void {
    this.preloadedComponents.clear();
  }
}

// Route-based code splitting utility
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
  routeName: string,
) => {
  return createLazyComponent(importFn, {
    fallback: <LoadingComponent message={`Loading ${routeName}...`} />,
    onError: (error, errorInfo) => {
      console.error(`Error loading route ${routeName}:`, error, errorInfo);
      // You can add analytics tracking here
    },
  });
};

// Conditional loading based on feature flags
export const createConditionalLazyComponent = <
  T extends ComponentType<unknown>,
>(
  importFn: () => Promise<{ default: T }>,
  condition: () => boolean | Promise<boolean>,
  fallbackComponent?: ComponentType<unknown>,
) => {
  const LazyComponent = lazy(async () => {
    const shouldLoad = await condition();
    if (shouldLoad) {
      return importFn();
    } else if (fallbackComponent) {
      return { default: fallbackComponent };
    } else {
      throw new Error(
        'Component loading condition not met and no fallback provided',
      );
    }
  });

  const ConditionalLazyComponent = (props: Record<string, unknown>) => (
    <LazyWrapper errorFallback={ErrorFallback}>
      <LazyComponent {...(props as Record<string, unknown>)} />
    </LazyWrapper>
  );
  ConditionalLazyComponent.displayName = 'ConditionalLazyComponent';
  return ConditionalLazyComponent;
};

// Bundle splitting utilities
export const BundleSplitter = {
  // Split by feature
  createFeatureBundle: (featureName: string) => {
    return {
      load: () => import(`../features/${featureName}/index.ts`),
      preload: () =>
        ComponentPreloader.preload(
          featureName,
          () => import(`../features/${featureName}/index.ts`),
        ),
    };
  },

  // Split by screen category
  createScreenBundle: (category: 'auth' | 'main' | 'settings') => {
    return {
      load: () => import(`../screens/${category}/index.ts`),
      preload: () =>
        ComponentPreloader.preload(
          category,
          () => import(`../screens/${category}/index.ts`),
        ),
    };
  },

  // Split by utility category
  createUtilityBundle: (utilityName: string) => {
    return {
      load: () => import(`../utils/${utilityName}.ts`),
      preload: () =>
        ComponentPreloader.preload(
          utilityName,
          () => import(`../utils/${utilityName}.ts`),
        ),
    };
  },
};

// Performance monitoring for lazy loading
export const withLazyLoadingMetrics = <T extends ComponentType<unknown>>(
  LazyComponent: T,
  _componentName: string,
) => {
  const LazyComponentWithMetrics = (props: Record<string, unknown>) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      const _loadTime = endTime - startTime;

      // Log loading performance - commented out in production
      // console.log(`Lazy component ${_componentName} loaded in ${_loadTime}ms`);

      // You can integrate with your analytics service here
      // AnalyticsService.track('lazy_component_loaded', {
      //   component: _componentName,
      //   loadTime: _loadTime,
      // });
    }, [startTime]);

    return <LazyComponent {...(props as Record<string, unknown>)} />;
  };
  LazyComponentWithMetrics.displayName = `LazyComponentWithMetrics(${_componentName})`;
  return LazyComponentWithMetrics;
};

// Skeleton loading states for different component types
export const SkeletonLoaders = {
  Screen: () => (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonBox, styles.skeletonHeader]} />
      <View style={[styles.skeletonBox, styles.skeletonContent]} />
      <View style={[styles.skeletonBox, styles.skeletonContent]} />
      <View style={[styles.skeletonBox, styles.skeletonFooter]} />
    </View>
  ),

  Card: () => (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonBox, styles.skeletonCardHeader]} />
      <View style={[styles.skeletonBox, styles.skeletonCardContent]} />
    </View>
  ),

  List: ({ itemCount = 5 }: { itemCount?: number }) => (
    <View style={styles.skeletonList}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={styles.skeletonListItem}>
          <View style={[styles.skeletonBox, styles.skeletonAvatar]} />
          <View style={styles.skeletonListContent}>
            <View style={[styles.skeletonBox, styles.skeletonTitle]} />
            <View style={[styles.skeletonBox, styles.skeletonSubtitle]} />
          </View>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorMessage: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  retryButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonAvatar: {
    borderRadius: 20,
    height: 40,
    marginRight: 12,
    width: 40,
  },
  skeletonBox: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonCardContent: {
    height: 60,
  },
  skeletonCardHeader: {
    height: 20,
    marginBottom: 12,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonContent: {
    height: 100,
    marginBottom: 16,
  },
  skeletonFooter: {
    height: 40,
  },
  skeletonHeader: {
    height: 60,
    marginBottom: 16,
  },
  skeletonList: {
    flex: 1,
  },
  skeletonListContent: {
    flex: 1,
  },
  skeletonListItem: {
    alignItems: 'center',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  skeletonSubtitle: {
    height: 12,
    width: '50%',
  },
  skeletonTitle: {
    height: 16,
    marginBottom: 8,
    width: '70%',
  },
});

export default LazyWrapper;
