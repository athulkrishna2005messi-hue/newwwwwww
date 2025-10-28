import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  } else {
    app = getApp();
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (!getApps().length) {
    app = initializeApp();
  } else {
    app = getApp();
  }
}

export function getAdminFirestore() {
  if (!app) {
    throw new Error('Firebase admin is not configured. Please provide valid credentials.');
  }

  return getFirestore(app);
}

export function isAdminFirestoreAvailable() {
  return Boolean(app);
}
