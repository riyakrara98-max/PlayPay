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
    <div className={cn('flex flex-col gap-4 pb-6 md:pb-8', className)}>
      {showBreadcrumbs && <Breadcrumbs className="mb-2" />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] md:text-[32px] font-display font-medium tracking-tight text-[var(--ink)] leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[16px] text-[var(--ink-mute)] leading-snug max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">{action}</div>}
      </div>
    </div>
  );
}
