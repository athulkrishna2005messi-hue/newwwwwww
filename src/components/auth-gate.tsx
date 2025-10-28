'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

import EmptyState from '@/components/common/EmptyState';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return (
      <EmptyState
        className="w-full bg-canvas"
        title="Sign in required"
        description="Authentication for the FeedbackFlow dashboard is not yet connected. Configure your auth provider to continue."
        primaryAction={
          <Link
            href="/"
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
          >
            Return to marketing site
          </Link>
        }
        secondaryAction={
          <Link
            href="mailto:hello@feedbackflow.io"
            className="text-sm font-medium text-brand-dark underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
          >
            Contact support
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div
        aria-live="polite"
        className="rounded-lg border border-brand-light/60 bg-brand-light/40 px-4 py-3 text-sm text-brand-dark"
      >
        The authentication layer is currently mocked. Replace AuthGate with your provider integration to secure this
        experience.
      </div>
      {children}
    </>
  );
}
