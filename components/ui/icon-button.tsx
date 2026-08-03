'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';
import { ButtonVariant } from './button';
import { Spinner } from './spinner';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  'aria-label': string;
  isRounded?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled = false,
      'aria-label': ariaLabel,
      isRounded = false,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] border-transparent shadow-sm',
      secondary: 'bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] border-[var(--border)] shadow-sm',
      accent: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] border-transparent shadow-sm',
      success: 'bg-[var(--success)] text-[var(--success-fg)] hover:bg-[var(--success-hover)] border-transparent shadow-sm',
      warning: 'bg-[var(--warning)] text-[var(--warning-fg)] hover:bg-[var(--warning-hover)] border-transparent shadow-sm',
      danger: 'bg-[var(--danger)] text-[var(--danger-fg)] hover:bg-[var(--danger-hover)] border-transparent shadow-sm',
      outline: 'bg-transparent text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]',
      ghost: 'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-elevated)]',
    };

    const sizeStyles: Record<ComponentSize, string> = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={disabled || isLoading ? undefined : { scale: 0.94 }}
        whileHover={disabled || isLoading ? undefined : { scale: 1.05 }}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0 min-h-[44px] min-w-[44px]',
          isRounded ? 'rounded-full' : 'rounded-[var(--radius-md)]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Spinner size={size} /> : icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
