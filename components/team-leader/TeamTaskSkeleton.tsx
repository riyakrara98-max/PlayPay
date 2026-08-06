'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function TeamTaskSkeleton() {
  return (
    <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800" />
          <div className="space-y-2">
            <div className="w-28 h-4 bg-slate-800 rounded-md" />
            <div className="w-36 h-3 bg-slate-800/60 rounded-md" />
          </div>
        </div>
        <div className="w-20 h-5 bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="w-3/4 h-4 bg-slate-800 rounded-md" />
        <div className="w-1/2 h-3 bg-slate-800/60 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <div className="h-10 bg-slate-900/50 rounded-xl" />
        <div className="h-10 bg-slate-900/50 rounded-xl" />
      </div>
    </Card>
  );
}
