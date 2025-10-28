import type { FirebaseOptions } from 'firebase/app';

let firebaseServerConfig: FirebaseOptions | null = null;

const REQUIRED_SERVER_KEYS: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const SERVER_ENV_LOOKUP: Record<keyof FirebaseOptions, string> = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID',
  measurementId: 'FIREBASE_MEASUREMENT_ID',
};

const FALLBACK_PUBLIC_LOOKUP: Record<keyof FirebaseOptions, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
};

const readEnv = (primaryKey: string, fallbackKey: string): string | undefined => {
  return process.env[primaryKey] ?? process.env[fallbackKey];
};

const ensureServerConfig = (): FirebaseOptions => {
  if (firebaseServerConfig) {
    return firebaseServerConfig;
  }

  const config: FirebaseOptions = {};

  REQUIRED_SERVER_KEYS.forEach((key) => {
    const value = readEnv(SERVER_ENV_LOOKUP[key], FALLBACK_PUBLIC_LOOKUP[key]);
    if (!value) {
      throw new Error(
        `Missing Firebase server environment variable: ${SERVER_ENV_LOOKUP[key]} (or ${FALLBACK_PUBLIC_LOOKUP[key]} as fallback).`
      );
    }

    (config as Record<string, string>)[key] = value;
  });

  const measurementId = readEnv(
    SERVER_ENV_LOOKUP.measurementId,
    FALLBACK_PUBLIC_LOOKUP.measurementId
  );

  if (measurementId) {
    config.measurementId = measurementId;
  }

  firebaseServerConfig = config;
  return firebaseServerConfig;
};

export const getFirebaseServerConfig = (): FirebaseOptions => ensureServerConfig();

export const hasFirebaseServerConfig = (): boolean => {
  try {
    return Boolean(ensureServerConfig());
  } catch (error) {
    return false;
  }
};
