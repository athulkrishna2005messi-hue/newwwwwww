'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useFirebaseAuth, type UseFirebaseAuthValue } from '@/hooks/useFirebaseAuth';

const AuthContext = createContext<UseFirebaseAuthValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useFirebaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): UseFirebaseAuthValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
};
