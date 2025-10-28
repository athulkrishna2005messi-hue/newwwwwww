'use client';

import { useMemo } from 'react';

import { usePipelineStore } from '@/state/pipelineStore';
import type { PipelineItemState } from '@/lib/pipeline/types';

const toList = (items: Record<string, PipelineItemState>) => Object.values(items);

export const ProcessingProgress = () => {
  const {
    items,
    status,
    rateLimitError,
    lastError,
    pause,
    resume,
    cancel,
    queueLength
  } = usePipelineStore((state) => ({
    items: state.items,
    status: state.status,
    rateLimitError: state.rateLimitError,
    lastError: state.lastError,
    pause: state.pause,
    resume: state.resume,
    cancel: state.cancel,
    queueLength: state.queue.length
  }));

  const { total, completed, failed, processing, pending } = useMemo(() => {
    const list = toList(items);
    const totalItems = list.length;
    const completedItems = list.filter((entry) => entry.status === 'completed').length;
    const failedItems = list.filter((entry) => entry.status === 'failed').length;
    const processingItems = list.filter((entry) => entry.status === 'processing');
    const pendingItems = list.filter((entry) => entry.status === 'pending').length;

    return {
      total: totalItems,
      completed: completedItems,
      failed: failedItems,
      processing: processingItems,
      pending: pendingItems
    };
  }, [items]);

  const progress = total ? Math.round((completed / total) * 100) : 0;
  const isPaused = status === 'paused';
  const isRunning = status === 'running';
  const showRateLimit = Boolean(rateLimitError);

  const handlePauseResume = () => {
    if (isRunning) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <section className="pipeline-progress" aria-live="polite">
      <header className="pipeline-progress__header">
        <h2>Processing pipeline</h2>
        <span className={`pipeline-progress__status pipeline-progress__status--${status}`}>
          {status === 'running' && 'Running'}
          {status === 'paused' && 'Paused'}
          {status === 'idle' && 'Idle'}
        </span>
      </header>

      <div className="pipeline-progress__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="pipeline-progress__bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <dl className="pipeline-progress__metrics">
        <div>
          <dt>Total</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{completed}</dd>
        </div>
        <div>
          <dt>Pending</dt>
          <dd>{pending}</dd>
        </div>
        <div>
          <dt>Queued</dt>
          <dd>{queueLength}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{failed}</dd>
        </div>
      </dl>

      {!!processing.length && (
        <div className="pipeline-progress__processing">
          <h3>Currently processing</h3>
          <ul>
            {processing.map((entry) => (
              <li key={entry.item.id}>{entry.item.text.slice(0, 60)}{entry.item.text.length > 60 ? '…' : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {failed > 0 && (
        <div className="pipeline-progress__errors" role="alert">
          <h3>Failed items</h3>
          <ul>
            {toList(items)
              .filter((entry) => entry.status === 'failed')
              .map((entry) => (
                <li key={entry.item.id}>
                  <strong>{entry.item.id}</strong>: {entry.error ?? 'Unknown error'}
                </li>
              ))}
          </ul>
        </div>
      )}

      {showRateLimit && (
        <div className="pipeline-progress__rate-limit" role="alert">
          <strong>Rate limit:</strong> {rateLimitError}
        </div>
      )}

      {lastError && !showRateLimit && (
        <div className="pipeline-progress__error" role="alert">
          {lastError}
        </div>
      )}

      <div className="pipeline-progress__actions">
        <button type="button" onClick={handlePauseResume}>
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button type="button" onClick={() => cancel()}>
          Cancel
        </button>
      </div>
    </section>
  );
};
