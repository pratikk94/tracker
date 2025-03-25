import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCYOWduA5ub83YEDSV36jAY0IJVFKKAMLo",
  authDomain: "tracker-f8852.firebaseapp.com",
  projectId: "tracker-f8852",
  storageBucket: "tracker-f8852.firebasestorage.app",
  messagingSenderId: "51766960434",
  appId: "1:51766960434:web:3cd16422839cadfba5772b",
  measurementId: "G-E8T2TRK6BN"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 