'use client';

import Papa from 'papaparse';
import { AnalysisRecord, DashboardFilters } from '@/types/dashboard';

function serializeFilters(filters: DashboardFilters) {
  const parts: string[] = [];
  if (filters.sentiment !== 'all') parts.push(`Sentiment: ${filters.sentiment}`);
  if (filters.tags.length) parts.push(`Tags: ${filters.tags.join(', ')}`);
  if (filters.startDate) parts.push(`Start: ${filters.startDate}`);
  if (filters.endDate) parts.push(`End: ${filters.endDate}`);
  return parts.join(' | ') || 'None';
}

export function exportAnalysesToCSV(analyses: AnalysisRecord[], filters: DashboardFilters) {
  if (typeof window === 'undefined') return;

  const rows = analyses.map((analysis) => ({
    ID: analysis.id,
    Feedback: analysis.feedback,
    Sentiment: analysis.sentiment,
    Tags: analysis.tags.join('; '),
    'Pain Points': analysis.painPoints.join('; '),
    'Created At': new Date(analysis.createdAt).toLocaleString(),
    'Suggested Reply': analysis.suggestedReply ?? ''
  }));

  const csv = Papa.unparse(rows);
  const metadata = `Filters: ${serializeFilters(filters)}\nGenerated: ${new Date().toLocaleString()}\n\n`;
  const blob = new Blob([metadata + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', `dashboard_export_${Date.now()}.csv`);
  anchor.click();
  URL.revokeObjectURL(url);
}
