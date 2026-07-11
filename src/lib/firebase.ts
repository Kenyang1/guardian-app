import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error - exported by the react-native build firebase actually ships
// to Metro, but missing from the main entry's type declarations (known issue).
// On web this import is undefined, which is fine: we only call it on native.
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase client setup. This config is NOT secret - it identifies the
 * project, it doesn't grant access. What protects user data is (1) Firebase
 * Auth checking passwords and (2) our API verifying every request's ID token
 * server-side. Contrast: ANTHROPIC_API_KEY *spends money* and lives only in
 * the server's environment, never in an app that ships to phones.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// React Native has no browser storage - tell Firebase to persist sessions in
// AsyncStorage, or every app restart would sign the user out. On web,
// getAuth() uses the browser's own storage (and getReactNativePersistence
// doesn't exist there at all).
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
