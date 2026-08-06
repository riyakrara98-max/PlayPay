import { useMemo } from 'react';
import { useTeamLeaderAssignedTasks } from './useTeamLeaderAssignedTasks';
import { useTeamLeaderReports } from './useTeamLeaderReports';
import { calculateTeamLeaderAnalytics } from '@/utils/teamLeaderAnalytics';

export function useTeamLeaderAnalytics() {
  const { 
    assignedTasks, 
    loading: tasksLoading, 
    error: tasksError 
  } = useTeamLeaderAssignedTasks();

  const { 
    submissions, 
    membersMap, 
    loading: reportsLoading, 
    error: reportsError 
  } = useTeamLeaderReports();

  const loading = tasksLoading || reportsLoading;
  const error = tasksError || reportsError;

  const analytics = useMemo(() => {
    if (loading || !assignedTasks || !submissions || !membersMap) {
      return null;
    }
    return calculateTeamLeaderAnalytics(assignedTasks, submissions, membersMap);
  }, [assignedTasks, submissions, membersMap, loading]);

  const defaultAnalytics = {
    metrics: {
      totalAssignedTasks: 0,
      activeAssignments: 0,
      configuredRewards: 0,
      pendingRewardConfiguration: 0,
      membersWorking: 0,
      pendingReview: 0,
      approvedSubmissions: 0,
      rejectedSubmissions: 0,
      paidSubmissions: 0,
      completionRate: 0,
      potentialPayout: 0,
      approvedCost: 0,
      paidCost: 0,
      outstandingLiability: 0,
    },
    taskAnalytics: [],
    rewardInsights: {
      configuredCount: 0,
      pendingCount: 0,
      averageReward: 0,
      highestReward: 0,
      lowestReward: 0,
    },
    recentActivity: []
  };

  return {
    loading,
    error,
    ...(analytics || defaultAnalytics)
  };
}
