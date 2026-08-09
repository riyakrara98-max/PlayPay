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
  const { currentUser, userProfile, loading, initialized } = useAuth();
  const router = useRouter();

  const isAuthenticated = Boolean(currentUser || userProfile);

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [currentUser, userProfile, isAuthenticated, loading, initialized, router, redirectTo]);

  if (!initialized || loading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app,#0f172a)] text-[var(--text-main,#f8fafc)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
