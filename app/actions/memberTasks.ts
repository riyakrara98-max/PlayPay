'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { TaskDocument, LeaderTaskAssignmentDocument } from '@/types/firestore';
import { isTaskAvailable } from '@/lib/taskAvailability';
import { resolveTaskReward } from '@/lib/reward-resolution';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function getResolvedTasksForMember(leaderId: string | null | undefined): Promise<TaskDocument[]> {
  try {
    const db = getAdminDb();
    
    // 1. Fetch active tasks
    const tasksSnapshot = await db.collection('tasks')
      .where('status', '==', 'active')
      .get();
      
    const allActiveTasks: TaskDocument[] = [];
    tasksSnapshot.forEach((doc: QueryDocumentSnapshot) => {
      allActiveTasks.push({ id: doc.id, ...doc.data() } as TaskDocument);
    });
    
    // 2. Fetch leader assignments if member belongs to a leader
    let leaderAssignments: LeaderTaskAssignmentDocument[] = [];
    if (leaderId) {
      const assignmentsSnap = await db.collection('leaderTaskAssignments')
        .where('leaderId', '==', leaderId)
        .get();
        
      assignmentsSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data() as Omit<LeaderTaskAssignmentDocument, 'id'>;
        const isActive = data.assignmentStatus === 'active' || (!data.assignmentStatus && data.status !== 'inactive');
        if (isActive) {
          leaderAssignments.push({ id: doc.id, ...data });
        }
      });
    }
    
    const resolvedTasks: TaskDocument[] = [];
    
    for (const task of allActiveTasks) {
      const isGlobal = !task.assignmentType || task.assignmentType === 'all';
      let assignedToLeader = false;
      let leaderReward: number | null = null;
      let assignmentDocId: string | undefined;
      
      if (task.assignmentType === 'leaders' && leaderId) {
        if (task.assignedLeaderIds?.includes(leaderId)) {
          const assignment = leaderAssignments.find(a => a.taskId === task.id);
          if (assignment) {
            assignedToLeader = true;
            leaderReward = assignment.leaderReward !== undefined ? assignment.leaderReward : null;
            assignmentDocId = assignment.id;
          }
        }
      }
      
      if (isGlobal || assignedToLeader) {
        if (isTaskAvailable(task)) {
          // Resolve reward
          let baseReward = task.baseReward ?? task.rewardAmount ?? 0;
          let leaderRewardAmount: number | null = null;
          
          if (assignedToLeader && leaderReward !== null) {
              leaderRewardAmount = leaderReward;
          }
          
          // Let's create a fake assignment to pass to the helper if needed
          const assignmentObj = assignedToLeader ? { leaderReward: leaderReward } as LeaderTaskAssignmentDocument : null;
          let resolvedReward = resolveTaskReward(task, assignmentObj);
          
          // Clone the task and hide sensitive info
          const safeTask: any = { ...task };
          safeTask.rewardAmount = resolvedReward;
          delete safeTask.baseReward;
          delete safeTask.assignedLeaderIds;
          delete safeTask.assignmentType;
          
          safeTask._resolvedLeaderRewardAmount = leaderRewardAmount;
          safeTask._resolvedAssignmentId = assignmentDocId;
          safeTask._resolvedBaseReward = baseReward;
          
          resolvedTasks.push(safeTask as TaskDocument);
        }
      }
    }
    
    return resolvedTasks;
  } catch (error) {
    console.error('getResolvedTasksForMember error:', error);
    return [];
  }
}
