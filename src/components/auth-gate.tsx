'use client';

import { ReactNode } from 'react';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-center text-subtle">
        <h1 className="text-2xl font-heading text-ink">You need to sign in</h1>
        <p className="max-w-sm text-sm">
          Authentication for the FeedbackFlow dashboard is not yet connected. Configure your auth provider to continue.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-brand-light/60 bg-brand-light/40 px-4 py-3 text-sm text-brand-dark">
        The authentication layer is currently mocked. Replace AuthGate with your provider integration to secure this
        experience.
      </div>
      {children}
    </>
  );
}
