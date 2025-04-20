/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import NotificationService from './src/services/NotificationService';
import { RootState, store } from './src/store';

// Configure Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}

// Improve performance by ignoring specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time',
  'AsyncStorage has been extracted from react-native core',
]);

// Initialize Google Sign In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
});

const NavigationRoot: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        const hasPermission = await NotificationService.requestUserPermission();
        if (hasPermission) {
          const token = await NotificationService.getFCMToken();
          if (token) {
            await Promise.all([
              NotificationService.subscribeToTopic('carbon_tips'),
              NotificationService.subscribeToTopic('eco_updates'),
            ]);
          }
        }

        // Set up notification handlers
        await Promise.all([
          NotificationService.setupForegroundHandler(),
          NotificationService.setupBackgroundHandler(),
          NotificationService.onTokenRefresh(),
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // TODO: Implement proper error reporting here using Sentry or similar
      }
    };

    initializeApp();

    return () => {
      // Cleanup notification handlers
      NotificationService.cleanup();
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
