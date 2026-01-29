import type { ReactElement, ReactElement } from 'react';
import React from 'react';
import type {
  RenderOptions,
  RenderOptions,
} from '@testing-library/react-native';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers here
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
      carbon: (state = { activities: [], totalSaved: 0 }, action) => state,
      social: (state = { friends: [], activities: [] }, action) => state,
      achievements: (state = { badges: [], userStats: null }, action) => state,
      ui: (state = { theme: 'light', notifications: [] }, action) => state,
    },
    preloadedState: initialState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Mock query client
const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  initialState?: any;
  queryClient?: QueryClient;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  initialState = {},
  queryClient = createMockQueryClient(),
}) => {
  const store = createMockStore(initialState);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer>{children}</NavigationContainer>
          </QueryClientProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  queryClient?: QueryClient;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { initialState, queryClient, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders initialState={initialState} queryClient={queryClient}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data factories
export const TestDataFactory = {
  // User data
  createUser: (overrides = {}) => ({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    createdAt: new Date().toISOString(),
    stats: {
      level: 1,
      totalCarbonSaved: 0,
      activitiesLogged: 0,
      streakDays: 0,
      friendsCount: 0,
      challengesCompleted: 0,
    },
    preferences: {
      notifications: true,
      theme: 'light',
      units: 'metric',
    },
    ...overrides,
  }),

  // Carbon activity data
  createCarbonActivity: (overrides = {}) => ({
    id: 'test-activity-id',
    userId: 'test-user-id',
    type: 'transportation',
    category: 'walking',
    description: 'Walked to work instead of driving',
    carbonSaved: 2.5,
    distance: 5,
    duration: 30,
    timestamp: new Date().toISOString(),
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
    },
    verified: false,
    ...overrides,
  }),

  // Badge data
  createBadge: (overrides = {}) => ({
    id: 'test-badge-id',
    name: 'Test Badge',
    description: 'A test badge for testing',
    icon: '🏆',
    category: 'milestone',
    rarity: 'common',
    requirements: {
      type: 'activities_count',
      value: 1,
      timeframe: 'all-time',
    },
    rewards: {
      points: 50,
    },
    isHidden: false,
    isActive: true,
    createdDate: new Date().toISOString(),
    metadata: {
      difficulty: 1,
      estimatedTime: '1 day',
    },
    ...overrides,
  }),

  // Achievement data
  createAchievement: (overrides = {}) => ({
    id: 'test-achievement-id',
    userId: 'test-user-id',
    badgeId: 'test-badge-id',
    badge: TestDataFactory.createBadge(),
    unlockedDate: new Date().toISOString(),
    progress: {
      current: 1,
      target: 1,
      percentage: 100,
    },
    isCompleted: true,
    notificationSent: false,
    shareCount: 0,
    metadata: {
      unlockMethod: 'automatic',
    },
    ...overrides,
  }),

  // Social activity data
  createSocialActivity: (overrides = {}) => ({
    id: 'test-social-activity-id',
    uid: 'test-user-id',
    type: 'carbon_activity',
    title: 'Saved 2.5kg CO₂ by walking',
    description: 'Walked to work instead of driving',
    timestamp: new Date().toISOString(),
    isPublic: true,
    likes: {
      count: 0,
      users: [],
    },
    comments: [],
    data: {
      carbonSaved: 2.5,
      activityType: 'walking',
    },
    ...overrides,
  }),

  // Challenge data
  createChallenge: (overrides = {}) => ({
    id: 'test-challenge-id',
    title: 'Walk 10km This Week',
    description: 'Challenge yourself to walk 10km this week',
    type: 'distance',
    category: 'transportation',
    target: 10,
    unit: 'km',
    duration: 7,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    participants: [],
    rewards: {
      points: 200,
      carbonCredits: 10,
    },
    isActive: true,
    createdBy: 'system',
    ...overrides,
  }),

  // Carbon offset data
  createCarbonOffset: (overrides = {}) => ({
    id: 'test-offset-id',
    name: 'Reforestation Project',
    description: 'Plant trees in the Amazon rainforest',
    provider: 'Green Earth Initiative',
    type: 'forestry',
    location: 'Brazil',
    pricePerTon: 25,
    availableCredits: 1000,
    certification: 'VCS',
    rating: 4.5,
    images: ['https://example.com/forest1.jpg'],
    verificationDocuments: ['https://example.com/cert.pdf'],
    impactMetrics: {
      treesPlanted: 500,
      biodiversityScore: 8.5,
      communityBenefit: 9.0,
    },
    ...overrides,
  }),

  // Notification data
  createNotification: (overrides = {}) => ({
    id: 'test-notification-id',
    userId: 'test-user-id',
    type: 'badge_unlocked',
    title: 'Badge Unlocked!',
    message: 'You earned the Test Badge!',
    timestamp: new Date().toISOString(),
    isRead: false,
    priority: 'medium',
    actions: [
      {
        label: 'View',
        action: 'view_achievements',
      },
    ],
    ...overrides,
  }),
};

// Mock API responses
export const MockApiResponses = {
  // Carbon API responses
  carbonFootprint: {
    success: true,
    data: {
      carbonFootprint: 2.5,
      unit: 'kg',
      breakdown: {
        transportation: 1.5,
        energy: 1.0,
      },
    },
  },

  // Weather API responses
  weather: {
    success: true,
    data: {
      temperature: 22,
      humidity: 65,
      windSpeed: 10,
      condition: 'sunny',
      airQuality: {
        aqi: 45,
        level: 'good',
      },
    },
  },

  // Product barcode responses
  productInfo: {
    success: true,
    data: {
      name: 'Test Product',
      brand: 'Test Brand',
      category: 'food',
      carbonFootprint: 1.2,
      sustainabilityScore: 7.5,
      certifications: ['organic', 'fair-trade'],
    },
  },

  // ML prediction responses
  carbonPrediction: {
    success: true,
    data: {
      prediction: 15.5,
      confidence: 0.85,
      factors: {
        transportation: 0.4,
        energy: 0.3,
        consumption: 0.3,
      },
    },
  },
};

// Test helpers
export const TestHelpers = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock navigation
  createMockNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(() => 'test-screen-id'),
    getParent: jest.fn(),
    getState: jest.fn(() => ({})),
    reset: jest.fn(),
    setParams: jest.fn(),
  }),

  // Create mock route
  createMockRoute: (params = {}) => ({
    key: 'test-route-key',
    name: 'TestScreen',
    params,
  }),

  // Mock Firebase timestamp
  createFirebaseTimestamp: (date = new Date()) => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
    toMillis: () => date.getTime(),
  }),

  // Mock geolocation
  mockGeolocation: () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn(success =>
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        }),
      ),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });

    return mockGeolocation;
  },

  // Mock permissions
  mockPermissions: () => {
    const mockPermissions = {
      query: jest.fn(() => Promise.resolve({ state: 'granted' })),
      request: jest.fn(() => Promise.resolve({ state: 'granted' })),
    };

    Object.defineProperty(global.navigator, 'permissions', {
      value: mockPermissions,
      writable: true,
    });

    return mockPermissions;
  },

  // Mock camera
  mockCamera: () => {
    const mockCamera = {
      getAvailableCameraDevices: jest.fn(() =>
        Promise.resolve([
          {
            id: 'back',
            position: 'back',
            hasFlash: true,
            hasTorch: true,
            isMultiCam: false,
            supportsDepthCapture: false,
            supportsRawCapture: false,
            supportsLowLightBoost: false,
            supportsFocus: true,
            supportsZoom: true,
            minZoom: 1,
            maxZoom: 10,
            neutralZoom: 1,
          },
        ]),
      ),
      requestCameraPermission: jest.fn(() => Promise.resolve('authorized')),
    };

    return mockCamera;
  },

  // Create test IDs for components
  createTestIds: (componentName: string) => ({
    container: `${componentName}-container`,
    header: `${componentName}-header`,
    content: `${componentName}-content`,
    footer: `${componentName}-footer`,
    button: `${componentName}-button`,
    input: `${componentName}-input`,
    list: `${componentName}-list`,
    item: `${componentName}-item`,
    loading: `${componentName}-loading`,
    error: `${componentName}-error`,
    empty: `${componentName}-empty`,
  }),

  // Performance testing helpers
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },

  // Memory usage helpers
  measureMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  },

  // Network mocking
  mockNetworkResponse: (url: string, response: any, delay = 0) => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(requestUrl => {
      if (requestUrl === url) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(response),
              text: () => Promise.resolve(JSON.stringify(response)),
            } as Response);
          }, delay);
        });
      }
      return originalFetch(requestUrl);
    }) as jest.Mock;
  },

  // Error simulation
  simulateNetworkError: (url: string) => {
    global.fetch = jest.fn(requestUrl => {
      if (requestUrl === url) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);
    }) as jest.Mock;
  },

  // Accessibility testing helpers
  checkAccessibility: (element: any) => {
    const accessibilityChecks = {
      hasAccessibilityLabel: !!element.props.accessibilityLabel,
      hasAccessibilityHint: !!element.props.accessibilityHint,
      hasAccessibilityRole: !!element.props.accessibilityRole,
      isAccessible: element.props.accessible !== false,
    };

    return accessibilityChecks;
  },
};

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    const checks = TestHelpers.checkAccessibility(received);
    const pass = checks.hasAccessibilityLabel && checks.isAccessible;

    if (pass) {
      return {
        message: () => `Expected element not to be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected element to be accessible (missing accessibility label or not accessible)`,
        pass: false,
      };
    }
  },

  toHavePerformanceWithin(received: number, expected: number) {
    const pass = received <= expected;

    if (pass) {
      return {
        message: () =>
          `Expected render time ${received}ms to be greater than ${expected}ms`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected render time ${received}ms to be within ${expected}ms`,
        pass: false,
      };
    }
  },
});

// Export everything
export * from '@testing-library/react-native';
export { customRender as render };
export { AllProviders, createMockStore, createMockQueryClient };
