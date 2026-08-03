'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SafeAreaContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
}

export function SafeAreaContainer({
  children,
  className,
  top = true,
  bottom = true,
  ...props
}: SafeAreaContainerProps) {
  return (
    <div
      className={cn(
        top && 'pt-[env(safe-area-inset-top)]',
        bottom && 'pb-[env(safe-area-inset-bottom)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
