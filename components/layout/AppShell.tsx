'use client';

import React from 'react';
import { MainContent } from './MainContent';
import { SafeAreaContainer } from './SafeAreaContainer';
import { cn } from '@/utils/cn';

interface AppShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
  hasBottomNav?: boolean;
}

export function AppShell({
  header,
  children,
  footer,
  bottomNav,
  className,
  hasBottomNav = true,
}: AppShellProps) {
  return (
    <SafeAreaContainer className={cn('min-h-screen flex flex-col bg-[var(--bg)]', className)}>
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-[var(--primary-fg)] focus:rounded-[var(--radius-md)] focus:shadow-md font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Header Slot */}
      {header}

      {/* Main Content Body */}
      <MainContent hasBottomNav={hasBottomNav}>{children}</MainContent>

      {/* Optional Footer Slot */}
      {footer}

      {/* Mobile Bottom Nav Slot */}
      {bottomNav}
    </SafeAreaContainer>
  );
}
