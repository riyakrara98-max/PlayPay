'use client';

import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 gap-4">
      <Spinner size="lg" variant="primary" />
      <div className="flex flex-col items-center gap-2 max-w-sm w-full">
        <Skeleton variant="text" className="w-3/4 h-4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
    </div>
  );
}
