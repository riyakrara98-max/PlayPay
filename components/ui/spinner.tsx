'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: ComponentSize | 'xl';
  variant?: 'primary' | 'current' | 'white';
}

export function Spinner({
  size = 'md',
  variant = 'current',
  className,
  ...props
}: SpinnerProps) {
  const sizeClasses: Record<ComponentSize | 'xl', string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantClasses = {
    primary: 'text-[var(--primary)]',
    current: 'text-current',
    white: 'text-white',
  };

  return (
    <svg
      className={cn(
        'animate-spin shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading..."
      role="status"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
