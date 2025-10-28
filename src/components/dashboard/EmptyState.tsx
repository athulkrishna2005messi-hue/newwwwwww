import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
