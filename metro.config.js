import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';
import { getDefaultConfig, mergeConfig } from '@react-native/metro-config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Enhanced Metro configuration with performance optimizations
 * and debugging support for React Native 0.73+
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Enable source maps for better debugging
    enableBabelRCLookup: true,
    enableBabelRuntime: true,
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    // Enhanced module resolution
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
    },
    // Support for additional platforms
    platforms: ['ios', 'android', 'native', 'web'],
  },
  // Performance optimizations
  serializer: {
    // Optimize bundle size
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],
    // Enable tree shaking
    getPolyfills: () => [],
    // Custom module filter for better performance
    createModuleIdFactory: () => (path) => {
      // Use shorter module IDs in production
      if (process.env.NODE_ENV === 'production') {
        return path.replace(__dirname, '').replace(/\/node_modules\//, '/nm/');
      }
      return path;
    },
  },
  server: {
    port: 8081,
    // Enhanced development server configuration
    enhanceMiddleware: (middleware, server) => {
      // Add custom middleware for development
      return (req, res, next) => {
        // Enable CORS for development
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          middleware(req, res, next);
        }
      };
    },
  },
  // Watchman configuration for better file watching
  watchFolders: [
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'assets'),
  ],
  // Performance settings
  maxWorkers: Math.max(1, Math.floor(os.cpus().length * 0.75)),
  // Performance optimizations
  cacheStores: [
    {
      name: 'FileStore',
      options: {
        root: path.join(__dirname, '.metro-cache'),
      },
    },
  ],
  
  // Enhanced caching
  cacheVersion: '1.0',
  
  // Reset cache on startup in development
  resetCache: process.env.NODE_ENV === 'development',
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    resetCache: false,
    // Enable experimental features for development
    experimental: {
      basePath: '/',
    },
    // Enable source maps
    sourceMap: true,
    
    // Fast refresh
    transformer: {
      ...config.transformer,
      unstable_allowRequireContext: true,
      inlineRequires: false, // Disable for better debugging
    },
    
    // Enhanced development server
    server: {
      port: 8081,
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          // Add development-specific middleware
          res.setHeader('Access-Control-Allow-Origin', '*');
          return middleware(req, res, next);
        };
      },
    },
  }),
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    transformer: {
      ...defaultConfig.transformer,
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
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
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        output: {
          comments: false,
        },
      },
      inlineRequires: true, // Enable for better performance
    },
    
    // Production serializer optimizations
    serializer: {
      ...config.serializer,
      optimize: true,
      createModuleIdFactory: () => (path) => {
        // Create stable, short module IDs for production
        const hash = require('crypto').createHash('sha1');
        hash.update(path);
        return hash.digest('hex').substr(0, 6);
      },
    },
  }),
};

// Merge with default configuration
export default mergeConfig(defaultConfig, config);