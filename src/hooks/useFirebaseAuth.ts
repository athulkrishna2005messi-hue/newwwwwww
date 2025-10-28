'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  ActionCodeSettings,
  browserLocalPersistence,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInAnonymously,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client';
import { DEFAULT_USER_QUOTAS, type UserDocument } from '@/types/firestore';

export interface UseFirebaseAuthValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signInWithEmailLink: (email: string, redirectUrl?: string) => Promise<void>;
  completeEmailLinkSignIn: (email: string, link?: string) => Promise<UserCredential>;
  signInAnonymously: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

export const EMAIL_STORAGE_KEY = 'firebaseEmailForSignIn';

const getRedirectUrl = (override?: string): string => {
  if (override) {
    return override;
  }

  const envRedirect = process.env.NEXT_PUBLIC_FIREBASE_EMAIL_LINK_REDIRECT;
  if (envRedirect) {
    return envRedirect;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/sign-in`;
  }

  throw new Error(
    'Unable to determine a redirect URL for Firebase email link sign-in. Set NEXT_PUBLIC_FIREBASE_EMAIL_LINK_REDIRECT.'
  );
};

const normalizeError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected authentication error occurred.';
};

const deriveAuthProvider = (user: User): UserDocument['authProvider'] => {
  if (user.isAnonymous) {
    return 'anonymous';
  }

  const providerId = user.providerData[0]?.providerId;
  if (providerId === 'password' || providerId === 'emailLink') {
    return 'passwordless';
  }

  if (providerId) {
    return 'oauth';
  }

  return 'custom';
};

export const useFirebaseAuth = (): UseFirebaseAuthValue => {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const db = useMemo(() => getFirebaseFirestore(), []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureUserDocument = useCallback(
    async (firebaseUser: User) => {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      const existingData = snapshot.exists() ? (snapshot.data() as UserDocument) : undefined;
      const timestamp = serverTimestamp();

      const payload: Partial<UserDocument> & Pick<UserDocument, 'uid'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? existingData?.email ?? null,
        displayName:
          firebaseUser.displayName ?? existingData?.displayName ?? firebaseUser.email ?? null,
        photoURL: firebaseUser.photoURL ?? existingData?.photoURL ?? null,
        plan: existingData?.plan ?? 'free',
        authProvider: deriveAuthProvider(firebaseUser),
        quotas: existingData?.quotas ?? { ...DEFAULT_USER_QUOTAS },
        updatedAt: timestamp,
      };

      if (!existingData?.createdAt) {
        payload.createdAt = timestamp;
      }

      await setDoc(userRef, payload, { merge: true });
    },
    [db]
  );

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((persistenceError) => {
      console.warn('Failed to set Firebase auth persistence to local storage.', persistenceError);
    });

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        try {
          await ensureUserDocument(nextUser);
          setError(null);
        } catch (profileError) {
          console.error('Failed to ensure Firestore user profile.', profileError);
          setError(normalizeError(profileError));
        }
      } else {
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [auth, ensureUserDocument]);

  const signInWithEmail = useCallback(
    async (email: string, redirectUrl?: string) => {
      try {
        setError(null);
        const actionCodeSettings: ActionCodeSettings = {
          url: getRedirectUrl(redirectUrl),
          handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email, actionCodeSettings);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
        }
      } catch (authError) {
        const message = normalizeError(authError);
        setError(message);
        throw authError;
      }
    },
    [auth]
  );

  const completeEmailLink = useCallback(
    async (email: string, link?: string) => {
      try {
        setError(null);
        const href = link ?? (typeof window !== 'undefined' ? window.location.href : undefined);
        if (!href) {
          throw new Error('Missing email link URL.');
        }

        const result = await signInWithEmailLink(auth, email, href);

        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(EMAIL_STORAGE_KEY);
        }

        return result;
      } catch (authError) {
        const message = normalizeError(authError);
        setError(message);
        throw authError;
      }
    },
    [auth]
  );

  const anonymousSignIn = useCallback(async () => {
    try {
      setError(null);
      return await signInAnonymously(auth);
    } catch (authError) {
      const message = normalizeError(authError);
      setError(message);
      throw authError;
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      }
    } catch (authError) {
      const message = normalizeError(authError);
      setError(message);
      throw authError;
    }
  }, [auth]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user && !user.isAnonymous),
    signInWithEmailLink: signInWithEmail,
    completeEmailLinkSignIn: completeEmailLink,
    signInAnonymously: anonymousSignIn,
    signOut,
  } satisfies UseFirebaseAuthValue;
};
