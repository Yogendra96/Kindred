export default {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    '@babel/plugin-transform-async-generator-functions',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-numeric-separator',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-optional-catch-binding',
    '@babel/plugin-transform-optional-chaining',
  ],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
