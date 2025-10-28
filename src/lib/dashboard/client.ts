import { AnalysisRecord, DashboardFilters, DashboardMetrics } from '@/types/dashboard';

const DASHBOARD_ENDPOINT = '/api/dashboard';

export interface DashboardPageResponse {
  analyses: AnalysisRecord[];
  nextCursor: string | null;
  metrics?: DashboardMetrics;
}

function buildQueryString(
  filters: DashboardFilters,
  options?: {
    pageSize?: number;
    cursor?: string | null;
    includeMetrics?: boolean;
  }
) {
  const params = new URLSearchParams();

  if (filters.sentiment && filters.sentiment !== 'all') {
    params.set('sentiment', filters.sentiment);
  }

  if (filters.tags.length) {
    params.set('tags', filters.tags.join(','));
  }

  if (filters.startDate) {
    params.set('startDate', filters.startDate);
  }

  if (filters.endDate) {
    params.set('endDate', filters.endDate);
  }

  if (typeof options?.pageSize === 'number') {
    params.set('pageSize', String(options.pageSize));
  }

  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }

  if (options?.includeMetrics) {
    params.set('includeMetrics', '1');
  }

  return params.toString();
}

export async function fetchDashboardPage(
  filters: DashboardFilters,
  options?: {
    cursor?: string | null;
    pageSize?: number;
    includeMetrics?: boolean;
  }
): Promise<DashboardPageResponse> {
  const query = buildQueryString(filters, {
    cursor: options?.cursor ?? null,
    pageSize: options?.pageSize,
    includeMetrics: options?.includeMetrics
  });

  const response = await fetch(`${DASHBOARD_ENDPOINT}?${query}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to load dashboard data');
  }

  return response.json();
}

export async function fetchDashboardMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
  const data = await fetchDashboardPage(filters, { pageSize: 0, includeMetrics: true });
  if (!data.metrics) {
    throw new Error('Metrics unavailable');
  }
  return data.metrics;
}
