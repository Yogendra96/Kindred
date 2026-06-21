module.exports = {
  dependencies: {
    ...(process.env.NO_FLIPPER ? { 'react-native-flipper': { platforms: { ios: null } } } : {}),
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    'react-native-vision-camera': {
      platforms: {
        android: null,
      },
    },
  },
  assets: ['./assets/fonts/', './assets/images/'],
};