import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Global settings
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        __DEV__: 'readonly',
        __TEST__: 'readonly',
        global: 'writable',
        ErrorUtils: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        performance: 'readonly',
        HermesInternal: 'readonly',
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        expect: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  
  // Plugin configurations
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin,
      'unused-imports': unusedImportsPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Core ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      
      // React rules
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // We use TypeScript
      'react/display-name': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-deprecated': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-spacing': ['error', 'never'],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'react/jsx-pascal-case': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      
      // React Native specific rules
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'warn',
      'react-native/sort-styles': 'error',
      
      // SonarJS rules for complexity and code smells
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/max-switch-cases': ['error', 10],
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      
      // Unicorn rules for modern practices
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-destructuring': 'error',
      'unicorn/error-message': 'error',
      'unicorn/filename-case': ['error', {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
      }],
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/no-new-array': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/throw-new-error': 'error',
      
      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  
  // File-specific overrides
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}', '**/tests/**/*'],
    rules: {
      // Relax some rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
    },
  },
  
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}'],
    rules: {
      // Relax rules for Storybook files
      'react-native/no-inline-styles': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  
  {
    files: ['**/*.config.{js,jsx,ts,tsx}', '**/scripts/**/*'],
    rules: {
      // Configuration and script files
      'no-console': 'off',
      'unicorn/prefer-module': 'off',
    },
  },
  
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // Remove project requirement for JS files
      },
    },
    rules: {
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '**/*.d.ts',
      'android/**',
      'ios/**',
      '.expo/**',
      '.maestro/**',
      'fastlane/**',
      'release-notes/**',
      'docs/**',
      'monitoring/**',
      '*.log',
      '.git/**',
      '.vscode/**',
      '.idea/**',
      'tmp/**',
      'temp/**',
      '__generated__/**',
      'vendor/**',
      '.bundle/**',
      'jest.setup.js',
      'global.d.ts',
      '.detoxrc.js',
      '.lintstagedrc.js',
      '.prettierrc.js',
      '.releaserc.js',
      '.storybook/**',
      '__mocks__/**',
      'babel.config.js',
      'commitlint.config.js',
      'metro.config.js',
      'metro.config.enhanced.js',
      'react-native.config.js',
      'eslint.config.js',
      'jest.config.js',
      'scripts/**/*.js',
      'scripts/**/*.ts',
      'e2e/**',
      'src/tests/testUtils.tsx',
    ],
  },
  
  // Prettier config (must be last)
  prettierConfig,
);