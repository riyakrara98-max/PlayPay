'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseDb } from '@/firebase/config';
import { EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { logFirestoreError, OperationType } from '@/lib/firebase-errors';

export interface ProfileStats {
  tasksCompleted: number;
  approvedTasks: number;
  rejectedTasks: number;
  weeklyStreak: number;
}

export interface UseProfileStatsReturn {
  stats: ProfileStats;
  loading: boolean;
  error: string | null;
}

export function useProfileStats(): UseProfileStatsReturn {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      queueMicrotask(() => {
        setEnrollments([]);
        setLoading(false);
      });
      return;
    }

    const db = getFirebaseDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EnrollmentDocument[];
        setEnrollments(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useProfileStats Error]', err);
        setError('Failed to fetch profile stats from Firestore.');
        setLoading(false);
        logFirestoreError(
          err,
          OperationType.LIST,
          FIRESTORE_COLLECTIONS.ENROLLMENTS
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Compute calculated metrics directly from real Firestore data
  const stats = useMemo<ProfileStats>(() => {
    let completed = 0;
    let approved = 0;
    let rejected = 0;
    const submissionDates = new Set<string>();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    enrollments.forEach((e) => {
      if (e.status === 'approved') {
        approved++;
        completed++;
      } else if (e.status === 'rejected') {
        rejected++;
        if (e.submittedAt) completed++;
      } else if (e.submittedAt) {
        completed++;
      }

      // Track streak days for past 7 days
      if (e.submittedAt) {
        const subDate = new Date(e.submittedAt);
        if (subDate >= sevenDaysAgo) {
          const dateStr = subDate.toISOString().split('T')[0];
          submissionDates.add(dateStr);
        }
      }
    });

    return {
      tasksCompleted: completed,
      approvedTasks: approved,
      rejectedTasks: rejected,
      weeklyStreak: Math.min(7, submissionDates.size),
    };
  }, [enrollments]);

  return {
    stats,
    loading,
    error,
  };
}
