'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';

export interface UseEnrollmentStatusResult {
  isEnrolled: boolean;
  enrollment: EnrollmentDocument | null;
  loading: boolean;
  error: string | null;
}

// Module-level shared store to consolidate N+1 Firestore listeners into ONE listener per user
let activeUid: string | null = null;
let firestoreUnsub: (() => void) | null = null;
let enrollmentsMap = new Map<string, EnrollmentDocument>();
let storeLoading = true;
let storeError: string | null = null;
const subscribers = new Set<() => void>();
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function initUserEnrollmentsListener(uid: string) {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  if (activeUid === uid && firestoreUnsub) {
    return;
  }

  // Teardown existing listener if active user changed
  if (firestoreUnsub) {
    firestoreUnsub();
    firestoreUnsub = null;
  }

  activeUid = uid;
  storeLoading = true;
  storeError = null;
  enrollmentsMap = new Map();

  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS),
      where('userId', '==', uid)
    );

    firestoreUnsub = onSnapshot(
      q,
      (snap) => {
        const newMap = new Map<string, EnrollmentDocument>();
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const tid = data.taskId || data.lockedTaskId;
          if (tid) {
            newMap.set(tid, { id: docSnap.id, ...data } as EnrollmentDocument);
          }
        });
        enrollmentsMap = newMap;
        storeLoading = false;
        storeError = null;
        notifySubscribers();
      },
      (err) => {
        console.error('[useEnrollmentStatus] Firestore listener error:', err);
        storeError = err.message || 'Failed to fetch enrollment status.';
        storeLoading = false;
        notifySubscribers();
      }
    );
  } catch (err) {
    console.error('[useEnrollmentStatus] Failed to initialize listener:', err);
    storeError = err instanceof Error ? err.message : 'Error connecting to Firestore.';
    storeLoading = false;
    notifySubscribers();
  }
}

export function useEnrollmentStatus(taskId: string): UseEnrollmentStatusResult {
  const { currentUser } = useAuthContext();
  const uid = currentUser?.uid || null;

  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!uid) {
      return;
    }

    // Initialize shared listener for user
    initUserEnrollmentsListener(uid);

    // Subscribe to store updates
    const handleStoreChange = () => forceUpdate({});
    subscribers.add(handleStoreChange);

    return () => {
      subscribers.delete(handleStoreChange);

      if (subscribers.size === 0) {
        // Schedule cleanup after a delay to avoid tearing down during rapid route changes
        cleanupTimer = setTimeout(() => {
          if (subscribers.size === 0 && firestoreUnsub) {
            firestoreUnsub();
            firestoreUnsub = null;
            activeUid = null;
            enrollmentsMap = new Map();
          }
        }, 5000);
      }
    };
  }, [uid]);

  if (!taskId || !uid) {
    return {
      isEnrolled: false,
      enrollment: null,
      loading: false,
      error: null,
    };
  }

  const enrollment = enrollmentsMap.get(taskId) || null;

  return {
    isEnrolled: Boolean(enrollment),
    enrollment,
    loading: storeLoading,
    error: storeError,
  };
}
