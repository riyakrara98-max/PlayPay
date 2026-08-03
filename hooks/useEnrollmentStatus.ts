'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';

export interface UseEnrollmentStatusResult {
  isEnrolled: boolean;
  enrollment: EnrollmentDocument | null;
  loading: boolean;
  error: string | null;
}

export function useEnrollmentStatus(taskId: string): UseEnrollmentStatusResult {
  const { currentUser } = useAuthContext();
  const [enrollment, setEnrollment] = useState<EnrollmentDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId || !currentUser?.uid || !isFirebaseConfigured()) {
      queueMicrotask(() => {
        setEnrollment(null);
        setLoading(false);
        setError(null);
      });
      return;
    }

    const enrollmentId = `${taskId}_${currentUser.uid}`;
    let unsubscribe = () => {};

    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);

      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setEnrollment({
              id: snap.id,
              ...snap.data(),
            } as EnrollmentDocument);
          } else {
            setEnrollment(null);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useEnrollmentStatus] Error:', err);
          setError(err.message || 'Failed to check enrollment status.');
          setLoading(false);
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error connecting to Firestore.';
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [taskId, currentUser?.uid]);

  return {
    isEnrolled: Boolean(enrollment),
    enrollment,
    loading,
    error,
  };
}
