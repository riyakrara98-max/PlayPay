'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  isSidebarCollapsed?: boolean;
}

export function SidebarLayout({
  sidebar,
  children,
  header,
  className,
  isSidebarCollapsed = false,
}: SidebarLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-[var(--bg)] flex w-full relative', className)}>
      {/* Sidebar Slot */}
      {sidebar}

      {/* Main Container */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-200',
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        {/* Optional Header Slot */}
        {header}

        {/* Scrollable Main Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 w-full focus:outline-none pb-[env(safe-area-inset-bottom)] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
