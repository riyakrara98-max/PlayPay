'use client';

import { useMemo } from 'react';
import { useTeamLeaderReports } from '@/hooks/useTeamLeaderReports';

export function useTeamLeaderTasks() {
  const { submissions, membersMap, loading, error } = useTeamLeaderReports();

  // Calculated Stats
  const stats = useMemo(() => {
    const activeTasks = submissions.filter((s) => s.status !== 'rejected').length;
    const submitted = submissions.filter(
      (s) => s.status === 'pending' && (s.submittedAt || s.screenshotUrl || s.proofUrl)
    ).length;
    const underReview = submissions.filter((s) => s.status === 'pending').length;
    const completed = submissions.filter(
      (s) => s.status === 'approved' || s.paymentStatus === 'paid'
    ).length;

    return { activeTasks, submitted, underReview, completed };
  }, [submissions]);

  return { submissions, membersMap, stats, loading, error };
}
