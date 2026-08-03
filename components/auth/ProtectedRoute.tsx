'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route protection wrapper requiring an authenticated user session.
 */
export function ProtectedRoute({
  children,
  fallback = null,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { currentUser, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !currentUser) {
      router.push(redirectTo);
    }
  }, [currentUser, loading, initialized, router, redirectTo]);

  if (!initialized || loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
