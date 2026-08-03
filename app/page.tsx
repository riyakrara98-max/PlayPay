'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { PublicDashboard } from '@/components/dashboard/PublicDashboard';

export default function RootHomePage() {
  return (
    <AppShell header={<TopNav />} bottomNav={<BottomNav />}>
      <PublicDashboard />
    </AppShell>
  );
}
