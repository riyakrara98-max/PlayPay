'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as unknown as T)
          );
          setData(items);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          handleFirestoreError(err, OperationType.LIST, collectionName);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [collectionName, constraints]);

  return { data, loading, error };
}
