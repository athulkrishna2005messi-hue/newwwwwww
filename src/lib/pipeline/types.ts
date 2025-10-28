export type PipelineItemStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface FeedbackItem {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineItemState {
  item: FeedbackItem;
  status: PipelineItemStatus;
  attempts: number;
  error?: string;
  lastUpdatedAt: string;
}

export interface SentimentResult {
  label: string;
  score: number;
  raw: unknown;
}

export interface SummaryResult {
  summary: string;
  raw?: unknown;
}

export interface KnowledgeBaseMatchResult {
  kbMatchIds: string[];
  matches: Array<{
    id: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface SuggestedReplyResult {
  content: string;
  model: string;
  raw?: unknown;
}

export interface AnalysisJobMetadata {
  startedAt: string;
  completedAt: string;
  attempts: number;
  retryDelays: number[];
  lastError?: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  feedbackId: string;
  sentiment: SentimentResult;
  tags: string[];
  kbMatchIds: string[];
  suggestedReply: SuggestedReplyResult;
  summary?: string;
  job: AnalysisJobMetadata;
}

export interface PipelineConfig {
  batchSize: number;
  delayMs: number;
  summarizationEnabled: boolean;
  maxRetries: number;
  backoffMs: number;
  backoffFactor: number;
}

export interface CheckpointItem {
  id: string;
  status: PipelineItemStatus;
  attempts: number;
  error?: string;
}

export interface PipelineCheckpoint {
  userId: string;
  queue: CheckpointItem[];
  processedIds: string[];
  status: 'idle' | 'running' | 'paused';
  activeItemId?: string;
  updatedAt: string;
  error?: string;
}

export interface PipelineSnapshot extends PipelineCheckpoint {}

export interface PipelineApis {
  analyzeSentiment(item: FeedbackItem): Promise<SentimentResult>;
  summarize?(item: FeedbackItem, context: { sentiment: SentimentResult }): Promise<SummaryResult>;
  matchKnowledgeBase(
    item: FeedbackItem,
    context: {
      sentiment: SentimentResult;
      summary?: SummaryResult;
    }
  ): Promise<KnowledgeBaseMatchResult>;
  generateReply(
    item: FeedbackItem,
    context: {
      sentiment: SentimentResult;
      summary?: SummaryResult;
      kbMatches: KnowledgeBaseMatchResult;
    }
  ): Promise<SuggestedReplyResult>;
}

export interface AnalysisPersister {
  persist(payload: AnalysisRecord, raw: FeedbackItem): Promise<void>;
}

export interface PipelineCheckpointService {
  load(userId: string): Promise<PipelineCheckpoint | null>;
  save(checkpoint: PipelineCheckpoint): Promise<void>;
  clear(userId: string): Promise<void>;
}

export interface PipelineQuotaService {
  ensureWithinQuota(count: number): Promise<void>;
  registerUsage(count: number): Promise<void>;
}

export interface PipelineLogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}
