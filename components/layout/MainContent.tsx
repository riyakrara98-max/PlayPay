'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface MainContentProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  hasBottomNav?: boolean;
}

export function MainContent({
  children,
  className,
  hasBottomNav = true,
  ...props
}: MainContentProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        'flex-1 w-full focus:outline-none transition-all',
        hasBottomNav && 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
