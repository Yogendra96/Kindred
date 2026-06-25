import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ErrorHandler } from './src/utils/errorHandler';
import { NotificationService } from './src/services/NotificationService';

// Disable Metro yellow boxes
LogBox.ignoreAllLogs();

const App = () => {
  useEffect(() => {
    // Install global JS error handlers
    ErrorHandler.installGlobalHandlers();

    // Initialize services
    NotificationService.init();
  }, []);

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
