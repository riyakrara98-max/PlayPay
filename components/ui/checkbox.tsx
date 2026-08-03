'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  helperText?: string;
  error?: string;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      checked = false,
      indeterminate = false,
      onChange,
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const backupId = React.useId();
    const checkboxId = id || backupId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(e.target.checked);
    };

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            'inline-flex items-start gap-2.5 cursor-pointer select-none text-sm text-[var(--text-primary)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={handleChange}
              className="sr-only peer"
              {...props}
            />
            <div
              className={cn(
                'w-5 h-5 border rounded-[var(--radius-sm)] bg-[var(--surface)] transition-all flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg)]',
                checked || indeterminate
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-fg)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]',
                error && 'border-[var(--danger)]'
              )}
            >
              {indeterminate ? (
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              ) : checked ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : null}
            </div>
          </div>
          {label && <span className="text-sm font-medium leading-tight">{label}</span>}
        </label>
        {error ? (
          <p className="text-xs text-[var(--danger)] ml-7 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-secondary)] ml-7">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
