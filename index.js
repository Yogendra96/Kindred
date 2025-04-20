/**
 * @format
 */
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { StrictMode } from 'react';
import App from './App';
import { name as appName } from './app.json';

// Enable native screens for better performance
enableScreens();

// Register the app with strict mode enabled
AppRegistry.registerComponent(appName, () => () => (
  <StrictMode>
    <App />
  </StrictMode>
));
