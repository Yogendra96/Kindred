import { firebase } from '@react-native-firebase/app';
import appCheck from '@react-native-firebase/app-check';

try {
  if (firebase && firebase.apps && !firebase.apps.length) {
    firebase.initializeApp({
      apiKey: 'dummy-api-key-for-local-dev',
      appId: '1:1234567890:ios:abcdef',
      projectId: 'kindred-dummy-project',
      messagingSenderId: '1234567890',
    });
  }
} catch (e) {
  console.error('Firebase init error:', e);
}

// Initialize AppCheck for fraud prevention
// Uses DeviceCheck (iOS) / Play Integrity (Android) in production
// Falls back to Debug provider in dev mode
try {
  const rnfbAppCheck = appCheck();
  if (__DEV__) {
    rnfbAppCheck.activate('DEBUG');
  } else {
    rnfbAppCheck.activate('DEFAULT');
  }
} catch (e) {
  console.error('AppCheck init error:', e);
}

export default firebase;
