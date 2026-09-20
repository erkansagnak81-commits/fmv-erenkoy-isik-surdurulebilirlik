import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  getPersistentCacheIndexManager,
  enablePersistentCacheIndexAutoCreation,
  Firestore
} from 'firebase/firestore';

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

// Sınırsız IndexedDB Yerel Önbelleği (Multiple Tab Manager + Unlimited Cache Size)
// Çok sayıda öğretmen girişi ve çoklu sekme kullanımında Firebase Firestore okuma kotalarından maksimum tasarruf sağlar.
export const db: Firestore = (() => {
  try {
    const firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });

    // Otomatik yerel sorgu indekslemeyi etkinleştir (Önbellek sorgu hızlandırma)
    try {
      const indexManager = getPersistentCacheIndexManager(firestoreInstance);
      if (indexManager) {
        enablePersistentCacheIndexAutoCreation(indexManager);
      }
    } catch {
      // ignore
    }

    return firestoreInstance;
  } catch (err) {
    console.warn('Firestore persistent cache initialization fallback to default:', err);
    return getFirestore(app);
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
