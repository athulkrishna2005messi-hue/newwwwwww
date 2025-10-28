import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
  ariaLive?: 'polite' | 'assertive';
}

export default function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className = '',
  role = 'status',
  ariaLive,
}: EmptyStateProps) {
  const classes = [
    'flex flex-col items-center justify-center gap-4',
    'rounded-2xl border border-brand-light/60 bg-white px-8 py-12 text-center shadow-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const liveRegion = ariaLive ?? (role === 'alert' ? 'assertive' : 'polite');

  return (
    <section aria-live={liveRegion} role={role} className={classes}>
      {icon ? <div aria-hidden className="text-3xl text-brand-dark">{icon}</div> : null}
      <div className="space-y-2">
        <h2 className="text-xl font-heading text-ink sm:text-2xl">{title}</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-subtle">{description}</p>
      </div>
      {primaryAction || secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
