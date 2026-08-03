'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route protection wrapper requiring an authenticated user with 'admin' role.
 */
export function AdminRoute({
  children,
  fallback = null,
  redirectTo = '/forbidden',
}: AdminRouteProps) {
  const { currentUser, userProfile, loading, initialized } = useAuth();
  const router = useRouter();

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (initialized && !loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push(redirectTo);
      }
    }
  }, [currentUser, userProfile, isAdmin, loading, initialized, router, redirectTo]);

  if (!initialized || loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!currentUser || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
