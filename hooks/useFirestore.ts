'use client';

import { useState, useCallback } from 'react';
import { DocumentData, QueryConstraint, SetOptions } from 'firebase/firestore';
import {
  getTypedDocument,
  setTypedDocument,
  updateTypedDocument,
  deleteTypedDocument,
  getTypedCollection,
} from '@/lib/firestore-helpers';

export function useFirestore<T = DocumentData>(collectionName: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getDocById = useCallback(
    async (docId: string): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTypedDocument<T>(collectionName, docId);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const setDocById = useCallback(
    async (docId: string, data: DocumentData, options?: SetOptions): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await setTypedDocument(collectionName, docId, data, options);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const updateDocById = useCallback(
    async (docId: string, data: Partial<DocumentData>): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await updateTypedDocument(collectionName, docId, data);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const deleteDocById = useCallback(
    async (docId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await deleteTypedDocument(collectionName, docId);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const queryCollection = useCallback(
    async (...constraints: QueryConstraint[]): Promise<T[]> => {
      setLoading(true);
      setError(null);
      try {
        const results = await getTypedCollection<T>(collectionName, ...constraints);
        return results;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    loading,
    error,
    getDocById,
    setDocById,
    updateDocById,
    deleteDocById,
    queryCollection,
  };
}
