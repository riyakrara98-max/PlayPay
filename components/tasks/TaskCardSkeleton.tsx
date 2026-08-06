'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 shadow-2xs flex items-center justify-between gap-4 min-h-[88px]">
      {/* Icon Skeleton */}
      <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--radius-md)] shrink-0" />

      {/* Info Skeleton */}
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-4 w-1/2 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-3 w-3/4 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-3 w-20 rounded-[var(--radius-pill)]" />
      </div>

      {/* Reward + Button Skeleton */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 w-12 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-2.5 w-8 rounded-[var(--radius-sm)]" />
        </div>
        <Skeleton className="h-9 w-16 rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}

export function TaskGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
}
