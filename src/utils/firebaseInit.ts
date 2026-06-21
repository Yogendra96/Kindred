import { firebase } from '@react-native-firebase/app';

try {
  console.log(
    'firebaseInit: firebase exists?',
    !!firebase,
    'apps exists?',
    !!firebase?.apps,
    'apps length:',
    firebase?.apps?.length,
  );
  // Initialize Firebase with dummy config if missing native config
  if (firebase && firebase.apps && !firebase.apps.length) {
    console.log(
      'firebaseInit: Attempting to initialize default app from JS...',
    );
    firebase.initializeApp({
      apiKey: 'dummy-api-key-for-local-dev',
      appId: '1:1234567890:ios:abcdef',
      projectId: 'kindred-dummy-project',
      messagingSenderId: '1234567890',
    });
    console.log('Firebase initialized with dummy config');
  }
} catch (e) {
  console.error('Firebase init module evaluation error:', e);
}

export default firebase;
