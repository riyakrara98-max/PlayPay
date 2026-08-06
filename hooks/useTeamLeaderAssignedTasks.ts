import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, documentId } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { LeaderTaskAssignmentDocument, TaskDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';

export interface AssignedTask {
  assignment: LeaderTaskAssignmentDocument;
  task: TaskDocument;
}

export function useTeamLeaderAssignedTasks() {
  const { currentUser, userProfile, initialized, loading: authLoading } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isTeamLeader = userProfile?.memberType === 'team_leader' || userProfile?.role === 'team_leader';
    if (!initialized || authLoading || !currentUser || !isTeamLeader) {
      setAssignedTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getFirebaseDb();
    const assignmentsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.LEADER_TASK_ASSIGNMENTS),
      where('leaderId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      assignmentsQuery,
      async (snapshot) => {
        try {
          const validAssignments: LeaderTaskAssignmentDocument[] = [];
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as LeaderTaskAssignmentDocument;
            // Backward compatibility: Treat missing assignmentStatus as active
            const isRemoved = data.assignmentStatus === 'removed' || data.status === 'inactive';
            const isPaused = data.assignmentStatus === 'paused';
            const isActive = data.assignmentStatus === 'active' || (!data.assignmentStatus && data.status !== 'inactive');
            
            if (isActive) {
              validAssignments.push({ ...data, id: docSnap.id });
            }
          });

          if (validAssignments.length === 0) {
            setAssignedTasks([]);
            setLoading(false);
            return;
          }

          // Fetch matching tasks
          // Firestore 'in' query supports up to 30 items. If a leader has more than 30 tasks, we need to chunk it.
          const taskIds = validAssignments.map((a) => a.taskId);
          
          const tasks: TaskDocument[] = [];
          
          // Chunking for 'in' query
          const chunkSize = 30;
          for (let i = 0; i < taskIds.length; i += chunkSize) {
            const chunk = taskIds.slice(i, i + chunkSize);
            const tasksQuery = query(
              collection(db, FIRESTORE_COLLECTIONS.TASKS),
              where(documentId(), 'in', chunk)
            );
            const tasksSnap = await getDocs(tasksQuery);
            tasksSnap.forEach((docSnap) => {
              tasks.push({ id: docSnap.id, ...docSnap.data() } as TaskDocument);
            });
          }

          const combined: AssignedTask[] = validAssignments.map(assignment => {
            const task = tasks.find(t => t.id === assignment.taskId);
            return { assignment, task: task! };
          }).filter(item => item.task); // Filter out any missing tasks just in case

          setAssignedTasks(combined);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('[useTeamLeaderAssignedTasks Error]', err);
          setError(err instanceof Error ? err.message : 'Failed to resolve tasks.');
          setLoading(false);
        }
      },
      (err) => {
        console.error('[useTeamLeaderAssignedTasks snapshot error]', err);
        setError(err.message || 'Failed to load assigned tasks.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [initialized, authLoading, currentUser?.uid, userProfile?.memberType]);

  return { assignedTasks, loading, error };
}
