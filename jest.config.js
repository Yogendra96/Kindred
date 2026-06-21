module.exports = {
  preset: 'react-native',

  // Test environment

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/src/__mocks__/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/vendor/',
    '<rootDir>/e2e/',
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|react-native-.*|@react-navigation|@react-native-firebase|@notifee|immer|@reduxjs|victory|lucide-react-native|react-native-chart-kit)/',
  ],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/tests/**',
    '!src/config/development.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/services/MicroMobilityTelemetryService.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './src/services/TelemetryTransmissionEngine.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Additional configurations
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  errorOnDeprecated: true,
  notify: false,
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache',
  testTimeout: 10000,
  detectOpenHandles: true,

  // Watch plugins
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
