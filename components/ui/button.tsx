'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      type = 'button',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] border-transparent shadow-sm',
      secondary:
        'bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] border-[var(--border)] shadow-sm',
      accent:
        'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] border-transparent shadow-sm',
      success:
        'bg-[var(--success)] text-[var(--success-fg)] hover:bg-[var(--success-hover)] border-transparent shadow-sm',
      warning:
        'bg-[var(--warning)] text-[var(--warning-fg)] hover:bg-[var(--warning-hover)] border-transparent shadow-sm',
      danger:
        'bg-[var(--danger)] text-[var(--danger-fg)] hover:bg-[var(--danger-hover)] border-transparent shadow-sm',
      outline:
        'bg-transparent text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]',
      ghost:
        'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-elevated)]',
    };

    const sizeStyles: Record<ComponentSize, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]',
      md: 'h-10 px-4 text-sm font-medium gap-2 rounded-[var(--radius-md)]',
      lg: 'h-12 px-6 text-base font-semibold gap-2.5 rounded-[var(--radius-lg)]',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        whileHover={disabled || isLoading ? undefined : { scale: 1.01 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-sans border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-1.5" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
