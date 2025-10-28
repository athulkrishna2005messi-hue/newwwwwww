import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/lib/firebase';

const COLLECTION_NAME = 'kb';
const DEFAULT_LIMIT = 50;

export const KB_ENTRY_LIMIT = DEFAULT_LIMIT;

export type KbEmbeddingChunk = number[];
export type KbEmbedding = KbEmbeddingChunk[];

export interface KbEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  ownerId: string;
  embedding: KbEmbedding;
  updatedAt: Date;
}

export interface KbEntryInput {
  title: string;
  body: string;
  tags: string[];
  embedding: KbEmbedding;
}

export interface CreateKbEntryPayload extends KbEntryInput {
  ownerId: string;
}

export type UpdateKbEntryPayload = KbEntryInput;

interface FirestoreKbEntry extends DocumentData {
  title: string;
  body: string;
  tags?: string[];
  ownerId: string;
  embedding: KbEmbedding;
  updatedAt?: Timestamp;
}

function kbCollectionReference(): CollectionReference<FirestoreKbEntry> {
  return collection(getFirebaseFirestore(), COLLECTION_NAME) as CollectionReference<FirestoreKbEntry>;
}

function toKbEntry(snapshot: DocumentSnapshot<FirestoreKbEntry>): KbEntry {
  const data = snapshot.data();

  if (!data) {
    throw new Error('Knowledge base entry is missing data.');
  }

  return {
    id: snapshot.id,
    title: data.title,
    body: data.body,
    tags: Array.isArray(data.tags) ? data.tags : [],
    ownerId: data.ownerId,
    embedding: Array.isArray(data.embedding) ? data.embedding : [],
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

async function assertOwnership(docRef: DocumentReference<FirestoreKbEntry>, ownerId: string) {
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Knowledge base entry not found.');
  }

  const data = snapshot.data();
  if (data.ownerId !== ownerId) {
    throw new Error('You do not have permission to modify this knowledge base entry.');
  }

  return snapshot;
}

export async function getKbEntries(ownerId: string, limitCount = DEFAULT_LIMIT): Promise<KbEntry[]> {
  const entriesQuery = query(
    kbCollectionReference(),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnapshot) => toKbEntry(docSnapshot));
}

export async function createKbEntry(payload: CreateKbEntryPayload): Promise<KbEntry> {
  const docRef = await addDoc(kbCollectionReference(), {
    title: payload.title,
    body: payload.body,
    tags: payload.tags,
    ownerId: payload.ownerId,
    embedding: payload.embedding,
    updatedAt: serverTimestamp(),
  });

  const snapshot = await getDoc(docRef);
  return toKbEntry(snapshot);
}

export async function updateKbEntry(id: string, ownerId: string, payload: UpdateKbEntryPayload): Promise<KbEntry> {
  const docRef = doc(kbCollectionReference(), id);
  await assertOwnership(docRef, ownerId);

  await updateDoc(docRef, {
    title: payload.title,
    body: payload.body,
    tags: payload.tags,
    embedding: payload.embedding,
    updatedAt: serverTimestamp(),
  });

  const snapshot = await getDoc(docRef);
  return toKbEntry(snapshot);
}

export async function deleteKbEntry(id: string, ownerId: string): Promise<void> {
  const docRef = doc(kbCollectionReference(), id);
  await assertOwnership(docRef, ownerId);
  await deleteDoc(docRef);
}
