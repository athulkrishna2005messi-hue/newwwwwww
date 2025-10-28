import type { FieldValue, Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp | FieldValue;

export interface UserQuotas {
  analyses: number;
  feedback: number;
  knowledgeBase: number;
}

export type AuthProviderType = 'anonymous' | 'passwordless' | 'oauth' | 'custom';

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro';
  authProvider: AuthProviderType;
  quotas: UserQuotas;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type FeedbackStatus = 'new' | 'in_review' | 'resolved' | 'archived';

export interface FeedbackDocument {
  id?: string;
  userId: string;
  subject: string;
  message: string;
  rating?: number;
  status: FeedbackStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AnalysisDocument {
  id?: string;
  userId: string;
  input: string;
  output?: string;
  status: AnalysisStatus;
  model?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type KnowledgeBaseVisibility = 'private' | 'public';

export interface KnowledgeBaseDocument {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  sourceType: 'upload' | 'url' | 'manual';
  visibility: KnowledgeBaseVisibility;
  itemCount: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface FirestoreCollections {
  users: UserDocument;
  feedback: FeedbackDocument;
  analyses: AnalysisDocument;
  kb: KnowledgeBaseDocument;
}

export type FirestoreCollectionName = keyof FirestoreCollections;

export const DEFAULT_USER_QUOTAS: UserQuotas = {
  analyses: 5,
  feedback: 20,
  knowledgeBase: 3,
};
