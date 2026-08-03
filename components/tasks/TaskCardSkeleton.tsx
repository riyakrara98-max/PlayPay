'use client';

import React from 'react';

export function TaskCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs animate-pulse flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] shrink-0" />
            <div className="space-y-2 w-full max-w-[140px]">
              <div className="h-3 bg-[var(--surface-elevated)] rounded-md w-2/3" />
              <div className="h-4 bg-[var(--surface-elevated)] rounded-md w-full" />
            </div>
          </div>
          <div className="w-16 h-5 rounded-full bg-[var(--surface-elevated)] shrink-0" />
        </div>

        {/* Description */}
        <div className="space-y-1.5 mb-4">
          <div className="h-3 bg-[var(--surface-elevated)] rounded-md w-full" />
          <div className="h-3 bg-[var(--surface-elevated)] rounded-md w-4/5" />
        </div>

        {/* Reward & Countdown */}
        <div className="h-14 bg-[var(--surface-elevated)] rounded-xl mb-4" />

        {/* Progress Bar */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between">
            <div className="h-3 bg-[var(--surface-elevated)] rounded-md w-24" />
            <div className="h-3 bg-[var(--surface-elevated)] rounded-md w-12" />
          </div>
          <div className="h-2 bg-[var(--surface-elevated)] rounded-full w-full" />
        </div>
      </div>

      {/* Button */}
      <div className="h-11 bg-[var(--surface-elevated)] rounded-xl w-full" />
    </div>
  );
}

export function TaskGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
}
