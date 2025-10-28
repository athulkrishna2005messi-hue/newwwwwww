'use client';

import { useEffect, useMemo } from 'react';
import {
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import {
  collection,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query as buildFirestoreQuery,
  where,
  Timestamp
} from 'firebase/firestore';
import { fetchDashboardMetrics, fetchDashboardPage, DashboardPageResponse } from '@/lib/dashboard/client';
import { getClientFirestore, isFirebaseClientAvailable } from '@/lib/client/firebase';
import { AnalysisRecord, DashboardFilters, DashboardMetrics } from '@/types/dashboard';

type DashboardAnalysesQuery = DashboardPageResponse;

type UseDashboardAnalysesOptions = {
  initialPage?: DashboardAnalysesQuery;
  pageSize?: number;
};

type UseDashboardMetricsOptions = {
  initialMetrics?: DashboardMetrics;
};

const DEFAULT_PAGE_SIZE = 50;

function makeFiltersKey(filters: DashboardFilters) {
  const { sentiment, tags, startDate, endDate } = filters;
  return JSON.stringify({
    sentiment,
    tags: [...tags].sort(),
    startDate,
    endDate
  });
}

export function useDashboardAnalyses(
  filters: DashboardFilters,
  options?: UseDashboardAnalysesOptions
) {
  const queryClient = useQueryClient();
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filtersKey = useMemo(() => makeFiltersKey(filters), [filters]);
  const queryKey: QueryKey = useMemo(() => ['dashboard-analyses', filtersKey], [filtersKey]);

  const queryResult = useInfiniteQuery<DashboardAnalysesQuery, Error>({
    queryKey,
    queryFn: async ({ pageParam }) =>
      fetchDashboardPage(filters, {
        cursor: (pageParam as string | null | undefined) ?? null,
        pageSize,
        includeMetrics: !pageParam
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: options?.initialPage
      ? {
          pages: [options.initialPage],
          pageParams: [null]
        }
      : undefined,
    refetchInterval: 60_000,
    staleTime: 15_000,
    keepPreviousData: true
  });

  useEffect(() => {
    if (!isFirebaseClientAvailable()) {
      return;
    }

    const db = getClientFirestore();
    const constraints = [orderBy('createdAt', 'desc'), limitQuery(pageSize)];

    if (filters.sentiment && filters.sentiment !== 'all') {
      constraints.push(where('sentiment', '==', filters.sentiment));
    }

    if (filters.tags.length === 1) {
      constraints.push(where('tags', 'array-contains', filters.tags[0]));
    } else if (filters.tags.length > 1) {
      constraints.push(where('tags', 'array-contains-any', filters.tags.slice(0, 10)));
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!Number.isNaN(startDate.getTime())) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)));
      }
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!Number.isNaN(endDate.getTime())) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));
      }
    }

    const q = buildFirestoreQuery(collection(db, 'analyses'), ...constraints);

    const unsubscribe = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    });

    return () => unsubscribe();
  }, [filters, pageSize, queryClient]);

  return queryResult;
}

export function useDashboardMetrics(filters: DashboardFilters, options?: UseDashboardMetricsOptions) {
  const filtersKey = useMemo(() => makeFiltersKey(filters), [filters]);
  const queryKey: QueryKey = useMemo(() => ['dashboard-metrics', filtersKey], [filtersKey]);

  return useQuery<DashboardMetrics, Error>({
    queryKey,
    queryFn: () => fetchDashboardMetrics(filters),
    initialData: options?.initialMetrics,
    staleTime: 60_000,
    refetchInterval: 120_000
  });
}

export function useUpdateSuggestedReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, suggestedReply }: { id: string; suggestedReply: string }) => {
      const response = await fetch(`/api/dashboard/analyses/${id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suggestedReply })
      });

      if (!response.ok) {
        throw new Error('Failed to update suggested reply');
      }

      return (await response.json()) as { id: string; suggestedReply: string };
    },
    onSuccess: (data) => {
      queryClient.setQueriesData(
        { queryKey: ['dashboard-analyses'] },
        (current: { pages: DashboardAnalysesQuery[]; pageParams: unknown[] } | undefined) => {
          if (!current) return current;

          return {
            pages: current.pages.map((page) => ({
              ...page,
              analyses: page.analyses.map((analysis) =>
                analysis.id === data.id
                  ? {
                      ...analysis,
                      suggestedReply: data.suggestedReply
                    }
                  : analysis
              )
            })),
            pageParams: current.pageParams
          };
        }
      );
    }
  });
}
