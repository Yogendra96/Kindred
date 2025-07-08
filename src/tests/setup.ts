// Enhanced test setup for React Native with comprehensive mocking
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Global type declarations
declare global {
  var __DEV__: boolean;
  var global: any;
  var process: {
    env: Record<string, string | undefined>;
  };
  var jest: any;
  var beforeAll: (fn: () => void | Promise<void>) => void;
  var afterAll: (fn: () => void | Promise<void>) => void;
  var beforeEach: (fn: () => void | Promise<void>) => void;
  var afterEach: (fn: () => void | Promise<void>) => void;
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      RNGestureHandlerModule: {
        attachGestureHandler: jest.fn(),
        createGestureHandler: jest.fn(),
        dropGestureHandler: jest.fn(),
        updateGestureHandler: jest.fn(),
        State: {},
        Directions: {},
      },
    },
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn(obj => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
      name: 'TestScreen',
      key: 'test-key',
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  default: () => ({
    onReady: () => Promise.resolve(),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
        onSnapshot: jest.fn(),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
        onSnapshot: jest.fn(),
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ docs: [] })),
        })),
      })),
      get: jest.fn(() => Promise.resolve({ docs: [] })),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(),
      increment: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
    },
  }),
}));

// Mock Redux Toolkit Query
jest.mock('@reduxjs/toolkit/query/react', () => ({
  createApi: jest.fn(),
  fetchBaseQuery: jest.fn(),
}));

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    prefetchQuery: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' }),
    ),
    Constants: {
      BarCodeType: {
        qr: 'qr',
        ean13: 'ean13',
        ean8: 'ean8',
        code128: 'code128',
      },
    },
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

// Mock React Native Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() =>
    Promise.resolve({ username: 'test', password: 'test' }),
  ),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  },
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'DEVICE_PASSCODE_OR_BIOMETRICS',
  },
  BIOMETRY_TYPE: {
    TOUCH_ID: 'TouchID',
    FACE_ID: 'FaceID',
    FINGERPRINT: 'Fingerprint',
  },
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock React Native Share
jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(() => Promise.resolve()),
  },
}));

// Mock React Native Performance
jest.mock('react-native-performance', () => ({
  Performance: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-react-native', () => ({
  platform: jest.fn(),
  ready: jest.fn(() => Promise.resolve()),
}));

jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(() =>
    Promise.resolve({
      predict: jest.fn(() => ({ dataSync: () => [0.5] })),
    }),
  ),
  tensor: jest.fn(),
  dispose: jest.fn(),
}));

// Mock React Native Vision Camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getAvailableCameraDevices: jest.fn(() => Promise.resolve([])),
    requestCameraPermission: jest.fn(() => Promise.resolve('authorized')),
  },
  useCameraDevices: jest.fn(() => ({ back: null, front: null })),
  useFrameProcessor: jest.fn(),
}));

// Mock Flipper
jest.mock('react-native-flipper', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock our enhanced services
jest.mock('../services/EnhancedPerformanceService', () => ({
  EnhancedPerformanceService: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      startTracking: jest.fn(),
      stopTracking: jest.fn(),
      recordMetric: jest.fn(),
      measureFunction: jest.fn((name: string, fn: any) => fn()),
      measureAsync: jest.fn(async (name: string, fn: any) => await fn()),
      getPerformanceSummary: jest.fn(() => ({})),
      exportPerformanceData: jest.fn(() => ({})),
      clearData: jest.fn(),
    })),
  },
}));

jest.mock('../services/EnhancedAnalyticsService', () => ({
  EnhancedAnalyticsService: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      trackEvent: jest.fn(),
      trackScreen: jest.fn(),
      trackError: jest.fn(),
      trackPerformance: jest.fn(),
      startSession: jest.fn(),
      endSession: jest.fn(),
      getAnalyticsSummary: jest.fn(() => ({})),
      exportAnalyticsData: jest.fn(() => ({})),
      clearAnalyticsData: jest.fn(),
    })),
  },
}));

jest.mock('../services/EnhancedSecurityService', () => ({
  EnhancedSecurityService: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      encrypt: jest.fn(data => Promise.resolve(data)),
      decrypt: jest.fn(data => Promise.resolve(data)),
      storeSecurely: jest.fn(),
      retrieveSecurely: jest.fn(),
      validateDataIntegrity: jest.fn(() => true),
      sanitizeInput: jest.fn((input: any) => input),
      getSecuritySummary: jest.fn(() => ({})),
      exportSecurityData: jest.fn(() => ({})),
      clearSecurityData: jest.fn(),
    })),
  },
}));

jest.mock('../services/LoggingService', () => ({
  LoggingService: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLogLevel: jest.fn(),
    getLogs: jest.fn(() => []),
    clearLogs: jest.fn(),
    exportLogs: jest.fn(() => ''),
  })),
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn(() => () => ({})),
}));

// Mock Chart Kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  ProgressChart: 'ProgressChart',
  ContributionGraph: 'ContributionGraph',
}));

// Mock Victory Native
jest.mock('victory-native', () => ({
  VictoryChart: 'VictoryChart',
  VictoryLine: 'VictoryLine',
  VictoryBar: 'VictoryBar',
  VictoryPie: 'VictoryPie',
  VictoryArea: 'VictoryArea',
  VictoryAxis: 'VictoryAxis',
  VictoryTheme: {
    material: {},
  },
}));

// Mock Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Circle: 'Circle',
  Group: 'Group',
  Paint: 'Paint',
  Path: 'Path',
  Rect: 'Rect',
  Text: 'Text',
  useValue: jest.fn(() => ({ current: 0 })),
  useTiming: jest.fn(() => ({ current: 0 })),
  runTiming: jest.fn(),
}));

// Mock Error Boundary
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  withErrorBoundary: (Component: React.ComponentType) => Component,
  useErrorHandler: () => jest.fn(),
}));

// Mock Axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock Expo Crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('hashed-string')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
    SHA512: 'SHA512',
    MD5: 'MD5',
  },
}));

// Mock Expo Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Crypto for security service
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
        decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
        generateKey: jest.fn(() => Promise.resolve({})),
        importKey: jest.fn(() => Promise.resolve({})),
        exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
      },
    },
  });
}

// Mock TextEncoder/TextDecoder
if (typeof global !== 'undefined') {
  if (typeof global.TextEncoder === 'undefined') {
    (global as any).TextEncoder = class TextEncoder {
      encode(str: string) {
        return new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
      }
    };
  }

  if (typeof global.TextDecoder === 'undefined') {
    (global as any).TextDecoder = class TextDecoder {
      decode(bytes: Uint8Array) {
        return String.fromCharCode(...Array.from(bytes));
      }
    };
  }
}

// Mock Performance API
if (
  typeof global !== 'undefined' &&
  typeof global.performance === 'undefined'
) {
  (global as any).performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  } as any;
}

// Mock PerformanceObserver
if (
  typeof global !== 'undefined' &&
  typeof global.PerformanceObserver === 'undefined'
) {
  (global as any).PerformanceObserver = class PerformanceObserver {
    constructor(_callback: any) {}
    observe() {}
    disconnect() {}
  } as any;
}

// Global test utilities
if (typeof global !== 'undefined') {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    }),
  ) as jest.Mock;
}

// Enhanced global test utilities
(global as any).testUtils = {
  // Wait for async operations
  waitFor: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock timer helpers
  advanceTimers: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  // Mock network responses
  mockNetworkResponse: (response: any, delay: number = 0) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(response), delay);
    });
  },

  // Create mock user
  createMockUser: (overrides: any = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  }),

  // Create mock navigation
  createMockNavigation: (overrides: any = {}) => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    ...overrides,
  }),

  // Create mock route
  createMockRoute: (overrides: any = {}) => ({
    key: 'test-route',
    name: 'TestScreen',
    params: {},
    ...overrides,
  }),
};

// Console warnings suppression for tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Setup global test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset AsyncStorage
  mockAsyncStorage.clear();

  // Reset global dev utils
  (global as any).devUtils = undefined;
  (global as any).featureFlags = undefined;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  // Restore console methods
  jest.restoreAllMocks();
});

// Enhanced error handling for tests
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason: any, promise: any) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error: any) => {
    console.error('Uncaught Exception:', error);
  });
}

// Test timeout
jest.setTimeout(30000);

console.log('🧪 Enhanced test setup completed');
