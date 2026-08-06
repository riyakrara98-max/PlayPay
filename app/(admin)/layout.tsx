'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminSidebar } from '@/components/navigation/AdminSidebar';
import { AdminTopBar } from '@/components/navigation/AdminTopBar';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Drawer } from '@/components/ui/drawer';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

function DashboardStatsListener({ onPendingCountChange }: { onPendingCountChange: (count: number) => void }) {
  const { stats } = useAdminDashboardData();
  useEffect(() => {
    onPendingCountChange(stats.pendingSubmissions);
  }, [stats.pendingSubmissions, onPendingCountChange]);
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardPage = pathname === '/admin' || pathname === '/admin/dashboard';
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playpay_admin_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  return (
    <AdminRoute>
      {isDashboardPage && <DashboardStatsListener onPendingCountChange={setPendingCount} />}
      <SidebarLayout
        isSidebarCollapsed={isCollapsed}
        sidebar={
          <AdminSidebar
            collapsed={isCollapsed}
            onToggleCollapse={setIsCollapsed}
            pendingSubmissionsCount={pendingCount}
          />
        }
        header={
          <AdminTopBar
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            pendingSubmissionsCount={pendingCount}
          />
        }
      >
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </SidebarLayout>

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        position="left"
        size="sm"
        title="Admin Navigation"
      >
        <AdminSidebar
          isMobile
          onItemClick={() => setIsMobileSidebarOpen(false)}
          pendingSubmissionsCount={pendingCount}
        />
      </Drawer>
    </AdminRoute>
  );
}
