import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let firestore: Firestore | null = null;

const bootstrapFirestore = (): Firestore => {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      initializeApp({
        credential: applicationDefault()
      });
    }
  }

  return getFirestore();
};

export const resolveFirestore = (): Firestore => {
  if (!firestore) {
    firestore = bootstrapFirestore();
  }
  return firestore;
};
