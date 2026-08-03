'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  padded?: boolean;
}

export function PageContainer({
  children,
  size = 'xl',
  className,
  padded = true,
  ...props
}: PageContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto transition-all',
        sizeClasses[size],
        padded && 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
