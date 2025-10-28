declare module 'firebase-admin/firestore' {
  type FirestoreSnapshot = {
    exists: boolean;
    data: () => unknown;
  };

  type FirestoreDocumentReference = {
    get: () => Promise<FirestoreSnapshot | { exists: boolean; data?: unknown }>;
    set: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
    update?: (data: Record<string, unknown>) => Promise<void>;
  };

  type FirestoreCollectionReference = {
    doc: (id: string) => FirestoreDocumentReference;
  };

  export function getFirestore(): {
    collection: (path: string) => FirestoreCollectionReference;
  };
}
