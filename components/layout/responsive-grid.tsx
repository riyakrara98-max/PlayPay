'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  gap?: 2 | 3 | 4 | 6 | 8 | 10;
  children: React.ReactNode;
}

export function ResponsiveGrid({
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className,
  children,
  ...props
}: ResponsiveGridProps) {
  const defaultColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const smColsMap: Record<number, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12',
  };

  const mdColsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
  };

  const lgColsMap: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
  };

  const xlColsMap: Record<number, string> = {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    6: 'xl:grid-cols-6',
    12: 'xl:grid-cols-12',
  };

  const gapMap: Record<number, string> = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
  };

  return (
    <div
      className={cn(
        'grid w-full',
        cols.default && defaultColsMap[cols.default],
        cols.sm && smColsMap[cols.sm],
        cols.md && mdColsMap[cols.md],
        cols.lg && lgColsMap[cols.lg],
        cols.xl && xlColsMap[cols.xl],
        gapMap[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
