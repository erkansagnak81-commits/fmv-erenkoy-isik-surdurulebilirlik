import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA-lLkgK4kGJs7Hr-6dSHT6vQ_xKVI43cY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sdg-erenkoy.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sdg-erenkoy',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sdg-erenkoy.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '99058794014',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:99058794014:web:9af4d9770e5a6f38c6780f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-09K8WCZJY0',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: 'fmvisik.k12.tr',
  prompt: 'select_account',
});
