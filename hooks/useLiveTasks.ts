'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { TaskDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export function useLiveTasks() {
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setLoading(false);
        setError('Firebase is not configured.');
      });
      return;
    }

    let unsubscribe = () => {};

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.TASKS);
      
      // Query for active status
      const q = query(colRef, where('status', '==', 'active'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: TaskDocument[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
            } as TaskDocument;
          });

          // Sort client side to guarantee newest first
          list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });

          setTasks(list);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Realtime tasks listener error:', err);
          setError(err.message || 'Failed to sync live tasks.');
          setLoading(false);
          handleFirestoreError(err, OperationType.LIST, FIRESTORE_COLLECTIONS.TASKS);
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to Firestore.';
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [reloadKey]);

  return { tasks, loading, error, refetch };
}
