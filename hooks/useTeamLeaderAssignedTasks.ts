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
    const isTeamLeader = userProfile?.memberType === 'team_leader' || (userProfile?.role as string) === 'team_leader';
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
          const assignmentMap = new Map<string, LeaderTaskAssignmentDocument>();
          const removedTaskIds = new Set<string>();

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as LeaderTaskAssignmentDocument;
            const isRemoved = data.assignmentStatus === 'removed' || data.status === 'inactive';
            if (isRemoved) {
              removedTaskIds.add(data.taskId);
            } else {
              assignmentMap.set(data.taskId, { ...data, id: docSnap.id });
            }
          });

          // Also fetch active tasks to ensure tasks assigned to 'all' or explicit assignedLeaderIds are included
          const tasksQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.TASKS),
            where('status', '==', 'active')
          );
          const tasksSnap = await getDocs(tasksQuery);

          const allRelevantTasks: TaskDocument[] = [];
          tasksSnap.forEach((tDoc) => {
            const tData = { id: tDoc.id, ...tDoc.data() } as TaskDocument;
            
            // Check if task is assigned to this leader
            const isGlobal = !tData.assignmentType || tData.assignmentType === 'all';
            const isExplicitlyAssigned = tData.assignmentType === 'leaders' && Array.isArray(tData.assignedLeaderIds) && tData.assignedLeaderIds.includes(currentUser.uid);
            const hasExistingAssignment = assignmentMap.has(tData.id);

            if (!removedTaskIds.has(tData.id) && (isGlobal || isExplicitlyAssigned || hasExistingAssignment)) {
              allRelevantTasks.push(tData);

              // If no assignment record exists in LEADER_TASK_ASSIGNMENTS yet, synthesize in-memory
              if (!hasExistingAssignment) {
                const newAssignmentId = `${tData.id}_${currentUser.uid}`;
                const newAssignment: LeaderTaskAssignmentDocument = {
                  id: newAssignmentId,
                  taskId: tData.id,
                  leaderId: currentUser.uid,
                  leaderReward: null,
                  assignmentStatus: 'active',
                  status: 'active',
                  assignedAt: tData.createdAt || new Date().toISOString(),
                  assignedBy: tData.createdBy || 'admin',
                  updatedAt: new Date().toISOString(),
                };

                assignmentMap.set(tData.id, newAssignment);
              }
            }
          });

          // Also include tasks that had assignments in snapshot if they weren't in the active tasksSnap query
          const missingAssignmentTaskIds = Array.from(assignmentMap.keys()).filter(
            (taskId) => !allRelevantTasks.some((t) => t.id === taskId)
          );

          if (missingAssignmentTaskIds.length > 0) {
            const chunkSize = 30;
            for (let i = 0; i < missingAssignmentTaskIds.length; i += chunkSize) {
              const chunk = missingAssignmentTaskIds.slice(i, i + chunkSize);
              const extraTasksQuery = query(
                collection(db, FIRESTORE_COLLECTIONS.TASKS),
                where(documentId(), 'in', chunk)
              );
              const extraSnap = await getDocs(extraTasksQuery);
              extraSnap.forEach((docSnap) => {
                allRelevantTasks.push({ id: docSnap.id, ...docSnap.data() } as TaskDocument);
              });
            }
          }

          const combined: AssignedTask[] = allRelevantTasks
            .map((task) => {
              const assignment = assignmentMap.get(task.id);
              if (!assignment) return null;
              return { assignment, task };
            })
            .filter((item): item is AssignedTask => item !== null);

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
