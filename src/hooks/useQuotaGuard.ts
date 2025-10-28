'use client';

import { useCallback, useState } from 'react';

import { PipelineError } from '@/lib/pipeline/errors';

export interface QuotaGuardState {
  limit: number;
  usage: number;
  isQuotaExceeded: boolean;
  remaining: number;
  checkQuota: (count?: number) => void;
  registerUsage: (count?: number) => void;
  reset: () => void;
}

export const useQuotaGuard = (limit: number): QuotaGuardState => {
  const [usage, setUsage] = useState(0);
  const [isQuotaExceeded, setQuotaExceeded] = useState(false);

  const checkQuota = useCallback(
    (count = 1) => {
      if (limit <= 0) {
        throw new PipelineError('Monthly quota limit is not configured');
      }

      if (usage + count > limit) {
        setQuotaExceeded(true);
        throw new PipelineError('Monthly quota exceeded', {
          limit,
          usage,
          requested: count
        });
      }

      setQuotaExceeded(false);
    },
    [limit, usage]
  );

  const registerUsage = useCallback(
    (count = 1) => {
      setUsage((current) => {
        const next = current + count;
        if (next > limit) {
          setQuotaExceeded(true);
          return next;
        }
        setQuotaExceeded(false);
        return next;
      });
    },
    [limit]
  );

  const reset = useCallback(() => {
    setUsage(0);
    setQuotaExceeded(false);
  }, []);

  return {
    limit,
    usage,
    isQuotaExceeded,
    remaining: Math.max(limit - usage, 0),
    checkQuota,
    registerUsage,
    reset
  };
};
