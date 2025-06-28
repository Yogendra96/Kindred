module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'e2e/reports',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'e2e/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
