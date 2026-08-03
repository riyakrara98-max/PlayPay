'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: React.ReactNode;
}

export function Divider({
  orientation = 'horizontal',
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-[1px] self-stretch bg-[var(--border)] my-1 shrink-0', className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn('flex items-center w-full my-4', className)}
        {...props}
      >
        <div className="flex-1 h-[1px] bg-[var(--border)]" />
        <span className="px-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-[1px] bg-[var(--border)]" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('w-full h-[1px] bg-[var(--border)] my-4 shrink-0', className)}
      {...props}
    />
  );
}
