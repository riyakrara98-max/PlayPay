'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: ComponentSize;
  dot?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

export function Badge({
  variant = 'primary',
  size = 'md',
  dot = false,
  onDismiss,
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30',
    secondary: 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--border)]',
    accent: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30',
    success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30',
    warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30',
    danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30',
    outline: 'bg-transparent text-[var(--text-primary)] border-[var(--border)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] border-transparent',
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]',
    accent: 'bg-[var(--accent)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
    outline: 'bg-[var(--text-primary)]',
    ghost: 'bg-[var(--text-secondary)]',
    neutral: 'bg-slate-400',
  };

  const sizeStyles: Record<ComponentSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium rounded-[var(--radius-pill)]',
    md: 'text-[12px] px-3 py-1 gap-1.5 font-medium rounded-[var(--radius-pill)]',
    lg: 'text-[14px] px-4 py-1.5 gap-2 font-medium rounded-[var(--radius-pill)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center border shrink-0 select-none transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      <span className="truncate">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 hover:opacity-80 rounded-full focus:outline-none focus:ring-1 focus:ring-current"
          aria-label="Remove badge"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
