'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';

export function useTeamLeaderMembers() {
  const { currentUser, userProfile, initialized, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isTeamLeader = userProfile?.memberType === 'team_leader' || userProfile?.role === 'team_leader';
    if (!initialized || authLoading || !currentUser || !isTeamLeader) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe = () => {};

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      // Query ONLY members where leaderId == currentUser.uid
      const q = query(colRef, where('leaderId', '==', currentUser.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: UserDocument[] = snapshot.docs.map((docSnap) => ({
            uid: docSnap.id,
            ...(docSnap.data() as Omit<UserDocument, 'uid'>),
          }));
          setMembers(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useTeamLeaderMembers Error]', err);
          setError(err.message || 'Failed to fetch team members.');
          setLoading(false);
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [initialized, authLoading, currentUser?.uid, userProfile?.memberType]);

  // Summary counts
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.isActive && !m.isBanned).length;
    const pending = members.filter((m) => m.memberType === 'pending').length;
    return { total, active, pending };
  }, [members]);

  return { members, stats, loading, error };
}
