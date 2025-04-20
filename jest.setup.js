import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.StatusBarManager = { getHeight: jest.fn(() => Promise.resolve(44)) };
  RN.Platform.select = jest.fn(obj => obj.ios);
  RN.Dimensions = {
    ...RN.Dimensions,
    get: jest.fn(() => ({ width: 375, height: 812 })),
  };
  return RN;
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
    dispatch: jest.fn(),
    reset: jest.fn(),
    replace: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useIsFocused: () => true,
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(),
  initializeApp: jest.fn(),
}));
jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null,
  })),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    onSnapshot: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));
jest.mock('@react-native-firebase/storage', () => ({
  storage: jest.fn(() => ({
    ref: jest.fn(),
    uploadFile: jest.fn(),
    getDownloadURL: jest.fn(),
  })),
}));

// Mock Geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(success =>
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 0,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: 1234567890,
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
}));

// Mock Image Picker
jest.mock('react-native-image-crop-picker', () => ({
  openCamera: jest.fn(),
  openPicker: jest.fn(),
  clean: jest.fn(),
}));

// Mock Google Sign In
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

// Mock Redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Analytics Service
jest.mock('./src/services/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreen: jest.fn(),
    logUserProperty: jest.fn(),
    logCarbonFootprintAdded: jest.fn(),
    logActivityCompleted: jest.fn(),
    logEcoTipViewed: jest.fn(),
    logUserEngagement: jest.fn(),
  },
}));

// Mock Logging Service
jest.mock('./src/services/LoggingService', () => ({
  loggingService: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Global setup
global.window = {};
global.window = global;
global.__reanimatedWorkletInit = jest.fn();
global.ReanimatedDataMock = {
  now: () => 0,
};

// Console error/warn override to fail tests on warnings
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  originalError.apply(console, args);
  throw new Error(args[0]);
};

console.warn = (...args) => {
  // Ignore specific warnings that are known and cannot be fixed
  const ignoredWarnings = [
    'Animated:',
    'AsyncStorage has been extracted',
    'ViewPropTypes will be removed',
    'EventEmitter.removeListener',
    '[react-native-gesture-handler]',
    'Setting a timer',
    'RCTBridge required dispatch_sync',
  ];

  if (!ignoredWarnings.some(warning => args[0]?.includes?.(warning))) {
    originalWarn.apply(console, args);
    throw new Error(args[0]);
  }
};
