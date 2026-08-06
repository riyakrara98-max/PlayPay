'use client';

import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { RefreshCw, SearchX, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

interface TaskEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onRefresh?: () => void;
}

export function TaskEmptyState({
  isFiltered = false,
  onResetFilters,
  onRefresh,
}: TaskEmptyStateProps) {
  const { userProfile } = useAuthContext();
  const isTeamMember = userProfile?.memberType === 'team_member';
  const hasLeader = !!userProfile?.leaderId;

  let title = 'No live tasks available right now.';
  let description = 'Check back soon! We are adding new high-reward campaigns and earning opportunities.';

  if (isFiltered) {
    title = 'No matching tasks found';
    description = 'Try adjusting your search keywords or filters to discover more.';
  } else if (isTeamMember && !hasLeader) {
    title = 'Tasks Not Available';
    description = "Your account is not linked to a Team Leader yet. Please contact your Team Leader or Administrator.";
  } else if (isTeamMember && hasLeader) {
    title = 'No Tasks Available';
    description = "Your Team Leader hasn't assigned any tasks yet.";
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-sm my-6 p-2">
      <EmptyState
        icon={isFiltered ? <SearchX className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        title={title}
        description={description}
        primaryAction={
          isFiltered && onResetFilters ? (
            <Button variant="primary" size="md" onClick={onResetFilters}>
              Reset Filters
            </Button>
          ) : undefined
        }
        secondaryAction={
          onRefresh ? (
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
