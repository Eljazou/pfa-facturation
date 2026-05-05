import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Replace these placeholder values with your Firebase project credentials
// from https://console.firebase.google.com → Project Settings → Your Apps

const firebaseConfig = {
  apiKey: "AIzaSyAeUzh3ka3Ku0EXU7T0oXNM1_xTqwjijoI",
  authDomain: "facturation-ae9d3.firebaseapp.com",
  databaseURL: "https://facturation-ae9d3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "facturation-ae9d3",
  storageBucket: "facturation-ae9d3.firebasestorage.app",
  messagingSenderId: "993244484435",
  appId: "1:993244484435:web:fc4da3e504c0bb762887a6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
