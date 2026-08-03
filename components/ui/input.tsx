'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: ComponentSize;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = true,
      disabled,
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const backupId = React.useId();
    const inputId = id || backupId;

    const sizeStyles: Record<ComponentSize, string> = {
      sm: 'h-8 text-xs px-2.5',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1"
          >
            {label}
            {required && <span className="text-[var(--danger)]">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full bg-[var(--surface)] text-[var(--text-primary)] border rounded-[var(--radius-md)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:bg-[var(--surface-elevated)] disabled:cursor-not-allowed min-h-[44px] sm:min-h-0',
              error
                ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                : 'border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--primary)]',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              sizeStyles[size],
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[var(--text-muted)] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
