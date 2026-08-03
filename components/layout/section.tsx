'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-8 sm:py-12', className)} {...props}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 mt-2 sm:mt-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
