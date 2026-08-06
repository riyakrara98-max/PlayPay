'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center rounded-[var(--radius-lg)] max-w-lg mx-auto',
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-5">
          {icon}
        </div>
      )}
      <h4 className="text-[18px] font-medium text-[var(--ink)] mb-2 tracking-tight">{title}</h4>
      {description && (
        <p className="text-[14px] text-[var(--ink-mute)] leading-relaxed mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
