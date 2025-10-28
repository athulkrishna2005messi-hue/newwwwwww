import { FieldPath, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AnalysisRecord, DashboardFilters, DashboardMetrics, EncodedCursor, Sentiment } from '@/types/dashboard';
import { getAdminFirestore, isAdminFirestoreAvailable } from '@/lib/server/firebaseAdmin';

const COLLECTION = 'analyses';
const DEFAULT_PAGE_SIZE = 50;
const METRICS_SAMPLE_SIZE = 200;

function toTimestamp(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return Timestamp.fromMillis(date.getTime());
}

function normalizeFilters(filters?: Partial<DashboardFilters>): DashboardFilters {
  return {
    sentiment: filters?.sentiment ?? 'all',
    tags: filters?.tags?.filter(Boolean) ?? [],
    startDate: filters?.startDate ?? null,
    endDate: filters?.endDate ?? null
  };
}

function applyFilters(
  query: FirebaseFirestore.Query,
  filters: DashboardFilters
): FirebaseFirestore.Query {
  let updatedQuery = query;

  if (filters.sentiment && filters.sentiment !== 'all') {
    updatedQuery = updatedQuery.where('sentiment', '==', filters.sentiment);
  }

  if (filters.tags.length) {
    const limitedTags = filters.tags.slice(0, 10);
    updatedQuery = updatedQuery.where('tags', 'array-contains-any', limitedTags);
  }

  const startTimestamp = toTimestamp(filters.startDate ?? undefined);
  const endTimestamp = toTimestamp(filters.endDate ?? undefined);

  if (startTimestamp) {
    updatedQuery = updatedQuery.where('createdAt', '>=', startTimestamp);
  }

  if (endTimestamp) {
    updatedQuery = updatedQuery.where('createdAt', '<=', endTimestamp);
  }

  return updatedQuery;
}

function transformDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): AnalysisRecord {
  const data = doc.data();
  const createdAtField = data.createdAt instanceof Timestamp ? data.createdAt : null;
  const createTime = doc.createTime instanceof Timestamp ? doc.createTime : null;
  const createdAtMillis = (createdAtField ?? createTime ?? Timestamp.fromDate(new Date())).toMillis();

  const tags = Array.isArray(data.tags)
    ? data.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : [];
  const painPoints = Array.isArray(data.painPoints)
    ? data.painPoints.filter((tag: unknown): tag is string => typeof tag === 'string')
    : [];

  const sentiment: Sentiment = ['positive', 'neutral', 'negative'].includes(data.sentiment)
    ? data.sentiment
    : 'neutral';

  return {
    id: doc.id,
    feedback: typeof data.feedback === 'string' ? data.feedback : '',
    sentiment,
    tags,
    painPoints,
    createdAt: new Date(createdAtMillis).toISOString(),
    createdAtMillis,
    suggestedReply: typeof data.suggestedReply === 'string' ? data.suggestedReply : undefined
  };
}

interface QueryOptions {
  limit?: number;
  cursor?: EncodedCursor | null;
  includeExtraForPagination?: boolean;
}

async function runAnalysesQuery(
  filters: DashboardFilters,
  options?: QueryOptions
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const db = getAdminFirestore();
  const baseLimit = options?.limit ?? DEFAULT_PAGE_SIZE;
  const limit = options?.includeExtraForPagination ? baseLimit + 1 : baseLimit;

  let query = applyFilters(db.collection(COLLECTION), filters)
    .orderBy('createdAt', 'desc')
    .orderBy(FieldPath.documentId());

  if (options?.cursor) {
    query = query.startAfter(Timestamp.fromMillis(options.cursor.createdAt), options.cursor.id);
  }

  query = query.limit(limit);
  const snapshot = await query.get();
  return snapshot.docs;
}

export async function fetchAnalysesPage(
  filters?: Partial<DashboardFilters>,
  cursor?: EncodedCursor | null,
  pageSize = DEFAULT_PAGE_SIZE
) {
  if (!isAdminFirestoreAvailable()) {
    return { analyses: [] as AnalysisRecord[], nextCursor: null as EncodedCursor | null };
  }

  const normalized = normalizeFilters(filters);
  const docs = await runAnalysesQuery(normalized, {
    limit: pageSize,
    cursor,
    includeExtraForPagination: true
  });

  const hasMore = docs.length > pageSize;
  const trimmedDocs = hasMore ? docs.slice(0, pageSize) : docs;
  const analyses = trimmedDocs.map(transformDoc);

  const nextDoc = hasMore ? docs[pageSize] : undefined;
  const nextCursor = nextDoc && nextDoc.get('createdAt')
    ? {
        id: nextDoc.id,
        createdAt: (nextDoc.get('createdAt') as Timestamp).toMillis()
      }
    : null;

  return { analyses, nextCursor };
}

export async function fetchAnalysesSample(
  filters?: Partial<DashboardFilters>,
  sampleSize = METRICS_SAMPLE_SIZE
): Promise<AnalysisRecord[]> {
  if (!isAdminFirestoreAvailable()) {
    return [];
  }

  const normalized = normalizeFilters(filters);
  const docs = await runAnalysesQuery(normalized, {
    limit: sampleSize
  });

  return docs.map(transformDoc);
}

function computeMetrics(analyses: AnalysisRecord[]): DashboardMetrics {
  const totalCount = analyses.length;

  const sentimentMap: Record<Sentiment, number> = {
    positive: 0,
    neutral: 0,
    negative: 0
  };

  const volumeMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  analyses.forEach((analysis) => {
    sentimentMap[analysis.sentiment] += 1;

    const dateKey = new Date(analysis.createdAtMillis).toISOString().slice(0, 10);
    volumeMap.set(dateKey, (volumeMap.get(dateKey) ?? 0) + 1);

    const combinedTags = new Set<string>([...analysis.tags, ...analysis.painPoints]);
    combinedTags.forEach((tag) => {
      if (!tag) return;
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    });
  });

  const sentimentDistribution = (Object.keys(sentimentMap) as Sentiment[]).map((sentiment) => ({
    sentiment,
    value: sentimentMap[sentiment]
  }));

  const volumeOverTime = Array.from(volumeMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const topTags = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalCount,
    sentimentDistribution,
    volumeOverTime,
    topTags
  };
}

export async function fetchDashboardSnapshot(filters?: Partial<DashboardFilters>, pageSize = DEFAULT_PAGE_SIZE) {
  if (!isAdminFirestoreAvailable()) {
    return {
      analyses: [] as AnalysisRecord[],
      nextCursor: null as EncodedCursor | null,
      metrics: computeMetrics([])
    };
  }

  const [page, sample] = await Promise.all([
    fetchAnalysesPage(filters, null, pageSize),
    fetchAnalysesSample(filters)
  ]);

  return {
    analyses: page.analyses,
    nextCursor: page.nextCursor,
    metrics: computeMetrics(sample)
  };
}

export async function fetchMetrics(filters?: Partial<DashboardFilters>) {
  const sample = await fetchAnalysesSample(filters);
  return computeMetrics(sample);
}

export async function updateSuggestedReply(id: string, suggestedReply: string) {
  if (!isAdminFirestoreAvailable()) {
    throw new Error('Firebase admin is not configured.');
  }

  const db = getAdminFirestore();
  await db
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        suggestedReply,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  return suggestedReply;
}

export function encodeCursor(cursor: EncodedCursor | null) {
  if (!cursor) return null;
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64');
}

export function decodeCursor(encoded: string | null): EncodedCursor | null {
  if (!encoded) return null;
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.id === 'string' && typeof parsed.createdAt === 'number') {
      return parsed as EncodedCursor;
    }
    return null;
  } catch (error) {
    console.error('Failed to decode cursor', error);
    return null;
  }
}
