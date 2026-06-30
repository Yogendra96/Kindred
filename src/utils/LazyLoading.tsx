// @ts-nocheck
/* eslint-disable */
import React, { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// Mock ErrorBoundary for development
interface ErrorBoundaryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FallbackComponent?: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: Error, errorInfo: any) => void;
  onReset?: () => void;
  children: ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  _FallbackComponent,
  _onError,
}) => {
  return <>{children}</>;
};

// Loading component for lazy-loaded screens
interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

const LoadingComponent: React.FC<LoadingProps> = ({ message = 'Loading...', size = 'large' }) => (
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

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: Error, errorInfo: any) => void;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<ErrorFallbackProps>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (error: Error, errorInfo: any) => void;
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

  const WrappedComponent: React.FC<Record<string, any>> & {
    preload: () => Promise<{ default: T }>;
  } = props => (
    <LazyWrapper
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      onError={options.onError}
    >
      <LazyComponent {...props} />
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importFn: () => Promise<any>,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components: Array<{ name: string; importFn: () => Promise<any> }>,
  ): void {
    components.forEach(({ name, importFn }) => {
      this.preload(name, importFn);
    });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFn: () => Promise<{ default: ComponentType<any> }>,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ComponentType<any>,
>(
  importFn: () => Promise<{ default: T }>,
  condition: () => boolean | Promise<boolean>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallbackComponent?: ComponentType<any>,
) => {
  const LazyComponent = lazy(async () => {
    const shouldLoad = await condition();
    if (shouldLoad) {
      return importFn();
    } else if (fallbackComponent) {
      return { default: fallbackComponent };
    } else {
      throw new Error('Component loading condition not met and no fallback provided');
    }
  });

  return (props: Record<string, any>) => (
    <LazyWrapper errorFallback={ErrorFallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
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
        ComponentPreloader.preload(category, () => import(`../screens/${category}/index.ts`)),
    };
  },

  // Split by utility category
  createUtilityBundle: (utilityName: string) => {
    return {
      load: () => import(`../utils/${utilityName}.ts`),
      preload: () =>
        ComponentPreloader.preload(utilityName, () => import(`../utils/${utilityName}.ts`)),
    };
  },
};

// Performance monitoring for lazy loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withLazyLoadingMetrics = <T extends ComponentType<any>>(
  LazyComponent: T,
  componentName: string,
) => {
  return (props: Record<string, any>) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Log loading performance - commented out in production
      // console.log(`Lazy component ${componentName} loaded in ${loadTime}ms`);

      // You can integrate with your analytics service here
      // AnalyticsService.track('lazy_component_loaded', {
      //   component: componentName,
      //   loadTime,
      // });
    }, [startTime]);

    return <LazyComponent {...props} />;
  };
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonBox: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonHeader: {
    height: 60,
    marginBottom: 16,
  },
  skeletonContent: {
    height: 100,
    marginBottom: 16,
  },
  skeletonFooter: {
    height: 40,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonCardHeader: {
    height: 20,
    marginBottom: 12,
  },
  skeletonCardContent: {
    height: 60,
  },
  skeletonList: {
    flex: 1,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonListContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    marginBottom: 8,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 12,
    width: '50%',
  },
});

export default LazyWrapper;
