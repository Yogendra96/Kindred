// @ts-check
import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import globals from 'globals';

export default typescriptEslint.config(
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'vendor/**',
      'dist/**',
      '.git/**',
      '.metro-cache/**',
      'build/**',
      '*.config.js',
      'babel.config.js',
      'metro.config.js',
      '.detoxrc.js',
      'jest.config.js',
      'commitlint.config.js',
      'react-native.config.js',
      '.eslintrc.js.backup',
      '.storybook/**',
      'storybook-static/**',
      '.lintstagedrc.js',
      '.prettierrc.js',
      '.releaserc.js',
      '__mocks__/**',
      'e2e/**',
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // TypeScript config
  ...typescriptEslint.configs.recommended,

  // Custom rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
        __DEV__: 'readonly',
        JSX: 'readonly',
        React: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    rules: {
      // Core ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'prefer-const': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Story files
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // JavaScript files (no TypeScript rules)
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  }
);