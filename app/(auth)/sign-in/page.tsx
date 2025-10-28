'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSignInWithEmailLink } from 'firebase/auth';
import { useAuth } from '@/components/AuthProvider';
import { EMAIL_STORAGE_KEY } from '@/hooks/useFirebaseAuth';
import { getFirebaseAuth } from '@/lib/firebase/client';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    loading,
    error,
    signInWithEmailLink,
    completeEmailLinkSignIn,
    signInAnonymously,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'anonymous'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [awaitingEmailFromLink, setAwaitingEmailFromLink] = useState(false);

  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

  useEffect(() => {
    if (!loading && user) {
      const redirectTo = searchParams?.get('redirect') ?? '/';
      router.replace(redirectTo);
    }
  }, [loading, user, router, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      setAwaitingEmailFromLink(true);
      const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);

      if (storedEmail) {
        setStatus('verifying');
        completeEmailLinkSignIn(storedEmail, window.location.href)
          .then(() => {
            setMessage('Success! Redirecting you now…');
            router.replace(searchParams?.get('redirect') ?? '/');
          })
          .catch((signInError) => {
            setLocalError(signInError instanceof Error ? signInError.message : String(signInError));
            setStatus('idle');
          })
          .finally(() => {
            setAwaitingEmailFromLink(false);
          });
      }
    }
  }, [completeEmailLinkSignIn, firebaseAuth, router, searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!email) {
      setLocalError('Please provide your email address to continue.');
      return;
    }

    if (typeof window !== 'undefined' && isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      setStatus('verifying');
      try {
        await completeEmailLinkSignIn(email, window.location.href);
        setMessage('Success! Redirecting you now…');
        router.replace(searchParams?.get('redirect') ?? '/');
      } catch (signInError) {
        setLocalError(signInError instanceof Error ? signInError.message : String(signInError));
        setStatus('idle');
      }
      return;
    }

    setStatus('sending');
    try {
      const redirectOverride = searchParams?.get('redirect') ?? undefined;
      await signInWithEmailLink(email, redirectOverride);
      setMessage('Magic link sent! Check your inbox to finish signing in.');
      setStatus('sent');
      setAwaitingEmailFromLink(true);
    } catch (sendError) {
      setLocalError(sendError instanceof Error ? sendError.message : String(sendError));
      setStatus('idle');
    }
  };

  const handleAnonymousSignIn = async () => {
    setLocalError(null);
    setStatus('anonymous');

    try {
      await signInAnonymously();
      router.replace(searchParams?.get('redirect') ?? '/');
    } catch (anonError) {
      setLocalError(anonError instanceof Error ? anonError.message : String(anonError));
      setStatus('idle');
    }
  };

  return (
    <main className="full-screen-center">
      <form onSubmit={handleSubmit} className="form-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#f8fafc' }}>Sign in</h1>
          <p className="helper-text" style={{ margin: 0 }}>
            Use passwordless email link sign-in or continue anonymously while exploring the MVP.
          </p>
        </div>

        <label>
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="form-input"
            autoComplete="email"
            required={!awaitingEmailFromLink}
            disabled={status === 'sending' || status === 'verifying'}
          />
        </label>

        <button type="submit" className="button-primary" disabled={status === 'sending' || status === 'verifying'}>
          {status === 'sending'
            ? 'Sending magic link…'
            : status === 'verifying'
            ? 'Completing sign-in…'
            : 'Send magic link'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleAnonymousSignIn}
            className="button-secondary"
            disabled={status === 'anonymous'}
          >
            {status === 'anonymous' ? 'Signing in anonymously…' : 'Continue as guest'}
          </button>
          <p className="helper-text" style={{ margin: 0 }}>
            Anonymous sessions include default quotas and can be upgraded by completing the email
            link flow later.
          </p>
        </div>

        {(localError || error) && (
          <p className="alert alert-error">{localError ?? error}</p>
        )}

        {message && <p className="alert alert-success">{message}</p>}

        {awaitingEmailFromLink && !message && (
          <p className="helper-text" style={{ margin: 0 }}>
            We&apos;re waiting for you to click the email link. If you&apos;re already here from that link,
            re-enter your email above to finish signing in.
          </p>
        )}
      </form>
    </main>
  );
}
