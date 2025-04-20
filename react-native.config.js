module.exports = {
  dependencies: {
    ...(process.env.NO_FLIPPER ? { 'react-native-flipper': { platforms: { ios: null } } } : {}),
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
  assets: ['./assets/fonts/', './assets/images/'],
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
    android: {
      enableHermes: true,
      unstable_reactLegacyComponentNames: [],
    },
  },
  platforms: {
    ios: {
      sourceDir: './ios',
      automaticPodsInstallation: true,
    },
    android: {
      sourceDir: './android',
      unstable_reactLegacyComponentNames: [],
    },
  },
  commands: [
    {
      name: 'clean',
      description: 'Clean project and reinstall dependencies',
      options: [],
    },
  ],
};
