const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration for React Native
 * Simplified version with proper asset handling
 */
const config = {
  transformer: {
    // CRITICAL: Asset registry path for React Navigation and other assets
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',

    // SVG support
    babelTransformerPath: require.resolve('react-native-svg-transformer'),

    // Enable inline requires for better performance
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },

  resolver: {
    // Configure asset extensions (exclude svg from default assets)
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),

    // Add svg to source extensions so it's handled by the transformer
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],

    // Path aliases for cleaner imports
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
      '@data': path.resolve(__dirname, 'src/data'),
    },
  },

  // Watch folders for faster reloads
  watchFolders: [
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'assets'),
  ],
};

module.exports = mergeConfig(defaultConfig, config);
