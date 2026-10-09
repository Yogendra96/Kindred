import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, LogBox, View, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ErrorHandler } from './src/utils/errorHandler';
import { NotificationService } from './src/services/NotificationService';
import { backgroundSyncService } from './src/services/BackgroundSyncService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { PrivacyConsentModal } from './src/components/ui/PrivacyConsentModal';

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
    <ToastProvider>
      <ThemeProvider>
        <NavigationContainer>
          <View style={styles.root}>
            <StatusBar barStyle='light-content' backgroundColor='#007AFF' />
            <AppNavigator />
            {/* Offline banner sits on top of everything — only visible when offline/syncing */}
            <OfflineBanner />
            <PrivacyConsentModal />
          </View>
        </NavigationContainer>
      </ThemeProvider>
    </ToastProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
