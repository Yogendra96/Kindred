import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider } from './src/theme/ThemeProvider';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <ThemeProvider>
            <NavigationContainer>
              <StatusBar barStyle='light-content' backgroundColor='#007AFF' />
              <AppNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
