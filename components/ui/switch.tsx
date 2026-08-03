'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: ComponentSize;
  label?: React.ReactNode;
  id?: string;
  className?: string;
}

export function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  id,
  className,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;
  const backupId = React.useId();
  const switchId = id || backupId;

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(next);
    }
    onChange?.(next);
  };

  const trackSizes: Record<ComponentSize, string> = {
    sm: 'w-8 h-4 p-0.5',
    md: 'w-11 h-6 p-1',
    lg: 'w-14 h-7 p-1',
  };

  const thumbSizes: Record<ComponentSize, string> = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const thumbTranslate: Record<ComponentSize, number> = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          isChecked ? 'bg-[var(--primary)]' : 'bg-[var(--surface-elevated)] border border-[var(--border)]',
          trackSizes[size]
        )}
      >
        <motion.span
          animate={{ x: isChecked ? thumbTranslate[size] : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'inline-block rounded-full bg-white shadow-md transform transition-transform pointer-events-none',
            thumbSizes[size]
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
    </label>
  );
}
