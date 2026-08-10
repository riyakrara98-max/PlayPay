'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { logFirestoreError, OperationType } from '@/lib/firebase-errors';
import { safeSerializeValue } from '@/lib/audit-logger';

function serializeConstraints(constraints: QueryConstraint[]): string {
  if (!constraints || constraints.length === 0) return '';
  try {
    return constraints
      .map((c: any) => {
        const type = c.type || 'constraint';
        const field = c._field?.path || c.fieldPath || '';
        const op = c._op || c.op || '';
        const val = c._value !== undefined ? c._value : c.value !== undefined ? c.value : '';
        return `${type}_${field}_${op}_${String(val)}`;
      })
      .join('|');
  } catch {
    return constraints.map((c: any) => c.type || 'constraint').join('-');
  }
}

export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const constraintsKey = serializeConstraints(constraints);
  const constraintsRef = useRef(constraints);

  if (serializeConstraints(constraintsRef.current) !== constraintsKey) {
    constraintsRef.current = constraints;
  }

  useEffect(() => {
    try {
      const db = getFirebaseDb();
      const colRef = collection(db, collectionName);
      const activeConstraints = constraintsRef.current;
      const q = activeConstraints.length > 0 ? query(colRef, ...activeConstraints) : colRef;

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
          logFirestoreError(err, OperationType.LIST, collectionName);
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
  }, [collectionName, constraintsKey]);

  return { data, loading, error };
}


