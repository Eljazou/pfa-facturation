import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const required = (key) => {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing env var: ${key}. Copy .env.example to .env and fill in your Firebase credentials.`);
  return val;
};

const firebaseConfig = {
  apiKey:            required('VITE_FIREBASE_API_KEY'),
  authDomain:        required('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL:       required('VITE_FIREBASE_DATABASE_URL'),
  projectId:         required('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             required('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
