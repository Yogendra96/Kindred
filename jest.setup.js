// Simple Jest setup for React Native
global.__reanimatedWorkletInit = jest.fn();
global.window = {};
global.window = global;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

// Mock Redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

// Console override to prevent test pollution
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  // Ignore specific warnings that are known and cannot be fixed
  const ignoredWarnings = [
    'Warning: ReactDOM.render is deprecated',
    'Warning: react-test-renderer is deprecated',
  ];

  if (!ignoredWarnings.some(warning => args[0]?.includes?.(warning))) {
    originalError.apply(console, args);
  }
};

console.warn = (...args) => {
  // Ignore specific warnings
  const ignoredWarnings = [
    'Warning: react-test-renderer is deprecated',
  ];

  if (!ignoredWarnings.some(warning => args[0]?.includes?.(warning))) {
    originalWarn.apply(console, args);
  }
};