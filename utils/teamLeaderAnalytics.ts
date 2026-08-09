import { AssignedTask } from '@/hooks/useTeamLeaderAssignedTasks';
import { EnrollmentDocument, UserDocument } from '@/types/firestore';
import { getSafeTime } from '@/utils/formatters';

export interface TeamLeaderMetrics {
  totalAssignedTasks: number;
  activeAssignments: number;
  configuredRewards: number;
  pendingRewardConfiguration: number;
  membersWorking: number;
  pendingReview: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  paidSubmissions: number;
  completionRate: number;
  potentialPayout: number;
  approvedCost: number;
  paidCost: number;
  outstandingLiability: number;
}

export interface TaskAnalyticsItem {
  taskId: string;
  title: string;
  packageName: string;
  category: string;
  leaderReward: number | null;
  rewardConfigured: boolean;
  assignmentStatus: string;
  assignedAt: string;
  membersEnrolled: number;
  submitted: number;
  approved: number;
  rejected: number;
  paid: number;
  pending: number;
  completionPercent: number;
  remainingSlots: number;
  lastActivity: string | null;
}

export interface RewardInsights {
  configuredCount: number;
  pendingCount: number;
  averageReward: number;
  highestReward: number;
  lowestReward: number;
}

export interface ActivityItem {
  type: string;
  userId: string;
  userName: string;
  taskId: string;
  taskTitle: string;
  timestamp: string;
}

export function calculateTeamLeaderAnalytics(
  assignedTasks: AssignedTask[],
  submissions: EnrollmentDocument[],
  membersMap: Record<string, UserDocument>
) {
  const metrics: TeamLeaderMetrics = {
    totalAssignedTasks: 0,
    activeAssignments: 0,
    configuredRewards: 0,
    pendingRewardConfiguration: 0,
    membersWorking: Object.keys(membersMap).length, // Can also count distinct active users from enrollments
    pendingReview: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    paidSubmissions: 0,
    completionRate: 0,
    potentialPayout: 0,
    approvedCost: 0,
    paidCost: 0,
    outstandingLiability: 0,
  };

  const rewardInsights: RewardInsights = {
    configuredCount: 0,
    pendingCount: 0,
    averageReward: 0,
    highestReward: 0,
    lowestReward: 0,
  };

  const activityList: ActivityItem[] = [];
  const taskAnalytics: TaskAnalyticsItem[] = [];
  
  const activeMembersSet = new Set<string>();

  // Helper maps for submissions by task
  const enrollmentsByTask = new Map<string, EnrollmentDocument[]>();
  submissions.forEach(sub => {
    if (!enrollmentsByTask.has(sub.taskId)) {
      enrollmentsByTask.set(sub.taskId, []);
    }
    enrollmentsByTask.get(sub.taskId)!.push(sub);
    
    if (sub.userId) {
      activeMembersSet.add(sub.userId);
    }
    
    // Track metrics
    if (sub.status === 'pending') metrics.pendingReview++;
    if (sub.status === 'approved') metrics.approvedSubmissions++;
    if (sub.status === 'rejected') metrics.rejectedSubmissions++;
    if (sub.paymentStatus === 'paid') metrics.paidSubmissions++;

    // Add to activity list
    const timestamp = sub.submittedAt || sub.enrolledAt || '';
    if (timestamp) {
      let type = 'enrolled';
      if (sub.paymentStatus === 'paid') type = 'paid';
      else if (sub.status === 'approved') type = 'approved';
      else if (sub.status === 'rejected') type = 'rejected';
      else if (sub.submittedAt) type = 'submitted';
      
      activityList.push({
        type,
        userId: sub.userId,
        userName: sub.userName || 'Unknown User',
        taskId: sub.taskId,
        taskTitle: sub.taskTitle || 'Unknown Task',
        timestamp
      });
    }
  });
  
  metrics.membersWorking = activeMembersSet.size;

  let totalRewardSum = 0;
  let rewardCount = 0;
  let highestReward = 0;
  let lowestReward = Infinity;

  assignedTasks.forEach((assigned) => {
    const { task, assignment } = assigned;
    const enrollments = enrollmentsByTask.get(task.id) || [];
    
    metrics.totalAssignedTasks++;
    
    const assignmentStatus = assignment.assignmentStatus || 'active';
    if (assignmentStatus === 'active') {
      metrics.activeAssignments++;
    }
    
    const rewardConfigured = assignment.leaderReward !== null && assignment.leaderReward !== undefined;
    const leaderReward = assignment.leaderReward;
    
    if (rewardConfigured) {
      metrics.configuredRewards++;
      rewardInsights.configuredCount++;
      
      const rAmount = leaderReward as number;
      totalRewardSum += rAmount;
      rewardCount++;
      if (rAmount > highestReward) highestReward = rAmount;
      if (rAmount < lowestReward) lowestReward = rAmount;
      
    } else {
      metrics.pendingRewardConfiguration++;
      rewardInsights.pendingCount++;
    }
    
    // Task-specific counters
    let enrolled = enrollments.length;
    let submitted = 0;
    let approved = 0;
    let rejected = 0;
    let paid = 0;
    let pending = 0;
    
    let lastActivityTime = assignment.assignedAt || null;

    enrollments.forEach(e => {
      if (e.submittedAt) submitted++;
      if (e.status === 'approved') approved++;
      if (e.status === 'rejected') rejected++;
      if (e.status === 'pending') pending++;
      if (e.paymentStatus === 'paid') paid++;
      
      const actTime = e.submittedAt || e.enrolledAt;
      if (actTime && lastActivityTime) {
        if (getSafeTime(actTime) > getSafeTime(lastActivityTime)) {
          lastActivityTime = actTime;
        }
      } else if (actTime) {
        lastActivityTime = actTime;
      }
    });
    
    const completionPercent = enrolled > 0 ? (approved / enrolled) * 100 : 0;
    const remainingSlots = task.totalSlots ? Math.max(0, task.totalSlots - enrolled) : -1; // -1 for infinite
    
    taskAnalytics.push({
      taskId: task.id,
      title: task.title,
      packageName: task.packageName || '',
      category: task.category,
      leaderReward: leaderReward,
      rewardConfigured,
      assignmentStatus,
      assignedAt: assignment.assignedAt,
      membersEnrolled: enrolled,
      submitted,
      approved,
      rejected,
      paid,
      pending,
      completionPercent,
      remainingSlots,
      lastActivity: lastActivityTime
    });
    
    // Financial metrics per task
    // Note: use the *resolved* reward in the enrollment if available, otherwise fallback to assignment reward
    enrollments.forEach(e => {
      // The amount to pay the member
      const payoutAmount = e.leaderRewardAmount ?? e.rewardAmount ?? leaderReward ?? task.baseReward ?? task.rewardAmount ?? 0;
      
      if (e.status === 'approved') {
        metrics.approvedCost += payoutAmount;
        if (e.paymentStatus !== 'paid') {
          metrics.outstandingLiability += payoutAmount;
        }
      }
      
      if (e.paymentStatus === 'paid') {
        metrics.paidCost += payoutAmount;
      }
    });
    
    // Potential payout (assume remaining slots get filled and approved)
    // If infinite slots, just use enrolled members as potential
    const effectiveReward = leaderReward ?? task.baseReward ?? task.rewardAmount ?? 0;
    if (task.totalSlots && task.totalSlots > 0) {
      metrics.potentialPayout += task.totalSlots * effectiveReward;
    } else {
      metrics.potentialPayout += enrolled * effectiveReward; // Minimal potential
    }
  });
  
  if (rewardCount > 0) {
    rewardInsights.averageReward = totalRewardSum / rewardCount;
    rewardInsights.highestReward = highestReward;
    rewardInsights.lowestReward = lowestReward === Infinity ? 0 : lowestReward;
  }
  
  if (metrics.membersWorking > 0 && metrics.totalAssignedTasks > 0) {
     // Overall completion rate: (Total Approved / Total Enrolled)
     const totalEnrolled = submissions.length;
     metrics.completionRate = totalEnrolled > 0 ? (metrics.approvedSubmissions / totalEnrolled) * 100 : 0;
  }

  // Sort activity list newest first, keep top 20
  activityList.sort((a, b) => getSafeTime(b.timestamp) - getSafeTime(a.timestamp));
  const recentActivity = activityList.slice(0, 20);

  return {
    metrics,
    taskAnalytics,
    rewardInsights,
    recentActivity
  };
}
