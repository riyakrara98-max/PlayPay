'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface TeamLeaderRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route protection wrapper requiring an authenticated user with 'team_leader' memberType.
 */
export function TeamLeaderRoute({
  children,
  fallback = null,
  redirectTo = '/team-leader/unauthorized',
}: TeamLeaderRouteProps) {
  const { currentUser, userProfile, loading, initialized } = useAuth();
  const router = useRouter();

  const isTeamLeader = userProfile?.memberType === 'team_leader';

  useEffect(() => {
    if (initialized && !loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!isTeamLeader) {
        router.push(redirectTo);
      }
    }
  }, [currentUser, userProfile, isTeamLeader, loading, initialized, router, redirectTo]);

  if (!initialized || loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!currentUser || !isTeamLeader) {
    return null;
  }

  return <>{children}</>;
}
