'use server';

import { Timestamp } from 'firebase-admin/firestore';

import { resolveFirestore } from '@/lib/firestore/client';
import type { AnalysisRecord, FeedbackItem } from '@/lib/pipeline/types';

export interface SaveAnalysisInput {
  userId: string;
  feedbackId: string;
  feedback: FeedbackItem;
  analysis: AnalysisRecord;
}

export interface SaveAnalysisResult {
  analysisId: string;
  feedbackPath: string;
  analysisPath: string;
}

export const saveAnalysis = async (input: SaveAnalysisInput): Promise<SaveAnalysisResult> => {
  const firestore = resolveFirestore();
  const analysisId = input.analysis.id || firestore.collection(`analyses/${input.userId}/items`).doc().id;

  const feedbackRef = firestore.doc(`feedback/${input.userId}/items/${input.feedbackId}`);
  const analysisRef = firestore.doc(`analyses/${input.userId}/items/${analysisId}`);
  const pipelineRef = firestore.doc(`users/${input.userId}/pipeline`);

  await firestore.runTransaction(async (transaction) => {
    transaction.set(
      feedbackRef,
      {
        ...input.feedback,
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );

    transaction.set(analysisRef, {
      sentiment: input.analysis.sentiment,
      score: input.analysis.sentiment.score,
      tags: input.analysis.tags,
      kbMatchIds: input.analysis.kbMatchIds,
      suggestedReply: input.analysis.suggestedReply,
      summary: input.analysis.summary ?? null,
      job: input.analysis.job,
      feedbackId: input.feedbackId,
      userId: input.userId,
      createdAt: Timestamp.now()
    });

    transaction.set(
      pipelineRef,
      {
        lastProcessedFeedbackId: input.feedbackId,
        lastAnalysisId: analysisId,
        updatedAt: Timestamp.now(),
        status: 'idle'
      },
      { merge: true }
    );
  });

  return {
    analysisId,
    feedbackPath: feedbackRef.path,
    analysisPath: analysisRef.path
  };
};
