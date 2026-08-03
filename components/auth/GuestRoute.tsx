'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface GuestRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route protection wrapper requiring an unauthenticated guest session.
 */
export function GuestRoute({
  children,
  fallback = null,
  redirectTo = '/dashboard',
}: GuestRouteProps) {
  const { currentUser, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && currentUser) {
      router.push(redirectTo);
    }
  }, [currentUser, loading, initialized, router, redirectTo]);

  if (!initialized || loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (currentUser) {
    return null;
  }

  return <>{children}</>;
}
