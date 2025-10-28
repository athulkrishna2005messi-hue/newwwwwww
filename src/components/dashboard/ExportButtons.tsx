'use client';

import { useCallback, useState } from 'react';
import { AnalysisRecord, DashboardFilters } from '@/types/dashboard';
import { exportAnalysesToCSV } from '@/lib/export/csv';
import { exportAnalysesToPDF } from '@/lib/export/pdf';
import { fetchDashboardPage } from '@/lib/dashboard/client';

interface ExportButtonsProps {
  analyses: AnalysisRecord[];
  filters: DashboardFilters;
}

export function ExportButtons({ analyses, filters }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const hasData = analyses.length > 0;

  const resolveRows = useCallback(async (): Promise<AnalysisRecord[]> => {
    if (!hasData) {
      return [];
    }

    if (analyses.length >= 200) {
      return analyses.slice(0, 200);
    }

    setIsExporting(true);
    try {
      const response = await fetchDashboardPage(filters, { pageSize: 200, includeMetrics: false });
      const fetched = response.analyses;
      return fetched.length ? fetched.slice(0, 200) : analyses.slice(0, 200);
    } catch (error) {
      console.error('Export fetch failed, falling back to cached rows', error);
      return analyses.slice(0, 200);
    } finally {
      setIsExporting(false);
    }
  }, [analyses, filters, hasData]);

  const handleCSV = async () => {
    if (!hasData || isExporting) return;
    const rows = await resolveRows();
    if (!rows.length) return;
    exportAnalysesToCSV(rows, filters);
  };

  const handlePDF = async () => {
    if (!hasData || isExporting) return;
    const rows = await resolveRows();
    if (!rows.length) return;
    exportAnalysesToPDF(rows, filters);
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        className="button secondary"
        type="button"
        onClick={handleCSV}
        disabled={!hasData || isExporting}
      >
        {isExporting ? 'Preparing…' : 'Export CSV'}
      </button>
      <button
        className="button secondary"
        type="button"
        onClick={handlePDF}
        disabled={!hasData || isExporting}
      >
        {isExporting ? 'Preparing…' : 'Export PDF'}
      </button>
    </div>
  );
}
