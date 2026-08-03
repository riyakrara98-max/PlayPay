'use client';

import { useState, useCallback } from 'react';

export interface UseLoadingReturn<T = unknown> {
  loading: boolean;
  error: string | null;
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setError: (error: string | null) => void;
}

export function useLoading<T = unknown>(initialState = false): UseLoadingReturn<T> {
  const [loading, setLoading] = useState<boolean>(initialState);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
    setError,
  };
}
