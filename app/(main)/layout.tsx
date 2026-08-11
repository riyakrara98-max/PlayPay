'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AdSlot } from '@/components/ads/AdSlot';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowGuestForRoutes={['/dashboard', '/how-it-works']}>
      <AppShell header={<TopNav />} bottomNav={<BottomNav />}>
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
          <div className="w-full max-w-7xl mx-auto px-4 mt-6">
            <AdSlot placement="desktop" />
            <AdSlot placement="mobile" />
          </div>
        </ErrorBoundary>
      </AppShell>
    </ProtectedRoute>
  );
}
