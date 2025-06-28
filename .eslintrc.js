module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    'react',
    'react-hooks',
    'react-native',
    '@typescript-eslint',
    'prettier',
  ],
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React Rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-key': 'error',

    // React Hooks Rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Native Rules
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-raw-text': 'off',

    // TypeScript Rules
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
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      },
    ],

    // General Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off',
    'prefer-const': 'error',

    // Prettier
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        semi: true,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'avoid',
        endOfLine: 'lf',
      },
    ],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      extends: ['plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react-native/no-inline-styles': 'off',
      },
    },
    {
      files: ['*.stories.ts', '*.stories.tsx'],
      rules: {
        'react-native/no-inline-styles': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    '.metro-cache/',
    'coverage/',
    'dist/',
    'build/',
    'babel.config.js',
    'metro.config.js',
    'eslint.config.js',
  ],
};
