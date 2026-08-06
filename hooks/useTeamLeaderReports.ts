'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { EnrollmentDocument, UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';

export function useTeamLeaderReports() {
  const { currentUser, userProfile, initialized, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<EnrollmentDocument[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, UserDocument>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isTeamLeader = userProfile?.memberType === 'team_leader' || userProfile?.role === 'team_leader';
    if (!initialized || authLoading || !currentUser || !isTeamLeader) {
      setSubmissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribeMembers = () => {};
    let unsubscribeEnrollments = () => {};

    try {
      const db = getFirebaseDb();

      // Step 1: Query members belonging ONLY to this team leader
      const usersQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.USERS),
        where('leaderId', '==', currentUser.uid)
      );

      unsubscribeMembers = onSnapshot(
        usersQuery,
        (userSnapshot) => {
          const map: Record<string, UserDocument> = {};
          const memberUids: string[] = [];

          userSnapshot.docs.forEach((docSnap) => {
            const memberData = {
              uid: docSnap.id,
              ...(docSnap.data() as Omit<UserDocument, 'uid'>),
            };
            map[docSnap.id] = memberData;
            memberUids.push(docSnap.id);
          });

          setMembersMap(map);

          // Step 2: Query enrollments created for this team leader
          const enrollmentsQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS),
            where('leaderId', '==', currentUser.uid)
          );

          unsubscribeEnrollments = onSnapshot(
            enrollmentsQuery,
            (enrollmentSnapshot) => {
              const docsMap = new Map<string, EnrollmentDocument>();

              enrollmentSnapshot.docs.forEach((eDoc) => {
                const data = eDoc.data() as Omit<EnrollmentDocument, 'id'>;
                docsMap.set(eDoc.id, { id: eDoc.id, ...data });
              });

              // Also ensure any member belonging to this team leader is included
              const resultList = Array.from(docsMap.values()).filter((e) => {
                return e.userId && (memberUids.includes(e.userId) || (e as any).leaderId === currentUser.uid);
              });

              setSubmissions(resultList);
              setLoading(false);
              setError(null);
            },
            (err) => {
              console.error('[useTeamLeaderReports enrollments error]', err);
              setError(err.message || 'Failed to load report data.');
              setLoading(false);
            }
          );
        },
        (err) => {
          console.error('[useTeamLeaderReports members error]', err);
          setError(err.message || 'Failed to fetch team members list.');
          setLoading(false);
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }

    return () => {
      unsubscribeMembers();
      unsubscribeEnrollments();
    };
  }, [initialized, authLoading, currentUser?.uid, userProfile?.memberType]);

  // Extract unique task titles for filtering dropdown
  const uniqueTasks = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      const title = s.taskTitle || s.appName;
      if (title) set.add(title);
    });
    return Array.from(set).sort();
  }, [submissions]);

  return { submissions, membersMap, uniqueTasks, loading, error };
}
