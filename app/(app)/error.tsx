'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import EmptyState from '@/components/common/EmptyState';
import { useErrorReporter } from '@/lib/monitoring/logger';

type ErrorComponentProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppShellError({ error, reset }: ErrorComponentProps) {
  const monitoringTags = useMemo(() => ['dashboard'], []);
  useErrorReporter(error, { component: 'app-shell', tags: monitoringTags });

  return (
    <EmptyState
      role="alert"
      title="We hit a snag"
      description="An unexpected error prevented the dashboard from rendering. Please try again or contact the team if the issue persists."
      primaryAction={
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Try again
        </button>
      }
      secondaryAction={
        <Link
          href="mailto:hello@feedbackflow.io"
          className="text-sm font-medium text-brand-dark underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Contact support
        </Link>
      }
      className="bg-canvas"
    />
  );
}
