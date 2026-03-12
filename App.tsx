import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store';
import { ToastProvider } from './src/contexts/ToastContext';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <NavigationContainer>
            <StatusBar barStyle='light-content' backgroundColor='#007AFF' />
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
