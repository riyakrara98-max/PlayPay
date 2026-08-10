'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowGuestForRoutes?: string[];
}

/**
 * Route protection wrapper requiring an authenticated user session.
 */
export function ProtectedRoute({
  children,
  fallback = null,
  redirectTo = '/login',
  allowGuestForRoutes = [],
}: ProtectedRouteProps) {
  const { currentUser, userProfile, loading, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = Boolean(currentUser || userProfile);
  const isGuestAllowed = allowGuestForRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated && !isGuestAllowed) {
      router.push(redirectTo);
    }
  }, [currentUser, userProfile, isAuthenticated, loading, initialized, router, redirectTo, isGuestAllowed]);

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

  if (!isAuthenticated && !isGuestAllowed) {
    return null;
  }

  return <>{children}</>;
}
