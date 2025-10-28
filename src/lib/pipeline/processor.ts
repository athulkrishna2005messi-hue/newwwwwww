import {
  type AnalysisPersister,
  type FeedbackItem,
  type PipelineApis,
  type PipelineCheckpoint,
  type PipelineCheckpointService,
  type PipelineConfig,
  type PipelineLogger,
  type PipelineQuotaService,
  type PipelineSnapshot,
  type SentimentResult,
  type SummaryResult
} from '@/lib/pipeline/types';
import { isRateLimitError, PipelineError } from '@/lib/pipeline/errors';
import type { PipelineStore } from '@/state/pipelineStore';

const defaultLogger: PipelineLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

const noopQuotaService: PipelineQuotaService = {
  async ensureWithinQuota() {
    return;
  },
  async registerUsage() {
    return;
  }
};

const defaultWait = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface PipelineProcessorOptions {
  store: PipelineStore;
  apis: PipelineApis;
  persister: AnalysisPersister;
  checkpointService: PipelineCheckpointService;
  quotaService?: PipelineQuotaService;
  logger?: PipelineLogger;
  wait?: (ms: number) => Promise<void>;
  config?: Partial<PipelineConfig>;
}

export interface StartPipelineOptions {
  userId: string;
  items?: FeedbackItem[];
  resumeFromCheckpoint?: boolean;
}

export class PipelineProcessor {
  private readonly store: PipelineStore;
  private readonly apis: PipelineApis;
  private readonly persister: AnalysisPersister;
  private readonly checkpoints: PipelineCheckpointService;
  private readonly quota: PipelineQuotaService;
  private readonly wait: (ms: number) => Promise<void>;
  private readonly logger: PipelineLogger;
  private readonly config: PipelineConfig;

  private isProcessing = false;
  private userId?: string;

  constructor(options: PipelineProcessorOptions) {
    this.store = options.store;
    this.apis = options.apis;
    this.persister = options.persister;
    this.checkpoints = options.checkpointService;
    this.quota = options.quotaService ?? noopQuotaService;
    this.wait = options.wait ?? defaultWait;
    this.logger = options.logger ?? defaultLogger;

    const defaults: PipelineConfig = {
      batchSize: 5,
      delayMs: 800,
      summarizationEnabled: true,
      maxRetries: 5,
      backoffMs: 1000,
      backoffFactor: 2
    };

    const stateConfig = this.store.getState().config;
    this.config = {
      ...defaults,
      ...stateConfig,
      ...options.config
    };

    this.store.getState().setConfig(this.config);
  }

  async hydrateFromCheckpoint(userId: string, feedbackItems: FeedbackItem[]): Promise<PipelineCheckpoint | null> {
    this.userId = userId;
    const checkpoint = await this.checkpoints.load(userId);
    if (!checkpoint) {
      this.logger.debug('No checkpoint found for user', { userId });
      return null;
    }

    const itemsById = new Map(feedbackItems.map((entry) => [entry.id, entry]));
    const missingFeedback = checkpoint.queue
      .map((entry) => entry.id)
      .filter((id) => !itemsById.has(id));

    if (missingFeedback.length) {
      this.logger.warn('Checkpoint references missing feedback items; they will be skipped', {
        userId,
        missingFeedback
      });
    }

    const availableItems = feedbackItems.filter((item) => itemsById.has(item.id));
    this.store.getState().restoreFromCheckpoint(checkpoint, availableItems);
    if (checkpoint.status === 'paused') {
      this.store.getState().pause();
    }

    return checkpoint;
  }

  async start(options: StartPipelineOptions): Promise<void> {
    this.userId = options.userId;
    const items = options.items ?? [];
    let checkpoint: PipelineCheckpoint | null = null;

    if (options.resumeFromCheckpoint !== false) {
      checkpoint = await this.checkpoints.load(options.userId);
      if (checkpoint) {
        this.logger.info('Restoring checkpoint before starting pipeline', {
          userId: options.userId,
          status: checkpoint.status,
          queueSize: checkpoint.queue.length
        });
        const availableItems = this.collectAllKnownItems(items);
        this.store.getState().restoreFromCheckpoint(checkpoint, availableItems);
      }
    }

    if (items.length) {
      this.store.getState().enqueue(items);
    }

    if (checkpoint?.status === 'paused') {
      this.store.getState().pause();
    }

    await this.run();
  }

  async resume(): Promise<void> {
    if (!this.userId) {
      throw new PipelineError('Cannot resume pipeline without a user context');
    }

    if (this.isProcessing) {
      return;
    }

    this.store.getState().resume();
    await this.run();
  }

  pause(): void {
    this.isProcessing = false;
    this.store.getState().pause();
    if (this.userId) {
      void this.persistCheckpoint();
    }
  }

  async cancel(): Promise<void> {
    this.isProcessing = false;
    this.store.getState().cancel();
    if (this.userId) {
      await this.checkpoints.clear(this.userId);
    }
  }

  private async run(): Promise<void> {
    if (!this.userId) {
      throw new PipelineError('Pipeline requires a user context before starting');
    }

    if (this.isProcessing) {
      return;
    }

    if (!this.hasPendingItems()) {
      this.logger.debug('No pending items to process; skipping run');
      return;
    }

    this.isProcessing = true;
    this.store.getState().start();
    this.store.getState().clearRateLimitError();
    await this.persistCheckpoint();

    while (this.isProcessing && this.hasPendingItems()) {
      const state = this.store.getState();
      if (state.status === 'paused') {
        this.logger.info('Pipeline paused; breaking processing loop', { userId: this.userId });
        break;
      }

      const batchIds = this.collectNextBatch();
      if (!batchIds.length) {
        break;
      }

      for (let index = 0; index < batchIds.length; index += 1) {
        const itemId = batchIds[index];
        if (!this.isProcessing) {
          break;
        }

        try {
          await this.processItem(itemId);
          await this.quota.registerUsage(1);
        } catch (error) {
          this.logger.error('Pipeline item processing failed', {
            userId: this.userId,
            itemId,
            error: error instanceof Error ? error.message : String(error)
          });
        }

        if (!this.isProcessing) {
          break;
        }

        if (index < batchIds.length - 1 || this.hasPendingItems()) {
          await this.wait(this.config.delayMs);
        }
      }
    }

    this.isProcessing = false;
    const remaining = this.hasPendingItems();
    if (!remaining) {
      this.store.getState().reset();
      if (this.userId) {
        await this.checkpoints.clear(this.userId);
      }
      this.logger.info('Pipeline processing completed', { userId: this.userId });
    } else if (this.userId) {
      await this.persistCheckpoint();
    }
  }

  private collectNextBatch(): string[] {
    const ids: string[] = [];
    const batchSize = this.config.batchSize;
    const stateSnapshot = this.store.getState();

    const { activeItemId } = stateSnapshot;
    if (activeItemId) {
      const activeItem = stateSnapshot.items[activeItemId];
      if (activeItem && (activeItem.status === 'processing' || activeItem.status === 'pending')) {
        ids.push(activeItemId);
      }
    }

    while (ids.length < batchSize) {
      const nextId = this.store.getState().dequeue();
      if (!nextId) {
        break;
      }
      if (ids.includes(nextId)) {
        continue;
      }
      ids.push(nextId);
    }

    return ids;
  }

  private hasPendingItems(): boolean {
    const state = this.store.getState();
    return Boolean(state.queue.length || state.activeItemId);
  }

  private collectAllKnownItems(newItems: FeedbackItem[]): FeedbackItem[] {
    const state = this.store.getState();
    const existing = Object.values(state.items).map((entry) => entry.item);
    const aggregated = new Map<string, FeedbackItem>();
    [...existing, ...newItems].forEach((item) => aggregated.set(item.id, item));
    return Array.from(aggregated.values());
  }

  private async processItem(id: string): Promise<void> {
    const state = this.store.getState();
    const entry = state.items[id];
    if (!entry) {
      this.logger.warn('Skipping unknown pipeline item', { id, userId: this.userId });
      return;
    }

    const feedback = entry.item;

    try {
      await this.quota.ensureWithinQuota(1);
    } catch (error) {
      this.store.getState().pause();
      this.logger.error('Quota exceeded while processing pipeline item', {
        userId: this.userId,
        itemId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    this.store.getState().markProcessing(id);

    const startedAt = new Date().toISOString();
    const retryDelays: number[] = [];
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      attempt += 1;
      this.store.getState().recordAttempt(id);

      try {
        const sentiment = await this.apis.analyzeSentiment(feedback);
        const summary = await this.maybeSummarize(feedback, sentiment);
        const kbMatches = await this.apis.matchKnowledgeBase(feedback, { sentiment, summary });
        const suggestedReply = await this.apis.generateReply(feedback, {
          sentiment,
          summary,
          kbMatches
        });

        const completedAt = new Date().toISOString();
        await this.persister.persist(
          {
            id: `${feedback.id}-${completedAt}`,
            userId: feedback.userId,
            feedbackId: feedback.id,
            sentiment,
            kbMatchIds: kbMatches.kbMatchIds,
            tags: kbMatches.matches.map((match) => match.id),
            suggestedReply,
            summary: summary?.summary,
            job: {
              startedAt,
              completedAt,
              attempts: attempt,
              retryDelays,
              lastError: undefined
            }
          },
          feedback
        );

        this.store.getState().markCompleted(id);
        this.store.getState().clearRateLimitError();
        if (this.userId) {
          await this.persistCheckpoint();
        }
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn('Pipeline attempt failed', {
          userId: this.userId,
          itemId: id,
          attempt,
          error: errorMessage
        });

        if (isRateLimitError(error)) {
          const delay = this.calculateBackoffDelay(retryDelays.length);
          retryDelays.push(delay);
          this.store.getState().setRateLimitError(errorMessage);
          await this.wait(delay);
          this.store.getState().resume();
          continue;
        }

        if (attempt >= this.config.maxRetries) {
          this.store.getState().markFailed(id, errorMessage);
          if (this.userId) {
            await this.persistCheckpoint();
          }
          throw error;
        }

        const delay = this.calculateBackoffDelay(retryDelays.length);
        retryDelays.push(delay);
        await this.wait(delay);
      }
    }

    this.store.getState().markFailed(id, 'Max retries exceeded');
    if (this.userId) {
      await this.persistCheckpoint();
    }
  }

  private async maybeSummarize(feedback: FeedbackItem, sentiment: SentimentResult): Promise<SummaryResult | undefined> {
    if (!this.config.summarizationEnabled || !this.apis.summarize) {
      return undefined;
    }

    return this.apis.summarize(feedback, { sentiment });
  }

  private calculateBackoffDelay(retryCount: number): number {
    return this.config.backoffMs * Math.pow(this.config.backoffFactor, retryCount);
  }

  private async persistCheckpoint(): Promise<void> {
    if (!this.userId) {
      return;
    }

    const snapshot: PipelineSnapshot = this.store.getState().getSnapshot(this.userId);
    await this.checkpoints.save(snapshot);
  }
}
