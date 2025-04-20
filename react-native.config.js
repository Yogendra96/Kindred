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
      unstable_useFrameworks: true, // Add this for better Swift support
    },
    android: {
      enableHermes: true,
      unstable_reactLegacyComponentNames: [],
      enableProguardInReleaseBuilds: true, // Add this for better release builds
      enableSeparateBuildPerCPUArchitecture: true, // Add this for better APK size
    },
  },
  platforms: {
    ios: {
      sourceDir: './ios',
      automaticPodsInstallation: true,
      unstable_useFrameworks: true,
    },
    android: {
      sourceDir: './android',
      unstable_reactLegacyComponentNames: [],
      enableProguardInReleaseBuilds: true,
      enableSeparateBuildPerCPUArchitecture: true,
    },
  },
  commands: [
    {
      name: 'clean',
      description: 'Clean project and reinstall dependencies',
      options: [],
    },
    {
      name: 'typecheck',
      description: 'Run TypeScript type checking',
      options: [],
    },
  ],
};