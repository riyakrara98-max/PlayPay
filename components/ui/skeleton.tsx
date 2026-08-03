'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  if (lines > 1 && variant === 'text') {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-[var(--surface-elevated)] rounded-[var(--radius-sm)] h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full',
              className
            )}
            style={style}
            {...props}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4 w-full rounded-[var(--radius-sm)]',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-[var(--radius-md)] w-full h-24',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--surface-elevated)] border border-[var(--border)]/50',
        variantClasses[variant],
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
}
