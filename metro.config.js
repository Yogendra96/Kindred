import { getDefaultConfig, mergeConfig } from '@react-native/metro-config';
import path from 'path';

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
        unstable_disableES6Transforms: true,
      },
    }),
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
    extraNodeModules: {
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
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('@/')) {
        return {
          filePath: path.resolve(__dirname, 'src', moduleName.substring(2)),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  watchFolders: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'assets')],
  maxWorkers: Math.max(2, Math.floor(require('os').cpus().length / 2)),
  cacheVersion: '1.0',
  resetCache: false,
  // Add new options
  server: {
    port: 8081,
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        if (req.url.startsWith('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        return middleware(req, res, next);
      };
    },
  },
};

export default mergeConfig(defaultConfig, config);