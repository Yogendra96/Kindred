import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar, LogBox, View, StyleSheet } from 'react-native';
import { PostHogProvider } from 'posthog-react-native';
import * as Sentry from '@sentry/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { ErrorHandler } from './src/utils/errorHandler';
import { NotificationService } from './src/services/NotificationService';
import { backgroundSyncService } from './src/services/BackgroundSyncService';
import { telemetryService } from './src/services/TelemetryService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { PrivacyConsentModal } from './src/components/ui/PrivacyConsentModal';

// Disable Metro yellow boxes
LogBox.ignoreAllLogs();

const App = () => {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Install global JS error handlers
    ErrorHandler.installGlobalHandlers();

    // Initialize telemetry (PostHog + Sentry cross-linking)
    telemetryService.init();

    // Initialize services
    NotificationService.init();

    // Initialize offline sync — loads persisted queue and registers drain handlers
    backgroundSyncService.initialize();
  }, []);

  const handleNavigationReady = () => {
    routeNameRef.current = navigationRef.getCurrentRoute()?.name;
    if (routeNameRef.current) {
      telemetryService.screen(routeNameRef.current);
    }
  };

  const handleNavigationStateChange = () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.getCurrentRoute()?.name;

    if (previousRouteName !== currentRouteName && currentRouteName) {
      telemetryService.screen(currentRouteName);
    }
    routeNameRef.current = currentRouteName;
  };

  return (
    <PostHogProvider
      client={telemetryService.getPostHogClient()}
      autocapture={{
        captureTouches: true,
        captureScreens: false,
      }}
    >
      <ToastProvider>
        <ThemeProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={handleNavigationReady}
            onStateChange={handleNavigationStateChange}
          >
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
    </PostHogProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default Sentry.wrap(App);
