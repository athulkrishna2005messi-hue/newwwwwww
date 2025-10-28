export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface AnalysisRecord {
  id: string;
  feedback: string;
  sentiment: Sentiment;
  tags: string[];
  painPoints: string[];
  createdAt: string;
  createdAtMillis: number;
  suggestedReply?: string;
}

export interface DashboardFilters {
  sentiment: Sentiment | 'all';
  tags: string[];
  startDate?: string | null;
  endDate?: string | null;
}

export interface DashboardMetrics {
  totalCount: number;
  sentimentDistribution: {
    sentiment: Sentiment;
    value: number;
  }[];
  volumeOverTime: {
    date: string;
    count: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
}

export interface EncodedCursor {
  id: string;
  createdAt: number;
}
