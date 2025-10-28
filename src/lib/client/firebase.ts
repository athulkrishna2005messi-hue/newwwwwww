'use client';

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function ensureClientConfig() {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId);
}

export function isFirebaseClientAvailable() {
  return ensureClientConfig();
}

export function getFirebaseClientApp() {
  if (!ensureClientConfig()) {
    throw new Error('Firebase client is not configured. Provide NEXT_PUBLIC_FIREBASE_* values.');
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

export function getClientFirestore() {
  if (!firestore) {
    firestore = getFirestore(getFirebaseClientApp());
  }

  return firestore;
}
