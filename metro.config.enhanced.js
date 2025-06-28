const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Enhanced Metro configuration for Kindred React Native app
 * Includes optimizations for performance, caching, and development experience
 */
const config = {
  // Transformer configuration
  transformer: {
    // Enable Babel transformer
    babelTransformerPath: require.resolve(
      'metro-react-native-babel-transformer',
    ),

    // SVG transformer
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',

    // Enable inline requires for better performance
    inlineRequires: true,

    // Enable experimental import support
    experimentalImportSupport: true,

    // Platform-specific extensions
    platforms: ['ios', 'android', 'native', 'web'],

    // Asset plugins
    assetPlugins: ['react-native-svg-transformer'],

    // Transform options
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },

    // Worker count for parallel processing
    workerCount: Math.max(1, Math.floor(require('os').cpus().length / 2)),
  },

  // Resolver configuration
  resolver: {
    // Asset extensions
    assetExts: [
      'bmp',
      'gif',
      'jpg',
      'jpeg',
      'png',
      'psd',
      'svg',
      'webp',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'eot',
      'mp3',
      'mp4',
      'wav',
      'mov',
      'avi',
      'webm',
      'pdf',
      'zip',
      'json',
    ],

    // Source extensions
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'],

    // Platform-specific extensions
    platforms: ['ios', 'android', 'native', 'web'],

    // Module aliases
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@tests': path.resolve(__dirname, 'src/tests'),
      '@mocks': path.resolve(__dirname, 'src/__mocks__'),
    },

    // Node modules to resolve
    resolverMainFields: ['react-native', 'browser', 'main'],

    // Blacklist patterns
    blockList: [
      /node_modules\/.*\/node_modules\/react-native\/.*/,
      /.*\/__tests__\/.*/,
      /.*\/\.(git|svn|hg)\/.*/,
      /.*\/node_modules\/.*\/test\/.*/,
    ],

    // Enable symlinks
    unstable_enableSymlinks: true,

    // Dependency extraction
    dependencyExtractor: require('@react-native/metro-config/src/defaults/dependencyExtractor'),
  },

  // Serializer configuration
  serializer: {
    // Create multiple bundles
    createModuleIdFactory: () => path => {
      // Create stable module IDs for better caching
      const hash = require('crypto').createHash('sha1');
      hash.update(path);
      return hash.digest('hex').substr(0, 8);
    },

    // Custom serializer for optimization
    customSerializer: require('@react-native/metro-config/src/defaults/serializer'),

    // Output options
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],

    // Polyfills
    getPolyfills: require('@react-native/metro-config/src/defaults/polyfills'),
  },

  // Server configuration
  server: {
    // Port configuration
    port: 8081,

    // Enable HTTPS
    https: false,

    // Enhance logging
    enhanceMiddleware: (middleware, _server) => {
      return (req, res, next) => {
        // Add custom middleware here
        return middleware(req, res, next);
      };
    },
  },

  // Watcher configuration
  watchman: {
    // Defer initial scan for faster startup
    deferInitialScan: true,

    // Additional watch folders
    additionalWatchFolders: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'assets'),
    ],
  },

  // Performance optimizations
  cacheStores: [
    {
      name: 'FileStore',
      options: {
        root: path.join(__dirname, '.metro-cache'),
      },
    },
  ],

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Fast refresh
    transformer: {
      ...config.transformer,
      unstable_allowRequireContext: true,
    },

    // Source maps
    symbolicator: {
      customizeFrame: frame => {
        const collapse = Boolean(
          frame.file &&
            (frame.file.includes('node_modules') ||
              frame.file.includes('(native)')),
        );
        return { collapse };
      },
    },
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    transformer: {
      ...config.transformer,
      minifierPath: 'metro-minify-terser',
      minifierConfig: {
        ecma: 8,
        keep_fnames: true,
        mangle: {
          keep_fnames: true,
        },
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  }),
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
