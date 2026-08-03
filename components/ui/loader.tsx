'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './spinner';
import { ComponentSize } from '@/types/ui';

export interface LoaderProps {
  size?: ComponentSize | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loader({
  size = 'lg',
  text,
  fullScreen = false,
  className,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm p-4 text-center">
        <Spinner size={size} variant="primary" />
        {text && (
          <p className="mt-3 text-sm font-semibold text-[var(--text-primary)] animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center w-full', className)}>
      <Spinner size={size} variant="primary" />
      {text && (
        <p className="mt-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
          {text}
        </p>
      )}
    </div>
  );
}
