'use client';

import { useMemo, useState } from 'react';
import { DashboardCharts } from './Charts';
import { ExportButtons } from './ExportButtons';
import { FeedbackTable } from './FeedbackTable';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import {
  useDashboardAnalyses,
  useDashboardMetrics,
  useUpdateSuggestedReply
} from '@/hooks/useDashboardData';
import { DashboardFilters, DashboardMetrics } from '@/types/dashboard';
import { DashboardPageResponse } from '@/lib/dashboard/client';

interface DashboardProps {
  initialFilters: DashboardFilters;
  initialPage?: DashboardPageResponse;
  initialMetrics?: DashboardMetrics;
}

const DEFAULT_PAGE_SIZE = 50;

export function Dashboard({ initialFilters, initialPage, initialMetrics }: DashboardProps) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const updateReply = useUpdateSuggestedReply();

  const analysesQuery = useDashboardAnalyses(filters, {
    initialPage,
    pageSize: DEFAULT_PAGE_SIZE
  });

  const metricsQuery = useDashboardMetrics(filters, {
    initialMetrics: initialMetrics ?? initialPage?.metrics
  });

  const analyses = useMemo(
    () => analysesQuery.data?.pages.flatMap((page) => page.analyses) ?? [],
    [analysesQuery.data]
  );

  const totalCount = metricsQuery.data?.totalCount ?? analyses.length;

  const availableTags = useMemo(() => metricsQuery.data?.topTags.map((tag) => tag.tag) ?? [], [
    metricsQuery.data
  ]);

  const isInitialLoading = analysesQuery.isLoading && !analysesQuery.data;
  const isRefetching = analysesQuery.isFetching && Boolean(analysesQuery.data) && !analysesQuery.isFetchingNextPage;

  const handleFiltersChange = (next: DashboardFilters) => {
    setFilters(next);
  };

  const handleEditReply = async (id: string, reply: string) => {
    try {
      await updateReply.mutateAsync({ id, suggestedReply: reply });
    } catch (error) {
      console.error('Failed to save suggested reply', error);
      throw error;
    }
  };

  const handleLoadMore = () => {
    if (!analysesQuery.hasNextPage || analysesQuery.isFetchingNextPage) return;
    analysesQuery.fetchNextPage();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Insights dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitor sentiment trends, tag performance, and customer feedback in real time.
          </p>
        </div>
        <ExportButtons analyses={analyses} filters={filters} />
      </header>

      <section className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Total feedback</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalCount}</p>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Positive</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>
            {metricsQuery.data?.sentimentDistribution.find((item) => item.sentiment === 'positive')?.value ?? 0}
          </p>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Negative</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>
            {metricsQuery.data?.sentimentDistribution.find((item) => item.sentiment === 'negative')?.value ?? 0}
          </p>
        </div>
      </section>

      <section>
        {metricsQuery.isLoading && !metricsQuery.data ? (
          <LoadingSkeleton rows={6} />
        ) : metricsQuery.data ? (
          <DashboardCharts metrics={metricsQuery.data} />
        ) : (
          <EmptyState
            title="Metrics unavailable"
            description="We could not load metrics from Firestore. Check your configuration."
          />
        )}
      </section>

      <section>
        {isInitialLoading ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <FeedbackTable
            analyses={analyses}
            filters={filters}
            availableTags={availableTags}
            totalCount={totalCount}
            isLoading={isRefetching}
            isFetchingMore={analysesQuery.isFetchingNextPage}
            hasMore={Boolean(analysesQuery.hasNextPage)}
            onLoadMore={handleLoadMore}
            onFiltersChange={handleFiltersChange}
            onEditReply={handleEditReply}
          />
        )}
      </section>
    </div>
  );
}

export default Dashboard;
