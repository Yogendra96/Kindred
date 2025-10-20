module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'auto',
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
    '@babel/preset-typescript',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        development: process.env.NODE_ENV === 'development',
      },
    ],
  ],
  plugins: [
    // Environment variables
    [
      'react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],

    // Module resolution
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.native.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.native.tsx',
          '.tsx',
          '.ios.js',
          '.android.js',
          '.native.js',
          '.js',
          '.ios.jsx',
          '.android.jsx',
          '.native.jsx',
          '.jsx',
          '.json',
        ],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@hooks': './src/hooks',
          '@assets': './assets',
          '@types': './src/types',
          '@config': './src/config',
          '@tests': './src/tests',
          '@mocks': './src/__mocks__',
          '@theme': './src/theme',
        },
      },
    ],

    // General plugins
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    '@babel/plugin-transform-async-to-generator',

    // Development plugins
  ]
    .concat(
      process.env.NODE_ENV === 'development' ? ['react-refresh/babel'] : [],
    )
    .concat([
      // React Native specific (must be last)
      'react-native-reanimated/plugin',
    ]),

  env: {
    development: {
      plugins: ['react-refresh/babel'],
    },
    production: {
      plugins: [
        'transform-remove-console',
        'transform-remove-debugger',
        [
          'transform-react-remove-prop-types',
          {
            removeImport: true,
            additionalLibraries: ['react-immutable-proptypes'],
          },
        ],
      ],
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
        '@babel/preset-typescript',
        '@babel/preset-react',
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        'dynamic-import-node',
      ],
    },
  },

  // Source maps and optimization
  sourceMaps: process.env.NODE_ENV === 'development',
  compact: process.env.NODE_ENV === 'production',
  comments: process.env.NODE_ENV === 'development',
  minified: process.env.NODE_ENV === 'production',

  // Assumptions for better optimization
  assumptions: {
    constantReexports: true,
    noDocumentAll: true,
    noNewArrows: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    setPublicClassFields: true,
    skipForOfIteratorClosing: true,
  },
};
