'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { cn } from '@/utils/cn';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showBreadcrumbs?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  showBreadcrumbs = true,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 pb-4 sm:pb-6', className)}>
      {showBreadcrumbs && <Breadcrumbs className="mb-1" />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </div>
  );
}
