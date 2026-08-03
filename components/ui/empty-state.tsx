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
        'flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] max-w-md mx-auto',
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--surface-elevated)] text-[var(--primary)] mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 max-w-xs">
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
