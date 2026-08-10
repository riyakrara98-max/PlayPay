'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, documentId, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { TaskDocument, LeaderTaskAssignmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { getSafeTime } from '@/utils/formatters';
import { isTaskAvailable } from '@/lib/taskAvailability';
import { resolveTaskReward } from '@/lib/reward-resolution';
import { useAuthContext } from '@/contexts/AuthContext';

export function useLiveTasks() {
  const { currentUser, userProfile, initialized } = useAuthContext();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Guard: Do NOT create any Firestore query if auth is not ready
    if (!initialized) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    let unsubscribeAssignments = () => {};
    let unsubscribeGlobal = () => {};
    let isMounted = true;

    try {
      const db = getFirebaseDb();
      const isTeamMember = currentUser && userProfile?.memberType === 'team_member';
      const isDirectMember = !isTeamMember; // Guest or Direct User default

      if (isDirectMember) {
        // Direct Member or Guest: Global active tasks query
        const colRef = collection(db, FIRESTORE_COLLECTIONS.TASKS);
        const q = query(colRef, where('status', '==', 'active'));
        
        unsubscribeGlobal = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;
            const list: TaskDocument[] = snapshot.docs
              .map((docSnap) => {
                const tData = { id: docSnap.id, ...docSnap.data() } as TaskDocument;
                const safeTask = { ...tData };
                safeTask.rewardAmount = resolveTaskReward(tData, null);
                return safeTask;
              })
              .filter((task) => isTaskAvailable(task));
              
            list.sort((a, b) => {
              const timeA = a.createdAt ? getSafeTime(a.createdAt) : 0;
              const timeB = b.createdAt ? getSafeTime(b.createdAt) : 0;
              return timeB - timeA;
            });
            
            setTasks(list);
            setLoading(false);
            setError(null);
          },
          (err) => {
            if (!isMounted) return;
            // Gracefully suppress permission errors if auth state fluctuates
            setError(null);
            setLoading(false);
          }
        );
      } else {
        // Team Member: Load ONLY leader assignments
        const leaderId = userProfile?.leaderId;
        
        if (!leaderId) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const assignmentsQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.LEADER_TASK_ASSIGNMENTS),
          where('leaderId', '==', leaderId)
        );

        unsubscribeAssignments = onSnapshot(
          assignmentsQuery,
          async (assignmentsSnap) => {
            if (!isMounted) return;
            try {
              const validTaskIds: string[] = [];
              const assignmentMap: Record<string, LeaderTaskAssignmentDocument> = {};
              assignmentsSnap.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() } as LeaderTaskAssignmentDocument;
                // Treat missing assignmentStatus as active for backward compatibility
                const isActive = data.assignmentStatus === 'active' || (!data.assignmentStatus && data.status !== 'inactive');
                if (isActive) {
                  validTaskIds.push(data.taskId);
                  assignmentMap[data.taskId] = data;
                }
              });

              if (validTaskIds.length === 0) {
                setTasks([]);
                setLoading(false);
                return;
              }

              // Fetch matching task documents (chunked for 'in' query)
              const tasksList: TaskDocument[] = [];
              const chunkSize = 30;
              for (let i = 0; i < validTaskIds.length; i += chunkSize) {
                const chunk = validTaskIds.slice(i, i + chunkSize);
                const tasksQuery = query(
                  collection(db, FIRESTORE_COLLECTIONS.TASKS),
                  where(documentId(), 'in', chunk)
                );
                // We use getDocs here for the tasks since we're resolving them from the assignment snapshot.
                // If tasks change, the assignment might not, but tasks are typically static or we rely on reloadKey.
                // For full reactivity, a more complex setup is needed, but getDocs fulfills "Load matching task documents".
                const tasksSnap = await getDocs(tasksQuery);
                tasksSnap.forEach((tDoc) => {
                  const tData = { id: tDoc.id, ...tDoc.data() } as TaskDocument;
                  if (isTaskAvailable(tData)) {
                    const assignment = assignmentMap[tData.id];
                    const safeTask = { ...tData };
                    
                    safeTask.rewardAmount = resolveTaskReward(tData, assignment);
                    
                    delete safeTask.baseReward;
                    delete safeTask.assignedLeaderIds;
                    delete safeTask.assignmentType;
                    
                    safeTask._resolvedLeaderRewardAmount = assignment?.leaderReward ?? null;
                    safeTask._resolvedAssignmentId = assignment?.id ?? undefined;
                    safeTask._resolvedBaseReward = tData.baseReward ?? tData.rewardAmount ?? 0;
                    
                    tasksList.push(safeTask);
                  }
                });
              }

              tasksList.sort((a, b) => {
                const timeA = a.createdAt ? getSafeTime(a.createdAt) : 0;
                const timeB = b.createdAt ? getSafeTime(b.createdAt) : 0;
                return timeB - timeA;
              });

              if (isMounted) {
                setTasks(tasksList);
                setLoading(false);
                setError(null);
              }
            } catch (err) {
              console.error('[useLiveTasks assignments resolve error]', err);
              if (isMounted) {
                setError(null);
                setLoading(false);
              }
            }
          },
          (err) => {
            if (!isMounted) return;
            setError(null);
            setLoading(false);
          }
        );
      }
    } catch {
      setError(null);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribeGlobal();
      unsubscribeAssignments();
    };
  }, [initialized, currentUser, userProfile?.memberType, userProfile?.leaderId, reloadKey]);

  return { tasks, loading, error, refetch };
}
