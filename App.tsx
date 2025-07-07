/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import notificationService from './src/services/NotificationService';
import { loggingService } from './src/services/LoggingService';
import type { RootState } from './src/store';
import { store } from './src/store';
import Config from 'react-native-config';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { LogBox, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';

// Configure Firebase if not already initialized
if (!firebase.apps.length) {
  try {
    const firebaseConfig = {
      apiKey: Config.FIREBASE_API_KEY || '',
      authDomain: Config.FIREBASE_AUTH_DOMAIN || '',
      projectId: Config.FIREBASE_PROJECT_ID || '',
      storageBucket: Config.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: Config.FIREBASE_APP_ID || '',
      measurementId: Config.FIREBASE_MEASUREMENT_ID || '',
    };

    // Validate Firebase configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error(
        'Firebase configuration is incomplete. Please check your .env file.',
      );
    }

    firebase.initializeApp(firebaseConfig);
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
    webClientId: Config.GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: Config.GOOGLE_IOS_CLIENT_ID || '',
  };

  if (!googleSignInConfig.webClientId) {
    throw new Error(
      'Google Sign-In configuration is incomplete. Please check your .env file.',
    );
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
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission) {
          const token = await notificationService.getFCMToken();
          if (token) {
            await Promise.all([
              notificationService.subscribe('carbon_tips'),
              notificationService.subscribe('eco_updates'),
            ]);
          }
        }

        // Set up notification handlers
        await notificationService.setupMessageHandlers();
      } catch (error) {
        loggingService.error('App initialization failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        Alert.alert(
          'Initialization Error',
          'Failed to initialize app features. Some functionality may be limited.',
        );
      }
    };

    initializeApp();

    return () => {
      // Cleanup notification handlers
      notificationService.cleanup();
    };
  }, []);

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
