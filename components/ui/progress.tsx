'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  size?: ComponentSize;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  label?: string;
  indeterminate?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = false,
  label,
  indeterminate = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const sizeClasses: Record<ComponentSize, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantColors = {
    primary: 'bg-[var(--primary)]',
    accent: 'bg-[var(--accent)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-primary)]">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'w-full bg-[var(--surface-elevated)] rounded-full overflow-hidden border border-[var(--border)]',
          sizeClasses[size]
        )}
      >
        {indeterminate ? (
          <div
            className={cn('h-full w-1/3 rounded-full animate-pulse', variantColors[variant])}
            style={{
              animation: 'progress-indeterminate 1.5s infinite linear',
            }}
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={cn('h-full rounded-full transition-all', variantColors[variant])}
          />
        )}
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  size?: number; // px
  strokeWidth?: number;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 64,
  strokeWidth = 6,
  variant = 'primary',
  showValue = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max(0, value), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    primary: 'stroke-[var(--primary)]',
    accent: 'stroke-[var(--accent)]',
    success: 'stroke-[var(--success)]',
    warning: 'stroke-[var(--warning)]',
    danger: 'stroke-[var(--danger)]',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn('transition-all duration-300', variantColors[variant])}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-bold font-mono text-[var(--text-primary)]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
