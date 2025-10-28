'use client';

import { useEffect, useState } from 'react';

import { AppUser, getCurrentUser } from '@/lib/auth';
import { requestEmbedding } from '@/lib/embeddings/api';
import { rankByCosineSimilarity, SimilarityMatch } from '@/lib/embeddings/similarity';
import { KB_ENTRY_LIMIT, KbEntry, getKbEntries } from '@/services/kb';

interface UseKbMatchesOptions {
  top?: number;
}

export interface KbMatch extends SimilarityMatch<KbEntry> {}

export interface UseKbMatchesResult {
  matches: KbMatch[];
  entries: KbEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useKbMatches(feedbackText: string, options?: UseKbMatchesOptions): UseKbMatchesResult {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchesState, setMatchesState] = useState<KbMatch[]>([]);
  const [user] = useState<AppUser>(() => getCurrentUser());

  const top = options?.top ?? 3;

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      try {
        setLoadingEntries(true);
        const data = await getKbEntries(user.id, KB_ENTRY_LIMIT);
        if (!cancelled) {
          setEntries(data);
          setError(null);
        }
      } catch (error_) {
        if (!cancelled) {
          setError((error_ as Error).message || 'Failed to load knowledge base entries.');
        }
      } finally {
        if (!cancelled) {
          setLoadingEntries(false);
        }
      }
    }

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    const trimmed = feedbackText?.trim();

    if (!trimmed || trimmed.length < 4) {
      setMatchesState([]);
      setLoadingMatches(false);
      setError(null);
      return;
    }

    if (!entries.length) {
      setMatchesState([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function evaluate() {
      try {
        setLoadingMatches(true);
        const embedding = await requestEmbedding(trimmed, controller.signal);
        if (cancelled) {
          return;
        }

        const matches = rankByCosineSimilarity(
          embedding,
          entries.map((entry) => ({
            item: entry,
            embedding: entry.embedding,
          })),
          top
        );

        if (!cancelled) {
          setError(null);
          setMatchesState(matches);
        }
      } catch (error_) {
        if (!cancelled) {
          if ((error_ as Error).name !== 'AbortError') {
            setError((error_ as Error).message || 'Failed to compute knowledge base matches.');
            setMatchesState([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingMatches(false);
        }
      }
    }

    evaluate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [entries, feedbackText, top]);

  return {
    matches: matchesState,
    entries,
    isLoading: loadingEntries || loadingMatches,
    error,
  };
}
