import { Timestamp } from 'firebase-admin/firestore';

import { resolveFirestore } from '@/lib/firestore/client';
import type { PipelineCheckpoint, PipelineCheckpointService } from '@/lib/pipeline/types';

const toSerializableQueue = (checkpoint: PipelineCheckpoint) =>
  checkpoint.queue.map((entry) => ({
    id: entry.id,
    status: entry.status,
    attempts: entry.attempts,
    error: entry.error ?? null
  }));

const fromFirestoreQueue = (
  queue: Array<{ id: string; status: string; attempts: number; error?: string | null }> | undefined
) =>
  (queue ?? []).map((entry) => ({
    id: entry.id,
    status: entry.status,
    attempts: entry.attempts,
    error: entry.error ?? undefined
  }));

export class FirestoreCheckpointService implements PipelineCheckpointService {
  constructor(private readonly collection = resolveFirestore()) {}

  async load(userId: string): Promise<PipelineCheckpoint | null> {
    const ref = this.collection.doc(`users/${userId}/pipeline`);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as Record<string, unknown>;
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString();

    return {
      userId,
      queue: fromFirestoreQueue(data.queue as Array<{ id: string; status: string; attempts: number; error?: string | null }>),
      processedIds: Array.isArray(data.processedIds) ? (data.processedIds as string[]) : [],
      status: (data.status as PipelineCheckpoint['status']) ?? 'paused',
      activeItemId: typeof data.activeItemId === 'string' ? (data.activeItemId as string) : undefined,
      updatedAt,
      error: typeof data.error === 'string' ? (data.error as string) : undefined
    };
  }

  async save(checkpoint: PipelineCheckpoint): Promise<void> {
    const ref = this.collection.doc(`users/${checkpoint.userId}/pipeline`);
    await ref.set(
      {
        queue: toSerializableQueue(checkpoint),
        processedIds: checkpoint.processedIds,
        status: checkpoint.status,
        activeItemId: checkpoint.activeItemId ?? null,
        error: checkpoint.error ?? null,
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );
  }

  async clear(userId: string): Promise<void> {
    const ref = this.collection.doc(`users/${userId}/pipeline`);
    await ref.delete();
  }
}
