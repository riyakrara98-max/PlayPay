'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'flat' | 'card' | 'elevated' | 'glass';
  className?: string;
}

export function ContentContainer({
  children,
  variant = 'card',
  className,
  ...props
}: ContentContainerProps) {
  const variantClasses = {
    flat: 'bg-transparent',
    card: 'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 sm:p-6 shadow-xs',
    elevated: 'bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 sm:p-6 shadow-sm',
    glass: 'bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-xl)] p-4 sm:p-6',
  };

  return (
    <div className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}
