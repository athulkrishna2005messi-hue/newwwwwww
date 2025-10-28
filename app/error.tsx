'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useErrorReporter } from '@/lib/monitoring/logger';

type ErrorComponentProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: ErrorComponentProps) {
  const monitoringTags = useMemo(() => ['global-error'], []);
  useErrorReporter(error, { component: 'root-boundary', tags: monitoringTags });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <div aria-live="assertive" role="alert" className="space-y-3">
        <h1 className="text-3xl font-heading text-ink sm:text-4xl">Something went wrong</h1>
        <p className="max-w-xl text-base leading-relaxed text-subtle">
          We logged the issue and will investigate. Try reloading the page or head back to the marketing site while we
          work on a fix.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-full border border-brand-dark px-5 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-light/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Go to home
        </Link>
      </div>
      <p className="text-xs text-subtle/80">Error reference: {error.digest ?? 'n/a'}</p>
    </div>
  );
}
