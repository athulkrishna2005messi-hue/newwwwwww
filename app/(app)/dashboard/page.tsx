import { Dashboard } from '@/components/dashboard/Dashboard';
import { fetchDashboardSnapshot, encodeCursor } from '@/lib/dashboard/data';
import { DashboardFilters } from '@/types/dashboard';

const DEFAULT_FILTERS: DashboardFilters = {
  sentiment: 'all',
  tags: [],
  startDate: null,
  endDate: null
};

export default async function DashboardPage() {
  const snapshot = await fetchDashboardSnapshot(DEFAULT_FILTERS).catch(() => null);

  const initialPage = snapshot
    ? {
        analyses: snapshot.analyses,
        nextCursor: encodeCursor(snapshot.nextCursor),
        metrics: snapshot.metrics
      }
    : undefined;

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
      <Dashboard
        initialFilters={DEFAULT_FILTERS}
        initialPage={initialPage}
        initialMetrics={snapshot?.metrics}
      />
    </main>
  );
}
