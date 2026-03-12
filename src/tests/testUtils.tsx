import { store } from '../store';
import { ThemeProvider } from '../theme/ThemeProvider';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';

// Global type declarations
declare global {
  var __DEV__: boolean;
  var jest: any;
  var beforeAll: any;
  var afterAll: any;
  var beforeEach: any;
  var afterEach: any;
}

// JSX namespace declaration
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Enhanced test utilities for comprehensive testing

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: any;
  theme?: 'light' | 'dark';
  navigation?: boolean;
  queryClient?: QueryClient;
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store: testStore = store,
    theme = 'light',
    navigation = true,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = (
      <Provider store={testStore}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );

    if (navigation) {
      wrappedChildren = <NavigationContainer>{wrappedChildren}</NavigationContainer>;
    }

    return wrappedChildren;
  }

  return {
    store: testStore,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Mock navigation object for testing
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => false),
  isFocused: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  setOptions: jest.fn(),
  reset: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(() => ({})),
  getId: jest.fn(),
};

/**
 * Mock route object for testing
 */
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
  path: undefined,
};

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  private static measurements: Map<string, number> = new Map();

  static startMeasurement(name: string): void {
    this.measurements.set(name, Date.now());
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      throw new Error(`No measurement started for: ${name}`);
    }
    const duration = Date.now() - startTime;
    this.measurements.delete(name);
    return duration;
  }

  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    this.startMeasurement(name);
    const result = await fn();
    const duration = this.endMeasurement(name);
    return { result, duration };
  }

  static measure<T>(name: string, fn: () => T): { result: T; duration: number } {
    this.startMeasurement(name);
    const result = fn();
    const duration = this.endMeasurement(name);
    return { result, duration };
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityTestUtils {
  static checkAccessibilityLabels(component: any): string[] {
    const issues: string[] = [];

    // Check for missing accessibility labels
    const interactiveElements = component.findAll((node: any) => {
      return (
        node.type === 'TouchableOpacity' ||
        node.type === 'TouchableHighlight' ||
        node.type === 'TouchableWithoutFeedback' ||
        node.type === 'Pressable' ||
        node.type === 'Button'
      );
    });

    interactiveElements.forEach((element: any, index: number) => {
      if (!element.props.accessibilityLabel && !element.props.accessibilityHint) {
        issues.push(`Interactive element at index ${index} missing accessibility label`);
      }
    });

    return issues;
  }

  static checkColorContrast(component: any): string[] {
    // This would integrate with color contrast checking libraries
    // For now, return empty array as placeholder
    return [];
  }

  static checkFocusManagement(component: any): string[] {
    // Check for proper focus management
    const issues: string[] = [];
    // Implementation would check focus order, focus traps, etc.
    return issues;
  }
}

/**
 * Network testing utilities
 */
export class NetworkTestUtils {
  private static originalFetch = global.fetch;
  private static mockResponses: Map<string, any> = new Map();

  static mockNetworkResponse(url: string, response: any): void {
    this.mockResponses.set(url, response);
  }

  static enableNetworkMocking(): void {
    global.fetch = jest.fn((url: string) => {
      const mockResponse = this.mockResponses.get(url);
      if (mockResponse) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        });
      }
      return this.originalFetch(url);
    });
  }

  static disableNetworkMocking(): void {
    global.fetch = this.originalFetch;
    this.mockResponses.clear();
  }

  static simulateNetworkError(url: string): void {
    this.mockResponses.set(url, Promise.reject(new Error('Network error')));
  }

  static simulateSlowNetwork(url: string, delay: number = 3000): void {
    const originalResponse = this.mockResponses.get(url) || {};
    this.mockResponses.set(
      url,
      new Promise(resolve => {
        setTimeout(() => resolve(originalResponse), delay);
      }),
    );
  }
}

/**
 * State testing utilities
 */
export class StateTestUtils {
  static createMockStore(initialState: any = {}) {
    return {
      getState: jest.fn(() => initialState),
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      replaceReducer: jest.fn(),
    };
  }

  static waitForStateChange(
    store: any,
    predicate: (state: any) => boolean,
    timeout: number = 5000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('State change timeout'));
      }, timeout);

      const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        if (predicate(state)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(state);
        }
      });
    });
  }
}

/**
 * Animation testing utilities
 */
export class AnimationTestUtils {
  static mockAnimatedValue(initialValue: number = 0) {
    return {
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(() => initialValue),
      animate: jest.fn(),
      stopTracking: jest.fn(),
      track: jest.fn(),
      _value: initialValue,
    };
  }

  static mockTiming() {
    return {
      start: jest.fn(callback => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    };
  }

  static flushAnimations(): void {
    // Flush all pending animations
    jest.runAllTimers();
  }
}

/**
 * Component testing utilities
 */
export class ComponentTestUtils {
  static findByTestId(component: any, testId: string) {
    return component.findByProps({ testID: testId });
  }

  static findAllByTestId(component: any, testId: string) {
    return component.findAllByProps({ testID: testId });
  }

  static simulatePress(component: any, testId?: string) {
    const element = testId ? this.findByTestId(component, testId) : component;
    element.props.onPress();
  }

  static simulateTextInput(component: any, text: string, testId?: string) {
    const element = testId ? this.findByTestId(component, testId) : component;
    element.props.onChangeText(text);
  }

  static getComponentTree(component: any): any {
    return component.toJSON();
  }
}

// Export all utilities
export { renderWithProviders as render, mockNavigation, mockRoute };

// Re-export testing library utilities
export * from '@testing-library/react-native';
