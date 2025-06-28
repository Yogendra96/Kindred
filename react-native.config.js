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
};