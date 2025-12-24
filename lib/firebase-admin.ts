import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!getApps().length) {
    if (!projectId) {
        console.error("Firebase Admin Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing");
    }
    initializeApp({
        projectId: projectId,
    });
}

const adminApp = getApp();
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminDb, adminAuth, adminApp };
