'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseDb } from '@/firebase/config';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export interface UseProfileReturn {
  profile: UserDocument | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export function useProfile(): UseProfileReturn {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof window !== 'undefined' ? !navigator.onLine : false
  );

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Realtime subscription to current user profile document
  useEffect(() => {
    if (!currentUser) {
      queueMicrotask(() => {
        setProfile(null);
        setLoading(false);
        setError(null);
      });
      return;
    }

    const db = getFirebaseDb();
    const docPath = `${FIRESTORE_COLLECTIONS.USERS}/${currentUser.uid}`;
    const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, currentUser.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserDocument);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useProfile Realtime Error]', err);
        setError('Failed to subscribe to realtime profile updates.');
        setLoading(false);
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return {
    profile,
    loading,
    error,
    isOffline,
  };
}
