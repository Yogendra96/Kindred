import { jest } from '@jest/globals';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

// Mock React Native Maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: any) => View(props);
  const MockMarker = (props: any) => View(props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: View,
    Circle: View,
    Polygon: View,
    Polyline: View,
  };
});

// Mock React Native Image Crop Picker
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
  openCamera: jest.fn(),
  clean: jest.fn(),
}));

// Mock React Native Share
jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(),
    shareSingle: jest.fn(),
  },
}));

// Mock React Native Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  canImplyAuthentication: jest.fn(),
  getSupportedBiometryType: jest.fn(),
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
    requestPermissionsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    Constants: {
      BarCodeType: {
        qr: 'qr',
        pdf417: 'pdf417',
        aztec: 'aztec',
        ean13: 'ean13',
        ean8: 'ean8',
        upc_e: 'upc_e',
        code39: 'code39',
        code93: 'code93',
        code128: 'code128',
        code39mod43: 'code39mod43',
        codabar: 'codabar',
        datamatrix: 'datamatrix',
        interleaved2of5: 'interleaved2of5',
        itf14: 'itf14',
        maxicode: 'maxicode',
        rss14: 'rss14',
        rssexpanded: 'rssexpanded',
        upc_a: 'upc_a',
      },
    },
  },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA1: 'SHA1',
    SHA256: 'SHA256',
    SHA384: 'SHA384',
    SHA512: 'SHA512',
    MD2: 'MD2',
    MD4: 'MD4',
    MD5: 'MD5',
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
}));

// Mock React Native Performance
jest.mock('react-native-performance', () => ({
  performance: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  PerformanceObserver: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  default: {
    apps: [],
    initializeApp: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/analytics', () => ({
  default: () => ({
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
    setCurrentScreen: jest.fn(),
    setAnalyticsCollectionEnabled: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  default: () => ({
    recordError: jest.fn(),
    log: jest.fn(),
    setUserId: jest.fn(),
    setAttributes: jest.fn(),
    crash: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        onSnapshot: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(),
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(),
      })),
      limit: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(),
      })),
    })),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/storage', () => ({
  default: () => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(),
      getDownloadURL: jest.fn(),
      delete: jest.fn(),
    })),
  }),
}));

jest.mock('@react-native-firebase/remote-config', () => ({
  default: () => ({
    setDefaults: jest.fn(),
    fetch: jest.fn(),
    activate: jest.fn(),
    fetchAndActivate: jest.fn(),
    getValue: jest.fn(),
    getAll: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/perf', () => ({
  default: () => ({
    newTrace: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      putAttribute: jest.fn(),
      putMetric: jest.fn(),
    })),
    newHttpMetric: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      setHttpResponseCode: jest.fn(),
      setRequestPayloadSize: jest.fn(),
      setResponseContentType: jest.fn(),
      setResponsePayloadSize: jest.fn(),
    })),
  }),
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-react-native', () => ({
  platform: jest.fn(),
  ready: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  sequential: jest.fn(),
  layers: {
    dense: jest.fn(),
  },
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock React Native Chart Kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  ProgressChart: 'ProgressChart',
  ContributionGraph: 'ContributionGraph',
  StackedBarChart: 'StackedBarChart',
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

// Mock React Native SVG
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    Svg: View,
    Circle: View,
    Ellipse: View,
    G: View,
    Text: View,
    TSpan: View,
    TextPath: View,
    Path: View,
    Polygon: View,
    Polyline: View,
    Line: View,
    Rect: View,
    Use: View,
    Image: View,
    Symbol: View,
    Defs: View,
    LinearGradient: View,
    RadialGradient: View,
    Stop: View,
    ClipPath: View,
    Pattern: View,
    Mask: View,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));

// Mock Geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

// Global test utilities
global.fetch = jest.fn();

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to ignore specific console outputs
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup fake timers
jest.useFakeTimers();

// Increase timeout for async operations
jest.setTimeout(10000);
