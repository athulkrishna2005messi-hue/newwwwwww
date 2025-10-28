'use client';

import { initializeApp, type FirebaseApp, type FirebaseOptions, getApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firebaseConfig: FirebaseOptions | null = null;

const REQUIRED_ENV_VARS: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const ENV_VAR_LOOKUP: Record<keyof FirebaseOptions, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
};

const resolveFirebaseConfig = (): FirebaseOptions => {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  const config: FirebaseOptions = {};

  REQUIRED_ENV_VARS.forEach((key) => {
    const envKey = ENV_VAR_LOOKUP[key];
    const value = process.env[envKey];
    if (!value) {
      throw new Error(
        `Missing Firebase client environment variable: ${envKey}. Please define it in your environment.`
      );
    }

    (config as Record<string, string>)[key] = value;
  });

  const measurementKey = ENV_VAR_LOOKUP.measurementId;
  const measurementId = process.env[measurementKey];
  if (measurementId) {
    config.measurementId = measurementId;
  }

  firebaseConfig = config;
  return firebaseConfig;
};

export const getFirebaseApp = (): FirebaseApp => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length) {
    firebaseApp = getApp();
    return firebaseApp;
  }

  firebaseApp = initializeApp(resolveFirebaseConfig());
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());

export const getFirebaseFirestore = (): Firestore => getFirestore(getFirebaseApp());

export const getFirebaseClientConfig = (): FirebaseOptions => resolveFirebaseConfig();
