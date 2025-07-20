// @ts-check
import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import globals from 'globals';

// Import all the advanced linting plugins
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import node from 'eslint-plugin-node';
import jest from 'eslint-plugin-jest';
import stylistic from '@stylistic/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import testingLibrary from 'eslint-plugin-testing-library';
import prettierConfig from 'eslint-config-prettier';

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
      'metro.config.enhanced.js',
      'jest.setup.js',
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
      'scripts/**',
      'src/tests/testUtils.tsx',
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // TypeScript config
  ...typescriptEslint.configs.recommended,

  // Enhanced configuration with all plugins
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      prettier,
      security,
      sonarjs,
      unicorn,
      promise,
      node,
      '@stylistic': stylistic,
      perfectionist,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
        __DEV__: 'readonly',
        JSX: 'readonly',
        React: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
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
    settings: {
      react: {
        version: 'detect',
      },
      'react-native/style-sheet-object-names': ['EStyleSheet', 'OtherStyleSheet', 'PStyleSheet'],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Core ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

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
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // React rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger': 'warn',
      'react/self-closing-comp': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native rules
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',

      // Import rules
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'pathGroups': [
          { 'pattern': 'react', 'group': 'external', 'position': 'before' },
          { 'pattern': 'react-native', 'group': 'external', 'position': 'before' },
          { 'pattern': '@/**', 'group': 'internal' }
        ],
        'pathGroupsExcludedImportTypes': ['react', 'react-native'],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
      }],
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // Accessibility rules
      'jsx-a11y/accessible-emoji': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/no-access-key': 'error',

      // Security rules
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-object-injection': 'warn',

      // SonarJS rules - Code Quality
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/prefer-immediate-return': 'error',

      // Unicorn rules - Modern JavaScript (conservative set)
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/error-message': 'error',
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prevent-abbreviations': 'off', // Too restrictive for React Native

      // Promise rules
      'promise/always-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',

      // Stylistic rules (minimal set - Prettier handles most formatting)
      '@stylistic/semi': ['error', 'always'],

      // Perfectionist rules - Sorting (disabled to avoid conflicts with import/order)
      // 'perfectionist/sort-imports': ['error', {
      //   'type': 'natural',
      //   'order': 'asc',
      //   'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
      // }],
      'perfectionist/sort-named-imports': ['error', { 'type': 'natural', 'order': 'asc' }],

      // Prettier integration
      'prettier/prettier': ['error', {
        singleQuote: true,
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
        printWidth: 100,
        bracketSpacing: true,
        arrowParens: 'avoid',
        endOfLine: 'lf',
      }],
    },
  },

  // Test files with Jest and Testing Library
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**'],
    plugins: {
      jest,
      'testing-library': testingLibrary,
    },
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
      // Disable strict rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'no-console': 'off',
      
      // Jest rules
      'jest/consistent-test-it': ['error', { fn: 'it' }],
      'jest/expect-expect': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'jest/prefer-strict-equal': 'error',
      'jest/no-test-prefixes': 'error',
      'jest/require-top-level-describe': 'error',
      
      // Testing Library rules (React Native compatible)
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/prefer-screen-queries': 'error',
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
  },

  // Apply Prettier config last to disable conflicting rules
  prettierConfig,
);