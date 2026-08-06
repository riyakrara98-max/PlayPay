import { TaskDocument, LeaderTaskAssignmentDocument } from '@/types/firestore';

export function resolveTaskReward(
  task: TaskDocument,
  assignment?: LeaderTaskAssignmentDocument | null
): number {
  if (assignment && assignment.leaderReward !== undefined && assignment.leaderReward !== null) {
    return assignment.leaderReward;
  }
  
  if (task.baseReward !== undefined && task.baseReward !== null) {
    return task.baseReward;
  }
  
  return task.rewardAmount || 0;
}
