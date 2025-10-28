'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <main className="full-screen-center">
        <p>Loading your workspace…</p>
      </main>
    );
  }

  return (
    <main className="full-screen-center">
      <h1 style={{ fontSize: '2.25rem', fontWeight: 600 }}>Firebase Core Demo</h1>
      <p style={{ maxWidth: '32rem', lineHeight: 1.6, color: 'rgba(226, 232, 240, 0.85)' }}>
        Authentication state is managed globally via the <code>AuthProvider</code>. Sign in with a
        passwordless email link or continue anonymously to see how Firestore profiles are provisioned
        with default quotas.
      </p>

      {user ? (
        <div className="card">
          <p style={{ margin: 0 }}>
            Signed in as <strong>{user.email ?? 'Anonymous user'}</strong>
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(226, 232, 240, 0.75)' }}>
            UID: {user.uid}
          </p>
          <button type="button" onClick={signOut} className="button-primary">
            Sign out
          </button>
        </div>
      ) : (
        <div className="card">
          <p style={{ margin: 0 }}>
            You&apos;re browsing anonymously. Sign in to retain your data across devices.
          </p>
          <Link href="/sign-in" className="button-primary">
            Sign in with email link
          </Link>
        </div>
      )}
    </main>
  );
}
