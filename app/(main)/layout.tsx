'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell header={<TopNav />} bottomNav={<BottomNav />}>
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </AppShell>
    </ProtectedRoute>
  );
}
