import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()
};

// Initialize Firebase (singleton pattern)
// On server-side SSR, we check if projectId exists before initializing to avoid "app does not exist" errors
const app = (getApps().length > 0)
    ? getApp()
    : (firebaseConfig.projectId ? initializeApp(firebaseConfig) : null);

const auth = app ? getAuth(app) : null as any;
const db = app ? getFirestore(app) : null as any;
const storage = app ? getStorage(app) : null as any;

export { app, auth, db, storage };
