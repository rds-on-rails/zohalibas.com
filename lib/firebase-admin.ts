import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        // In local dev, Admin SDK can work without a service account key 
        // if FIREBASE_AUTH_EMULATOR_HOST or other emulator envs are set,
        // or if it's running in a Google environment.
        // For production/local-to-cloud, you typically need a service account key.
        // However, for project identification, projectId is enough to start.
    });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
