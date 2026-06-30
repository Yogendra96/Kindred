// @ts-nocheck
/* eslint-disable */
import 'reflect-metadata';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock(
  'react-native-performance',
  () => ({
    performance: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
    },
    PerformanceObserver: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    })),
  }),
  { virtual: true },
);

// Global type declarations
declare global {
  var __DEV__: boolean;
  var global: any;
  var CARBON_API_KEY: string;
  var CARBON_API_BASE_URL: string;
}

global.CARBON_API_KEY = 'test_carbon_key_123';
global.CARBON_API_BASE_URL = 'https://api.carbonfootprint.com/test';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock @env
jest.mock(
  '@env',
  () => ({
    CARBON_API_KEY: 'test_carbon_key_123',
    CARBON_API_BASE_URL: 'https://api.carbonfootprint.com/test',
  }),
  { virtual: true },
);

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  // Basic NativeModules mocks
  RN.NativeModules.StatusBarManager = {
    getHeight: jest.fn(cb => cb && cb({ height: 44 })),
    setStyle: jest.fn(),
    setHidden: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
  };

  // RNGestureHandlerModule mock for react-native-gesture-handler
  RN.NativeModules.RNGestureHandlerModule = {
    attachGestureHandler: jest.fn(),
    createGestureHandler: jest.fn(),
    dropGestureHandler: jest.fn(),
    updateGestureHandler: jest.fn(),
    State: {},
    Directions: {},
  };

  RN.Platform.select = jest.fn(obj => obj.ios || obj.default);

  Object.defineProperty(RN, 'Dimensions', {
    value: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      set: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  RN.Alert.alert = jest.fn();

  return RN;
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      dispatch: jest.fn(),
      reset: jest.fn(),
      replace: jest.fn(),
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
jest.mock('@react-native-firebase/app', () => {
  const mockApp = {
    options: {
      projectId: 'kindred-dummy-project',
    },
  };
  const mockFirebase = {
    app: jest.fn(() => mockApp),
    initializeApp: jest.fn(() => mockApp),
    onReady: () => Promise.resolve(),
    apps: [],
  };
  return {
    __esModule: true,
    default: mockFirebase,
    firebase: mockFirebase,
  };
});

jest.mock('@react-native-firebase/auth', () => {
  const mockAuth = jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  }));
  return {
    __esModule: true,
    default: mockAuth,
    auth: mockAuth,
  };
});

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn(() => ({
    collection: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] }),
      onSnapshot: jest.fn(),
      doc: jest.fn().mockReturnThis(),
      add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
    }),
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      onSnapshot: jest.fn(),
    }),
    FieldValue: {
      serverTimestamp: jest.fn(),
      increment: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
    },
  }));
  return {
    __esModule: true,
    default: mockFirestore,
    firestore: mockFirestore,
  };
});

jest.mock(
  '@react-native-firebase/analytics',
  () => {
    const mockAnalytics = jest.fn(() => ({
      logEvent: jest.fn(),
      setUserProperties: jest.fn(),
      setUserId: jest.fn(),
      setCurrentScreen: jest.fn(),
    }));
    mockAnalytics.default = mockAnalytics;
    return mockAnalytics;
  },
  { virtual: true },
);

jest.mock(
  '@react-native-firebase/crashlytics',
  () => {
    const mockCrashlytics = jest.fn(() => ({
      log: jest.fn(),
      recordError: jest.fn(),
      setUserId: jest.fn(),
      setCrashlyticsCollectionEnabled: jest.fn(),
      setAttribute: jest.fn(),
    }));
    mockCrashlytics.default = mockCrashlytics;
    return mockCrashlytics;
  },
  { virtual: true },
);

jest.mock(
  '@react-native-firebase/messaging',
  () => {
    const mockMessaging = jest.fn(() => ({
      hasPermission: jest.fn(() => Promise.resolve(1)),
      requestPermission: jest.fn(() => Promise.resolve(1)),
      getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
      onMessage: jest.fn(),
      onNotificationOpenedApp: jest.fn(),
      getInitialNotification: jest.fn(() => Promise.resolve(null)),
      subscribeToTopic: jest.fn(),
      unsubscribeFromTopic: jest.fn(),
    }));
    mockMessaging.default = mockMessaging;
    return mockMessaging;
  },
  { virtual: true },
);

jest.mock(
  '@react-native-firebase/perf',
  () => {
    const mockPerf = jest.fn(() => ({
      newTrace: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        putAttribute: jest.fn(),
        putMetric: jest.fn(),
      })),
    }));
    mockPerf.default = mockPerf;
    return mockPerf;
  },
  { virtual: true },
);

// Mock Notifee
jest.mock(
  '@notifee/react-native',
  () => ({
    __esModule: true,
    default: {
      requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
      createChannel: jest.fn(() => Promise.resolve('test-channel')),
      displayNotification: jest.fn(() => Promise.resolve('test-notification')),
      cancelAllNotifications: jest.fn(() => Promise.resolve()),
      onForegroundEvent: jest.fn(),
      onBackgroundEvent: jest.fn(),
    },
    AndroidImportance: { HIGH: 4, DEFAULT: 3 },
    EventType: { DELIVERED: 1, PRESS: 2 },
  }),
  { virtual: true },
);

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Swipeable: ({ children }) => children,
    DrawerLayout: ({ children }) => children,
    State: {},
    PanGestureHandler: ({ children }) => children,
    TapGestureHandler: ({ children }) => children,
    FlingGestureHandler: ({ children }) => children,
    ForceTouchGestureHandler: ({ children }) => children,
    LongPressGestureHandler: ({ children }) => children,
    PinchGestureHandler: ({ children }) => children,
    RotationGestureHandler: ({ children }) => children,
    RawButton: ({ children }) => children,
    BaseButton: ({ children }) => children,
    RectButton: ({ children }) => children,
    BorderlessButton: ({ children }) => children,
    FlatList: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
    Gesture: {
      Tap: () => ({
        onStart: () => ({ onEnd: () => ({}) }),
        runOnJS: () => ({}),
      }),
      Pan: () => ({
        onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
        runOnJS: () => ({}),
      }),
    },
    GestureDetector: ({ children }) => children,
    Directions: {},
  };
});

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
  ),
}));

// Mock Native Picker/Sign-in
jest.mock('react-native-image-crop-picker', () => ({
  openCamera: jest.fn(),
  openPicker: jest.fn(),
  clean: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
    hasPlayServices: jest.fn(),
    getTokens: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 0,
    IN_PROGRESS: 1,
    PLAY_SERVICES_NOT_AVAILABLE: 2,
  },
}));

// Mock Redux
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: () => jest.fn(),
  };
});

// Mock Redux Persist
jest.mock('redux-persist', () => {
  const actual = jest.requireActual('redux-persist');
  return {
    ...actual,
    persistStore: jest.fn().mockReturnValue({
      pause: jest.fn(),
      persist: jest.fn(),
      purge: jest.fn(),
      flush: jest.fn(),
    }),
    persistReducer: jest.fn().mockImplementation((config, reducer) => reducer),
  };
});

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }: any) => children,
}));

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    QueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      prefetchQuery: jest.fn(),
    })),
    QueryClientProvider: ({ children }: any) => children,
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
  };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo Modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: { BarCodeType: { qr: 'qr', ean13: 'ean13', ean8: 'ean8', code128: 'code128' } },
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('../services/HapticFeedbackService', () => ({
  __esModule: true,
  default: {
    triggerSuccess: jest.fn(() => Promise.resolve()),
    triggerError: jest.fn(() => Promise.resolve()),
    triggerWarning: jest.fn(() => Promise.resolve()),
    triggerSelection: jest.fn(() => Promise.resolve()),
    triggerImpact: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Internal Services
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
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock axios - using our manual mock from src/__mocks__
jest.mock('axios');

// Mock react-native-config
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    API_URL: 'https://api.example.com',
    ENVIRONMENT: 'test',
    getConfig: jest.fn(() => ({})),
  },
  Config: {
    API_URL: 'https://api.example.com',
    ENVIRONMENT: 'test',
    getConfig: jest.fn(() => ({})),
  },
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getUniqueId: jest.fn(() => Promise.resolve('mock-id')),
    getUniqueIdSync: jest.fn(() => 'mock-id'),
    isEmulator: jest.fn(() => Promise.resolve(false)),
    isEmulatorSync: jest.fn(() => false),
    getVersion: jest.fn(() => '1.0.0'),
    getSystemVersion: jest.fn(() => '14.0'),
    getManufacturer: jest.fn(() => Promise.resolve('Apple')),
    getManufacturerSync: jest.fn(() => 'Apple'),
    getModel: jest.fn(() => 'iPhone'),
  },
  getUniqueId: jest.fn(() => Promise.resolve('mock-id')),
  getUniqueIdSync: jest.fn(() => 'mock-id'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
  isEmulatorSync: jest.fn(() => false),
  getVersion: jest.fn(() => '1.0.0'),
  getSystemVersion: jest.fn(() => '14.0'),
}));

// Mock tensorflow
jest.mock(
  '@tensorflow/tfjs-react-native',
  () => ({
    cameraWithTensors: jest.fn(),
  }),
  { virtual: true },
);

// Mock expo vector icons
jest.mock(
  '@expo/vector-icons',
  () => {
    const { View } = require('react-native');
    return {
      Ionicons: View,
      MaterialIcons: View,
      MaterialCommunityIcons: View,
      FontAwesome: View,
      FontAwesome5: View,
      AntDesign: View,
      Entypo: View,
    };
  },
  { virtual: true },
);

jest.mock(
  'expo-font',
  () => ({
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(),
  }),
  { virtual: true },
);

// Mock react-native-keychain
jest.mock(
  'react-native-keychain',
  () => ({
    setGenericPassword: jest.fn(() => Promise.resolve(true)),
    getGenericPassword: jest.fn(() => Promise.resolve(false)),
    resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  }),
  { virtual: true },
);

// Mock expo camera and image tools
jest.mock(
  'expo-camera',
  () => {
    const { View } = require('react-native');
    return {
      Camera: View,
      CameraType: { front: 'front', back: 'back' },
      FlashMode: { on: 'on', off: 'off', auto: 'auto' },
    };
  },
  { virtual: true },
);

jest.mock(
  'expo-image-manipulator',
  () => ({
    manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'mock-uri', width: 100, height: 100 })),
    SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  }),
  { virtual: true },
);

jest.mock(
  'expo-image-picker',
  () => ({
    launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
    launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
    MediaTypeOptions: { Images: 'images', Videos: 'videos', All: 'all' },
  }),
  { virtual: true },
);

jest.mock(
  'expo-sensors',
  () => ({
    Accelerometer: {
      isAvailableAsync: jest.fn(() => Promise.resolve(true)),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn(),
    },
    Pedometer: {
      isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    },
  }),
  { virtual: true },
);

jest.mock(
  'expo-battery',
  () => {
    const mockBattery = {
      getBatteryStateAsync: jest.fn(() => Promise.resolve(2)),
      BatteryState: { UNKNOWN: 0, UNPLUGGED: 1, CHARGING: 2, FULL: 3 },
    };
    return {
      __esModule: true,
      default: mockBattery,
      ...mockBattery,
    };
  },
  { virtual: true },
);

jest.mock(
  'expo-location',
  () => ({
    requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCurrentPositionAsync: jest.fn(() =>
      Promise.resolve({
        coords: { latitude: 0, longitude: 0, altitude: 0, speed: 0 },
        timestamp: 0,
      }),
    ),
  }),
  { virtual: true },
);

jest.mock(
  'expo-task-manager',
  () => ({
    defineTask: jest.fn(),
    isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  }),
  { virtual: true },
);

// Global setup
global.window = {};
global.window = global;
global.__reanimatedWorkletInit = jest.fn();
global.ReanimatedDataMock = { now: () => 0 };

// Timeouts
jest.setTimeout(30000);

// Console suppression
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    const msg = args[0] || '';
    if (
      typeof msg === 'string' &&
      (msg.includes('Animated:') ||
        msg.includes('AsyncStorage has been extracted') ||
        msg.includes('ViewPropTypes will be removed') ||
        msg.includes('EventEmitter.removeListener') ||
        msg.includes('[react-native-gesture-handler]') ||
        msg.includes('Setting a timer') ||
        msg.includes('RCTBridge required dispatch_sync'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  console.error = (...args) => {
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.clear();
});

console.log('🧪 Consolidated test setup completed');
