import type {
  FeedbackItem,
  KnowledgeBaseMatchResult,
  PipelineApis,
  SentimentResult,
  SuggestedReplyResult,
  SummaryResult
} from '@/lib/pipeline/types';
import { RateLimitError } from '@/lib/pipeline/errors';

export interface PipelineApiClientConfig {
  fetchImpl?: typeof fetch;
  sentimentEndpoint?: string;
  summarizationEndpoint?: string;
  generateEndpoint?: string;
  knowledgeBaseEndpoint?: string;
  parseKnowledgeBaseMatches?: (response: unknown) => KnowledgeBaseMatchResult;
}

const defaultParseMatches = (response: unknown): KnowledgeBaseMatchResult => {
  if (
    response &&
    typeof response === 'object' &&
    Array.isArray((response as { matches?: unknown }).matches)
  ) {
    const matchesArray = (response as { matches: Array<Record<string, unknown>> }).matches;
    const matches = matchesArray.map((match) => ({
      id: String(match.id ?? match.documentId ?? ''),
      score: typeof match.score === 'number' ? match.score : 0,
      metadata: match.metadata as Record<string, unknown> | undefined
    }));

    return {
      kbMatchIds: matches.map((match) => match.id).filter(Boolean),
      matches
    };
  }

  return { kbMatchIds: [], matches: [] };
};

const handleResponse = async (response: Response) => {
  if (response.status === 429) {
    throw new RateLimitError('Rate limited by upstream API', { status: response.status });
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Unexpected API response: ${response.status}`);
  }

  return response.json();
};

export const createPipelineApis = (config: PipelineApiClientConfig = {}): PipelineApis => {
  const fetchImpl = config.fetchImpl ?? fetch;
  const sentimentEndpoint = config.sentimentEndpoint ?? '/api/hf/sentiment';
  const summarizationEndpoint = config.summarizationEndpoint ?? '/api/hf/summarize';
  const generateEndpoint = config.generateEndpoint ?? '/api/hf/generate';
  const knowledgeBaseEndpoint = config.knowledgeBaseEndpoint ?? '/api/kb/match';
  const parseMatches = config.parseKnowledgeBaseMatches ?? defaultParseMatches;

  return {
    async analyzeSentiment(item: FeedbackItem): Promise<SentimentResult> {
      const response = await fetchImpl(sentimentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, metadata: item.metadata })
      });

      const payload = await handleResponse(response);
      return {
        label: String((payload as Record<string, unknown>)?.label ?? 'neutral'),
        score: Number((payload as Record<string, unknown>)?.score ?? 0),
        raw: payload
      };
    },

    async summarize(
      item: FeedbackItem,
      _context: { sentiment: SentimentResult }
    ): Promise<SummaryResult> {
      const response = await fetchImpl(summarizationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, metadata: item.metadata })
      });

      const payload = await handleResponse(response);
      return {
        summary: String((payload as Record<string, unknown>)?.summary ?? ''),
        raw: payload
      };
    },

    async matchKnowledgeBase(
      item: FeedbackItem,
      _context: { sentiment: SentimentResult; summary?: SummaryResult }
    ): Promise<KnowledgeBaseMatchResult> {
      const response = await fetchImpl(knowledgeBaseEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, metadata: item.metadata })
      });

      const payload = await handleResponse(response);
      return parseMatches(payload);
    },

    async generateReply(
      item: FeedbackItem,
      context: {
        sentiment: SentimentResult;
        summary?: SummaryResult;
        kbMatches: KnowledgeBaseMatchResult;
      }
    ): Promise<SuggestedReplyResult> {
      const response = await fetchImpl(generateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          metadata: item.metadata,
          sentiment: context.sentiment,
          summary: context.summary,
          kbMatches: context.kbMatches
        })
      });

      const payload = await handleResponse(response);
      return {
        content: String((payload as Record<string, unknown>)?.content ?? ''),
        model: String((payload as Record<string, unknown>)?.model ?? 'hf-generate'),
        raw: payload
      };
    }
  };
};
