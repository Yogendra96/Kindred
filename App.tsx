import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, LogBox, View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ErrorHandler } from './src/utils/errorHandler';
import { NotificationService } from './src/services/NotificationService';
import { backgroundSyncService } from './src/services/BackgroundSyncService';
import { OfflineBanner } from './src/components/OfflineBanner';

// Disable Metro yellow boxes
LogBox.ignoreAllLogs();

const App = () => {
  useEffect(() => {
    // Install global JS error handlers
    ErrorHandler.installGlobalHandlers();

    // Initialize services
    NotificationService.init();

    // Initialize offline sync — loads persisted queue and registers drain handlers
    backgroundSyncService.initialize();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <ThemeProvider>
            <NavigationContainer>
              <View style={styles.root}>
                <StatusBar barStyle='light-content' backgroundColor='#007AFF' />
                <AppNavigator />
                {/* Offline banner sits on top of everything — only visible when offline/syncing */}
                <OfflineBanner />
              </View>
            </NavigationContainer>
          </ThemeProvider>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
