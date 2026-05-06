import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Replace these placeholder values with your Firebase project credentials
// from https://console.firebase.google.com → Project Settings → Your Apps

// Read from env when available, fall back to checked-in defaults so the app
// keeps working without a .env file on first clone.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyAeUzh3ka3Ku0EXU7T0oXNM1_xTqwjijoI",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "facturation-ae9d3.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "https://facturation-ae9d3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "facturation-ae9d3",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "facturation-ae9d3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "993244484435",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:993244484435:web:fc4da3e504c0bb762887a6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
