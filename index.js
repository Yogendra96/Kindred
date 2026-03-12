/**
 * @format
 */
import 'react-native-gesture-handler';
import App from './App';
import { name as appName } from './app.json';
import React, { StrictMode } from 'react';
import 'reflect-metadata';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import ErrorHandler from './src/utils/errorHandler';

// Install global error handlers for uncaught exceptions & promise rejections
ErrorHandler.installGlobalHandlers();

// Enable native screens for better performance
enableScreens();

// Register the app with strict mode enabled
const AppWithStrictMode = () => (
  <StrictMode>
    <App />
  </StrictMode>
);

AppRegistry.registerComponent(appName, () => AppWithStrictMode);
