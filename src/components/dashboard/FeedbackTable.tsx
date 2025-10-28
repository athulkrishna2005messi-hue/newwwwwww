'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AnalysisRecord, DashboardFilters } from '@/types/dashboard';
import { EmptyState } from './EmptyState';

interface FeedbackTableProps {
  analyses: AnalysisRecord[];
  filters: DashboardFilters;
  availableTags: string[];
  totalCount: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onFiltersChange: (filters: DashboardFilters) => void;
  onEditReply: (id: string, reply: string) => Promise<void>;
}

interface ModalState {
  id: string;
  reply: string;
}

export function FeedbackTable({
  analyses,
  filters,
  availableTags,
  totalCount,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  onFiltersChange,
  onEditReply
}: FeedbackTableProps) {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyId, setCopyId] = useState<string | null>(null);

  const tagOptions = useMemo(() => Array.from(new Set(availableTags)).slice(0, 12), [availableTags]);

  const openModal = (analysis: AnalysisRecord) => {
    setModalState({ id: analysis.id, reply: analysis.suggestedReply ?? '' });
  };

  const closeModal = () => {
    setModalState(null);
    setIsSubmitting(false);
  };

  const handleCopy = async (reply: string, id: string) => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopyId(id);
      setTimeout(() => setCopyId(null), 2_000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const handleModalSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!modalState?.reply.trim()) return;
    try {
      setIsSubmitting(true);
      await onEditReply(modalState.id, modalState.reply.trim());
      closeModal();
    } catch (error) {
      console.error('Failed to update reply', error);
      setIsSubmitting(false);
    }
  };

  const updateFilters = (next: Partial<DashboardFilters>) => {
    onFiltersChange({
      ...filters,
      ...next
    });
  };

  const toggleTag = (tag: string) => {
    const current = new Set(filters.tags);
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    updateFilters({ tags: Array.from(current) });
  };

  if (!isLoading && analyses.length === 0) {
    return (
      <EmptyState
        title="No feedback matches these filters"
        description="Try adjusting the sentiment, tag, or date filters to expand your results."
      />
    );
  }

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'flex-end'
        }}
      >
        <div style={{ minWidth: '180px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sentiment</label>
          <select
            className="select"
            value={filters.sentiment}
            onChange={(event) => updateFilters({ sentiment: event.target.value as DashboardFilters['sentiment'] })}
          >
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        <div style={{ minWidth: '220px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Start date</label>
          <input
            className="input"
            type="date"
            value={filters.startDate ?? ''}
            onChange={(event) => updateFilters({ startDate: event.target.value || null })}
          />
        </div>

        <div style={{ minWidth: '220px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>End date</label>
          <input
            className="input"
            type="date"
            value={filters.endDate ?? ''}
            onChange={(event) => updateFilters({ endDate: event.target.value || null })}
          />
        </div>

        {tagOptions.length ? (
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tags</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem'
              }}
            >
              {tagOptions.map((tag) => {
                const isActive = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="button"
                    style={{
                      background: isActive ? 'var(--accent-color)' : '#e2e8f0',
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      padding: '0.35rem 0.75rem'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="button secondary"
          onClick={() =>
            onFiltersChange({ sentiment: 'all', tags: [], startDate: null, endDate: null })
          }
        >
          Reset filters
        </button>
      </div>

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Showing {analyses.length} of {totalCount} feedback items
      </div>

      {isLoading ? (
        <div style={{ marginBottom: '1rem' }}>
          <div className="skeleton" style={{ height: '1.25rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '1.25rem', marginBottom: '0.5rem' }} />
        </div>
      ) : null}

      <div style={{ overflowX: 'auto', opacity: isLoading ? 0.65 : 1 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Feedback</th>
              <th>Sentiment</th>
              <th style={{ minWidth: '160px' }}>Tags</th>
              <th style={{ minWidth: '160px' }}>Pain points</th>
              <th style={{ minWidth: '160px' }}>Created</th>
              <th style={{ minWidth: '200px' }}>Suggested reply</th>
              <th style={{ minWidth: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis) => (
              <tr key={analysis.id}>
                <td>{analysis.feedback}</td>
                <td>
                  <span className={`badge ${analysis.sentiment}`}>{analysis.sentiment}</span>
                </td>
                <td>{analysis.tags.join(', ') || '—'}</td>
                <td>{analysis.painPoints.join(', ') || '—'}</td>
                <td>{new Date(analysis.createdAt).toLocaleString()}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{analysis.suggestedReply ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => handleCopy(analysis.suggestedReply ?? '', analysis.id)}
                      disabled={!analysis.suggestedReply}
                    >
                      {copyId === analysis.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button className="button secondary" type="button" onClick={() => openModal(analysis)}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {isFetchingMore ? 'Loading more feedback…' : hasMore ? 'More feedback available' : 'End of results'}
        </div>
        {hasMore ? (
          <button className="button primary" type="button" onClick={onLoadMore} disabled={isFetchingMore}>
            Load more
          </button>
        ) : null}
      </div>

      {modalState ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleModalSubmit}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Edit suggested reply</h3>
            <textarea
              rows={6}
              value={modalState.reply}
              onChange={(event) => setModalState({ ...modalState, reply: event.target.value })}
              className="input"
              style={{ resize: 'vertical', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="button secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save reply'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
