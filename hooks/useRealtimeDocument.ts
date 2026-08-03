'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export function useRealtimeDocument<T>(collectionName: string, docId: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(docId && isFirebaseConfigured()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId || !isFirebaseConfigured()) return;

    const path = `${collectionName}/${docId}`;

    try {
      const db = getFirebaseDb();
      const docRef = doc(db, collectionName, docId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, path);
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
  }, [collectionName, docId]);

  return { data, loading, error };
}
