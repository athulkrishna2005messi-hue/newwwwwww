import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore as getClientFirestore } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.FIREBASE_APP_ID,
};

const ENV_VAR_MAPPING: Record<keyof FirebaseConfig, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY / FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN / FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID / FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET / FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID / FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID / FIREBASE_APP_ID',
};

let firebaseApp: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

function assertFirebaseConfig(config: FirebaseConfig) {
  const requiredKeys: Array<keyof FirebaseConfig> = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter((key) => !config[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase configuration is incomplete. Missing environment variables: ${missingKeys
        .map((key) => ENV_VAR_MAPPING[key])
        .join(', ')}`
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!getApps().length) {
    assertFirebaseConfig(firebaseConfig);
    firebaseApp = initializeApp(firebaseConfig as Required<FirebaseConfig>);
  } else {
    firebaseApp = getApp();
  }

  return firebaseApp;
}

export function getFirebaseFirestore(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  firestoreInstance = getClientFirestore(getFirebaseApp());
  return firestoreInstance;
}

export function isFirebaseConfigured(): boolean {
  try {
    assertFirebaseConfig(firebaseConfig);
    return true;
  } catch (error) {
    return false;
  }
}
