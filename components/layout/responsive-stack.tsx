'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | { sm?: 'row' | 'column'; md?: 'row' | 'column' };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 1 | 2 | 3 | 4 | 6 | 8 | 10 | 12;
  wrap?: boolean;
  children: React.ReactNode;
}

export function ResponsiveStack({
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  gap = 4,
  wrap = false,
  className,
  children,
  ...props
}: ResponsiveStackProps) {
  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const gapMap: Record<number, string> = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
  };

  const getDirectionClass = () => {
    if (typeof direction === 'string') {
      return direction === 'row' ? 'flex-row' : 'flex-col';
    }
    const classes = [];
    if (direction.sm) classes.push(direction.sm === 'row' ? 'sm:flex-row' : 'sm:flex-col');
    if (direction.md) classes.push(direction.md === 'row' ? 'md:flex-row' : 'md:flex-col');
    return classes.join(' ') || 'flex-col';
  };

  return (
    <div
      className={cn(
        'flex w-full',
        getDirectionClass(),
        alignMap[align],
        justifyMap[justify],
        gapMap[gap],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
