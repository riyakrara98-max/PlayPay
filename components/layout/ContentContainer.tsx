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
    card: 'bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-lg)] p-6 md:p-8 shadow-sm',
    elevated: 'bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[var(--radius-lg)] p-6 md:p-8 shadow-md',
    glass: 'bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--hairline)] rounded-[var(--radius-lg)] p-6 md:p-8',
  };

  return (
    <div className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}
