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
      sm: 'h-10 text-[16px] px-3',
      md: 'h-12 text-[16px] px-4',
      lg: 'h-14 text-[16px] px-4',
    };

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-medium text-[var(--ink-secondary)] flex items-center gap-1"
          >
            {label}
            {required && <span className="text-[var(--ruby)]">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--ink-mute)] pointer-events-none flex items-center justify-center z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full bg-[var(--canvas)] text-[var(--ink)] border rounded-[var(--radius-md)] transition-colors placeholder:text-[var(--ink-mute-2)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-[var(--canvas-soft)] disabled:cursor-not-allowed min-h-[48px] sm:min-h-0',
              error
                ? 'border-[var(--ruby)] focus:ring-[var(--ruby)] focus:border-[var(--ruby)]'
                : 'border-[var(--hairline-input)] hover:border-[var(--primary-soft)]',
              sizeStyles[size],
              leftIcon && '!pl-10',
              rightIcon && '!pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[var(--ink-mute)] flex items-center justify-center z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[13px] text-[var(--ruby)] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] text-[var(--ink-mute)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
