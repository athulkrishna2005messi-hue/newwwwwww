type FirestoreDocumentReference = {
  get: () => Promise<{ exists: boolean; data: () => unknown } | { exists: boolean; data?: unknown }>;
  set?: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
  update?: (data: Record<string, unknown>) => Promise<void>;
};

type FirestoreModule = {
  getFirestore: () => {
    collection: (path: string) => {
      doc: (id: string) => FirestoreDocumentReference;
    };
  };
};

export const FEATURE_FLAG_DEFINITIONS = {
  notionImport: {
    label: 'Notion import',
    description: 'Enables importing data from Notion databases.',
  },
  googleFormsImport: {
    label: 'Google Forms import',
    description: 'Enables ingesting Google Forms CSV exports.',
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFINITIONS;

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

type FeatureFlagRecord = Partial<Record<FeatureFlagKey, boolean>>;

type FeatureFlagDocument = {
  featureFlags: FeatureFlagRecord;
  requestedIntegrations: FeatureFlagKey[];
};

export type FeatureFlagState = {
  flags: FeatureFlags;
  requested: FeatureFlagKey[];
};

const DEFAULT_FLAGS: FeatureFlags = {
  notionImport: false,
  googleFormsImport: false,
};

const inMemoryStore = new Map<string, FeatureFlagDocument>();

let firestoreModule: FirestoreModule | null | undefined;

function createEmptyDocument(): FeatureFlagDocument {
  return {
    featureFlags: {},
    requestedIntegrations: [],
  };
}

function cloneDocument(doc: FeatureFlagDocument): FeatureFlagDocument {
  return {
    featureFlags: { ...doc.featureFlags },
    requestedIntegrations: [...doc.requestedIntegrations],
  };
}

function toState(doc: FeatureFlagDocument): FeatureFlagState {
  const flags: FeatureFlags = { ...DEFAULT_FLAGS };

  for (const key of Object.keys(FEATURE_FLAG_DEFINITIONS) as FeatureFlagKey[]) {
    const value = doc.featureFlags[key];
    if (typeof value === 'boolean') {
      flags[key] = value;
    }
  }

  const requested = doc.requestedIntegrations.filter(isFeatureFlagKey);

  return {
    flags,
    requested,
  };
}

function ensureInMemoryDocument(uid: string): FeatureFlagDocument {
  const existing = inMemoryStore.get(uid);
  if (existing) {
    return cloneDocument(existing);
  }

  const fresh = createEmptyDocument();
  inMemoryStore.set(uid, cloneDocument(fresh));
  return fresh;
}

function isFeatureFlagKey(value: unknown): value is FeatureFlagKey {
  return value === 'notionImport' || value === 'googleFormsImport';
}

async function loadFirestoreModule(): Promise<FirestoreModule | null> {
  if (firestoreModule !== undefined) {
    return firestoreModule;
  }

  try {
    const dynamicImport = new Function('specifier', 'return import(specifier);') as (
      specifier: string,
    ) => Promise<unknown>;
    const mod = await dynamicImport('firebase-admin/firestore');
    firestoreModule = mod as FirestoreModule;
  } catch (error) {
    firestoreModule = null;
  }

  return firestoreModule;
}

async function getFirestoreUserDoc(uid: string): Promise<FirestoreDocumentReference | null> {
  const mod = await loadFirestoreModule();
  if (!mod) {
    return null;
  }

  try {
    const db = mod.getFirestore();
    if (!db || typeof db.collection !== 'function') {
      return null;
    }

    const users = db.collection('users');
    if (!users || typeof users.doc !== 'function') {
      return null;
    }

    return users.doc(uid) ?? null;
  } catch (error) {
    return null;
  }
}

function normalizeDocument(input: unknown): FeatureFlagDocument {
  if (!input || typeof input !== 'object') {
    return createEmptyDocument();
  }

  const raw = input as Record<string, unknown>;
  const featureFlags: FeatureFlagRecord = {};

  if (raw.featureFlags && typeof raw.featureFlags === 'object') {
    const entries = raw.featureFlags as Record<string, unknown>;
    for (const key of Object.keys(entries)) {
      if (isFeatureFlagKey(key) && typeof entries[key] === 'boolean') {
        featureFlags[key] = entries[key] as boolean;
      }
    }
  }

  const requestedRaw = Array.isArray(raw.requestedIntegrations)
    ? raw.requestedIntegrations
    : [];

  const requested = requestedRaw.filter(isFeatureFlagKey);

  return {
    featureFlags,
    requestedIntegrations: requested,
  };
}

async function fetchDocumentFromFirestore(uid: string): Promise<FeatureFlagDocument | null> {
  const docRef = await getFirestoreUserDoc(uid);
  if (!docRef) {
    return null;
  }

  try {
    const snapshot = await docRef.get();
    if (!snapshot || !('exists' in snapshot) || !snapshot.exists) {
      return null;
    }

    const data = typeof snapshot.data === 'function' ? snapshot.data() : snapshot.data;
    if (!data) {
      return createEmptyDocument();
    }

    return normalizeDocument(data);
  } catch (error) {
    return null;
  }
}

async function persistDocumentToFirestore(uid: string, doc: FeatureFlagDocument): Promise<boolean> {
  const docRef = await getFirestoreUserDoc(uid);
  if (!docRef || typeof docRef.set !== 'function') {
    return false;
  }

  try {
    await docRef.set(
      {
        featureFlags: doc.featureFlags,
        requestedIntegrations: doc.requestedIntegrations,
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function getFeatureFlagDocument(uid: string): Promise<FeatureFlagDocument> {
  const firestoreDoc = await fetchDocumentFromFirestore(uid);
  if (firestoreDoc) {
    inMemoryStore.set(uid, cloneDocument(firestoreDoc));
    return firestoreDoc;
  }

  const memoryDoc = ensureInMemoryDocument(uid);
  return cloneDocument(memoryDoc);
}

export async function getUserFeatureFlagState(uid: string | null | undefined): Promise<FeatureFlagState> {
  if (!uid) {
    return {
      flags: { ...DEFAULT_FLAGS },
      requested: [],
    };
  }

  const doc = await getFeatureFlagDocument(uid);
  return toState(doc);
}

export async function getUserFeatureFlags(uid: string | null | undefined): Promise<FeatureFlags> {
  const state = await getUserFeatureFlagState(uid);
  return state.flags;
}

export async function isFeatureFlagEnabled(uid: string | null | undefined, flag: FeatureFlagKey): Promise<boolean> {
  const flags = await getUserFeatureFlags(uid);
  return Boolean(flags[flag]);
}

export async function setFeatureFlag(uid: string, flag: FeatureFlagKey, value: boolean): Promise<FeatureFlagState> {
  if (!uid) {
    throw new Error('A user ID is required to set feature flags.');
  }

  const doc = await getFeatureFlagDocument(uid);
  doc.featureFlags[flag] = value;
  inMemoryStore.set(uid, cloneDocument(doc));
  await persistDocumentToFirestore(uid, doc);
  return toState(doc);
}

export async function requestIntegrationAccess(uid: string, flag: FeatureFlagKey): Promise<FeatureFlagState> {
  if (!uid) {
    throw new Error('A user ID is required to request integration access.');
  }

  const doc = await getFeatureFlagDocument(uid);
  if (!doc.requestedIntegrations.includes(flag)) {
    doc.requestedIntegrations.push(flag);
  }
  inMemoryStore.set(uid, cloneDocument(doc));
  await persistDocumentToFirestore(uid, doc);
  return toState(doc);
}

export function resetFeatureFlagCache(): void {
  inMemoryStore.clear();
  firestoreModule = undefined;
}
