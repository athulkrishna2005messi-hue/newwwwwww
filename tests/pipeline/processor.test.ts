import { describe, expect, it } from 'vitest';

import { RateLimitError } from '@/lib/pipeline/errors';
import { createPipelineStore } from '@/state/pipelineStore';
import { PipelineProcessor } from '@/lib/pipeline/processor';
import type {
  AnalysisPersister,
  AnalysisRecord,
  FeedbackItem,
  PipelineApis,
  PipelineCheckpoint,
  PipelineCheckpointService,
  SuggestedReplyResult,
  SentimentResult,
  SummaryResult
} from '@/lib/pipeline/types';
import { SimpleQuotaService } from '@/lib/pipeline/quota';

class InMemoryPersister implements AnalysisPersister {
  public readonly records: Array<{ analysis: AnalysisRecord; feedback: FeedbackItem }> = [];

  async persist(analysis: AnalysisRecord, feedback: FeedbackItem): Promise<void> {
    this.records.push({ analysis, feedback });
  }
}

class InMemoryCheckpointService implements PipelineCheckpointService {
  public snapshot: PipelineCheckpoint | null = null;
  public history: PipelineCheckpoint[] = [];

  async load(userId: string): Promise<PipelineCheckpoint | null> {
    if (this.snapshot && this.snapshot.userId === userId) {
      return this.snapshot;
    }
    return null;
  }

  async save(checkpoint: PipelineCheckpoint): Promise<void> {
    this.snapshot = checkpoint;
    this.history.push(checkpoint);
  }

  async clear(userId: string): Promise<void> {
    if (this.snapshot?.userId === userId) {
      this.snapshot = null;
    }
  }
}

const createFeedback = (count: number, userId = 'user-1'): FeedbackItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `feedback-${index + 1}`,
    userId,
    text: `Feedback item ${index + 1}`,
    createdAt: new Date().toISOString()
  }));

describe('PipelineProcessor', () => {
  it('processes 5 items, persists results, and recovers from rate limits', async () => {
    const items = createFeedback(5);
    const store = createPipelineStore();
    const persister = new InMemoryPersister();
    const checkpoints = new InMemoryCheckpointService();

    let rateLimited = false;
    const waits: number[] = [];

    const apis: PipelineApis = {
      async analyzeSentiment(item: FeedbackItem): Promise<SentimentResult> {
        if (item.id === 'feedback-3' && !rateLimited) {
          rateLimited = true;
          throw new RateLimitError('Rate limited for testing');
        }
        return {
          label: 'positive',
          score: 0.9,
          raw: { id: item.id }
        };
      },
      async summarize(item: FeedbackItem): Promise<SummaryResult> {
        return { summary: `Summary for ${item.id}`, raw: null };
      },
      async matchKnowledgeBase(item: FeedbackItem) {
        return {
          kbMatchIds: [`kb-${item.id}`],
          matches: [
            {
              id: `kb-${item.id}`,
              score: 0.8
            }
          ]
        };
      },
      async generateReply(item: FeedbackItem): Promise<SuggestedReplyResult> {
        return {
          content: `Reply for ${item.id}`,
          model: 'test-model',
          raw: null
        };
      }
    };

    const processor = new PipelineProcessor({
      store,
      apis,
      persister,
      checkpointService: checkpoints,
      quotaService: new SimpleQuotaService({ monthlyLimit: 100 }),
      config: {
        batchSize: 2,
        delayMs: 0,
        backoffMs: 5,
        backoffFactor: 2,
        maxRetries: 3,
        summarizationEnabled: true
      },
      wait: async (ms) => {
        waits.push(ms);
      }
    });

    await processor.start({ userId: 'user-1', items });

    expect(rateLimited).toBe(true);
    expect(waits).toContain(5);
    expect(persister.records).toHaveLength(5);
    expect(new Set(persister.records.map((record) => record.feedback.id)).size).toBe(5);
    expect(checkpoints.snapshot).toBeNull();
  });

  it('resumes from checkpoint without duplicating writes', async () => {
    const items = createFeedback(5);
    const store = createPipelineStore();
    const persister = new InMemoryPersister();
    const checkpoints = new InMemoryCheckpointService();

    const apis: PipelineApis = {
      async analyzeSentiment(item: FeedbackItem): Promise<SentimentResult> {
        return { label: 'neutral', score: 0.5, raw: item.id };
      },
      async summarize(item: FeedbackItem): Promise<SummaryResult> {
        return { summary: `Summary ${item.id}`, raw: null };
      },
      async matchKnowledgeBase(item: FeedbackItem) {
        return {
          kbMatchIds: [`kb-${item.id}`],
          matches: [
            {
              id: `kb-${item.id}`,
              score: 0.9
            }
          ]
        };
      },
      async generateReply(item: FeedbackItem): Promise<SuggestedReplyResult> {
        return {
          content: `Reply ${item.id}`,
          model: 'test-model',
          raw: null
        };
      }
    };

    const quota = new SimpleQuotaService({ monthlyLimit: 3 });

    const processor = new PipelineProcessor({
      store,
      apis,
      persister,
      checkpointService: checkpoints,
      quotaService: quota,
      config: {
        batchSize: 3,
        delayMs: 0,
        backoffMs: 10,
        backoffFactor: 2,
        maxRetries: 2
      },
      wait: async () => {}
    });

    await processor.start({ userId: 'user-1', items });

    expect(persister.records).toHaveLength(3);
    expect(checkpoints.snapshot).not.toBeNull();
    expect(checkpoints.snapshot?.queue.length).toBeGreaterThan(0);

    const newStore = createPipelineStore();
    const resumeProcessor = new PipelineProcessor({
      store: newStore,
      apis,
      persister,
      checkpointService: checkpoints,
      quotaService: new SimpleQuotaService({ monthlyLimit: 100 }),
      config: {
        batchSize: 2,
        delayMs: 0,
        backoffMs: 10,
        backoffFactor: 2,
        maxRetries: 2
      },
      wait: async () => {}
    });

    await resumeProcessor.hydrateFromCheckpoint('user-1', items);
    await resumeProcessor.resume();

    expect(persister.records).toHaveLength(5);
    expect(new Set(persister.records.map((record) => record.feedback.id)).size).toBe(5);
    expect(checkpoints.snapshot).toBeNull();
  });
});
