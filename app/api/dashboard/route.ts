import { NextRequest, NextResponse } from 'next/server';
import { decodeCursor, encodeCursor, fetchAnalysesPage, fetchMetrics } from '@/lib/dashboard/data';
import { DashboardFilters } from '@/types/dashboard';

export const runtime = 'nodejs';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function parseFilters(searchParams: URLSearchParams): Partial<DashboardFilters> {
  const sentiment = searchParams.get('sentiment');
  const tagsParam = searchParams.get('tags');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  return {
    sentiment:
      sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral' ? sentiment : 'all',
    tags: tagsParam ? tagsParam.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const pageSizeParam = Number(searchParams.get('pageSize'));
  const includeMetricsParam = searchParams.get('includeMetrics');

  const pageSize = Number.isFinite(pageSizeParam)
    ? Math.min(Math.max(Math.floor(pageSizeParam), 0), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const cursor = decodeCursor(searchParams.get('cursor'));
  const shouldIncludeMetrics = includeMetricsParam === '1' || !cursor;

  try {
    const [page, metrics] = await Promise.all([
      fetchAnalysesPage(filters, cursor, pageSize),
      shouldIncludeMetrics ? fetchMetrics(filters) : Promise.resolve(undefined)
    ]);

    return NextResponse.json({
      analyses: page.analyses,
      nextCursor: encodeCursor(page.nextCursor),
      metrics
    });
  } catch (error) {
    console.error('Dashboard API error', error);
    return NextResponse.json(
      {
        error: 'Failed to load dashboard data.'
      },
      { status: 500 }
    );
  }
}
