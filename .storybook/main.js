module.exports = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/screens/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-design-tokens',
    '@storybook/addon-react-native-web',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  features: {
    buildStoriesJson: true,
    storyStoreV7: true,
  },
  webpackFinal: async config => {
    // Handle React Native modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
      'react-native-svg': 'react-native-svg/lib/commonjs/ReactNativeSVG.web',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      '@react-native-async-storage/async-storage':
        '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.native',
    };

    // Handle file extensions
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
    ];

    // Handle React Native specific loaders
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: [
            'react-native-web/babel',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-runtime',
          ],
        },
      },
    });

    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            native: false,
          },
        },
      ],
    });

    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
        },
      },
    });

    // Handle image files
    config.module.rules.push({
      test: /\.(png|jpe?g|gif)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/',
        },
      },
    });

    return config;
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../assets'],
};
