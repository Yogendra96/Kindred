export default {
  // Multiple test projects configuration
  projects: [
    // Unit Tests
    {
      displayName: 'Unit Tests',
      preset: 'react-native',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}',
        '<rootDir>/src/**/?(*.)(test|spec).{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '/performance/',
        '/accessibility/',
      ],
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
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js'
      ],
      // Transform ignore patterns
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-iphone-x-helper|react-native-device-info|react-native-keychain|@react-native-async-storage|react-native-svg|react-native-linear-gradient|react-native-image-picker|react-native-permissions|@react-native-firebase|react-native-google-signin|@shopify/react-native-skia|victory-native|@expo/vector-icons)/)',
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
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      coverageDirectory: '<rootDir>/coverage/unit',
      coverageReporters: [
        'text',
        'lcov',
        'html',
        'json-summary',
      ],
    },
    
    // Integration Tests
    {
      displayName: 'Integration Tests',
      preset: 'react-native',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/integration/**/*.(test|spec).{js,jsx,ts,tsx}',
        '<rootDir>/src/**/integration.*.(test|spec).{js,jsx,ts,tsx}',
      ],
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
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/src/tests/integration/setup.js'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-iphone-x-helper|react-native-device-info|react-native-keychain|@react-native-async-storage|react-native-svg|react-native-linear-gradient|react-native-image-picker|react-native-permissions|@react-native-firebase|react-native-google-signin|@shopify/react-native-skia|victory-native|@expo/vector-icons)/)',
      ],
      testTimeout: 30000,
      coverageDirectory: '<rootDir>/coverage/integration',
    },

    // Performance Tests
    {
      displayName: 'Performance Tests',
      preset: 'react-native',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/performance/**/*.(test|spec).{js,jsx,ts,tsx}',
        '<rootDir>/src/**/performance.*.(test|spec).{js,jsx,ts,tsx}',
      ],
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
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/src/tests/performance/setup.js'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-iphone-x-helper|react-native-device-info|react-native-keychain|@react-native-async-storage|react-native-svg|react-native-linear-gradient|react-native-image-picker|react-native-permissions|@react-native-firebase|react-native-google-signin|@shopify/react-native-skia|victory-native|@expo/vector-icons)/)',
      ],
      testTimeout: 60000,
      coverageDirectory: '<rootDir>/coverage/performance',
    },

    // Accessibility Tests
    {
      displayName: 'Accessibility Tests',
      preset: 'react-native',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/accessibility/**/*.(test|spec).{js,jsx,ts,tsx}',
        '<rootDir>/src/**/accessibility.*.(test|spec).{js,jsx,ts,tsx}',
      ],
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
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/src/tests/accessibility/setup.js'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-iphone-x-helper|react-native-device-info|react-native-keychain|@react-native-async-storage|react-native-svg|react-native-linear-gradient|react-native-image-picker|react-native-permissions|@react-native-firebase|react-native-google-signin|@shopify/react-native-skia|victory-native|@expo/vector-icons)/)',
      ],
      coverageDirectory: '<rootDir>/coverage/accessibility',
    },
  ],

  // Global settings
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  // File extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Additional configurations
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  errorOnDeprecated: true,
  notify: false,
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache',
  detectOpenHandles: true,
};