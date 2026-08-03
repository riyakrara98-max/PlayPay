'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface FloatingActionAreaProps {
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingActionArea({
  children,
  className,
  position = 'bottom-right',
}: FloatingActionAreaProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 md:bottom-8 right-4 sm:right-6',
    'bottom-left': 'bottom-20 md:bottom-8 left-4 sm:left-6',
    'bottom-center': 'bottom-20 md:bottom-8 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-30 flex items-center gap-3 transition-all',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}
