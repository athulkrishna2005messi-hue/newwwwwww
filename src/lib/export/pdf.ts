'use client';

import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { AnalysisRecord, DashboardFilters } from '@/types/dashboard';

function describeFilters(filters: DashboardFilters) {
  const descriptions: string[] = [];
  if (filters.sentiment !== 'all') descriptions.push(`Sentiment: ${filters.sentiment}`);
  if (filters.tags.length) descriptions.push(`Tags: ${filters.tags.join(', ')}`);
  if (filters.startDate) descriptions.push(`Start: ${filters.startDate}`);
  if (filters.endDate) descriptions.push(`End: ${filters.endDate}`);
  return descriptions.length ? descriptions.join(' • ') : 'All data';
}

export function exportAnalysesToPDF(analyses: AnalysisRecord[], filters: DashboardFilters) {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Feedback Analyses Export', 14, 18);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  doc.text(`Filters: ${describeFilters(filters)}`, 14, 33);

  autoTable(doc, {
    startY: 40,
    head: [['Feedback', 'Sentiment', 'Tags', 'Pain Points', 'Created At', 'Suggested Reply']],
    body: analyses.map((analysis) => [
      analysis.feedback,
      analysis.sentiment,
      analysis.tags.join(', '),
      analysis.painPoints.join(', '),
      new Date(analysis.createdAt).toLocaleString(),
      analysis.suggestedReply ?? ''
    ]),
    styles: {
      fontSize: 9,
      cellWidth: 'wrap'
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
      4: { cellWidth: 40 },
      5: { cellWidth: 100 }
    }
  });

  doc.save(`dashboard_export_${Date.now()}.pdf`);
}
