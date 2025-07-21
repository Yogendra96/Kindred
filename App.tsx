/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { useEffect } from 'react';

import { Alert, LogBox } from 'react-native';

import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import Config from 'react-native-config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';

import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { Logger } from './src/services/AdvancedLoggingService';
import { loggingService } from './src/services/LoggingService';
import notificationService from './src/services/NotificationService';
import { type RootState, store } from './src/store';

// Configure Firebase if not already initialized
if (!firebase.apps.length) {
  try {
    const firebaseConfig = {
      apiKey: Config['FIREBASE_API_KEY'] ?? '',
      authDomain: Config['FIREBASE_AUTH_DOMAIN'] ?? '',
      projectId: Config['FIREBASE_PROJECT_ID'] ?? '',
      storageBucket: Config['FIREBASE_STORAGE_BUCKET'] ?? '',
      messagingSenderId: Config['FIREBASE_MESSAGING_SENDER_ID'] ?? '',
      appId: Config['FIREBASE_APP_ID'] ?? '',
      measurementId: Config['FIREBASE_MEASUREMENT_ID'] ?? '',
    };

    // Validate Firebase configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is incomplete. Please check your .env file.');
    }

    void firebase.initializeApp(firebaseConfig);
  } catch (error) {
    loggingService.error('Firebase initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    Alert.alert(
      'Configuration Error',
      'Failed to initialize Firebase. Please check your configuration.',
    );
  }
}

// Improve performance by ignoring specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time',
  'AsyncStorage has been extracted from react-native core',
]);

// Initialize Google Sign In
try {
  const googleSignInConfig = {
    webClientId: Config['GOOGLE_WEB_CLIENT_ID'] ?? '',
    iosClientId: Config['GOOGLE_IOS_CLIENT_ID'] ?? '',
  };

  if (!googleSignInConfig.webClientId) {
    throw new Error('Google Sign-In configuration is incomplete. Please check your .env file.');
  }

  GoogleSignin.configure(googleSignInConfig);
} catch (error) {
  loggingService.error('Google Sign-In configuration failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  Alert.alert(
    'Configuration Error',
    'Failed to configure Google Sign-In. Please check your configuration.',
  );
}

const NavigationRoot: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    Logger.info('Kindred app starting initialization', {
      category: 'system',
      component: 'App',
      action: 'app_init',
      isAuthenticated,
      platform: Platform.OS,
      appVersion: '1.0.0',
    });

    const initializeApp = async () => {
      Logger.startTimer('app_initialization');

      try {
        Logger.info('Starting notification service initialization', {
          category: 'system',
          component: 'App',
          action: 'notification_init',
        });

        // Initialize notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission) {
          const token = await notificationService.getFCMToken();
          if (token) {
            Logger.info('FCM token received, subscribing to topics', {
              category: 'system',
              component: 'App',
              action: 'fcm_subscription',
              hasToken: true,
            });

            await Promise.all([
              notificationService.subscribe('carbon_tips'),
              notificationService.subscribe('eco_updates'),
            ]);
          }
        }

        // Set up notification handlers
        await notificationService.setupMessageHandlers();

        Logger.endTimer('app_initialization', {
          category: 'system',
          component: 'App',
          action: 'app_init_success',
        });

        Logger.info('Kindred app initialization completed successfully', {
          category: 'system',
          component: 'App',
          action: 'app_init_complete',
          hasNotificationPermission: hasPermission,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        Logger.error('App initialization failed', {
          category: 'system',
          component: 'App',
          action: 'app_init_error',
          errorMessage,
        }, error as Error);

        loggingService.error('App initialization failed', {
          error: errorMessage,
        });

        Logger.endTimer('app_initialization', {
          category: 'system',
          component: 'App',
          action: 'app_init_failed',
        });

        Alert.alert(
          'Initialization Error',
          'Failed to initialize app features. Some functionality may be limited.',
        );
      }
    };

    void initializeApp();

    return () => {
      Logger.info('App cleanup initiated', {
        category: 'system',
        component: 'App',
        action: 'app_cleanup',
      });

      // Cleanup notification handlers
      notificationService.cleanup();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        store.dispatch({
          type: 'auth/loginSuccess',
          payload: {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
          },
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationRoot />
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
