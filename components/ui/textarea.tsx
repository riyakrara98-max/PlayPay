'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: ComponentSize;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      fullWidth = true,
      disabled,
      required,
      className,
      rows = 4,
      id,
      ...props
    },
    ref
  ) => {
    const backupId = React.useId();
    const textareaId = id || backupId;

    const sizeStyles: Record<ComponentSize, string> = {
      sm: 'text-xs p-2',
      md: 'text-sm p-3',
      lg: 'text-base p-4',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1"
          >
            {label}
            {required && <span className="text-[var(--danger)]">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full bg-[var(--surface)] text-[var(--text-primary)] border rounded-[var(--radius-md)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:bg-[var(--surface-elevated)] disabled:cursor-not-allowed resize-y',
            error
              ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
              : 'border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--primary)]',
            sizeStyles[size],
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
