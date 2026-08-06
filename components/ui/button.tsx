'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';
import { Slot } from '@radix-ui/react-slot';
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
        'bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-press)] border-transparent shadow-sm',
      secondary:
        'bg-[var(--canvas)] text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--canvas-soft)] border shadow-sm',
      accent:
        'bg-[var(--brand-dark-900)] text-[var(--on-primary)] hover:opacity-90 border-transparent shadow-sm',
      success:
        'bg-[var(--success)] text-white hover:opacity-90 border-transparent shadow-sm',
      warning:
        'bg-[var(--warning)] text-white hover:opacity-90 border-transparent shadow-sm',
      danger:
        'bg-[var(--ruby)] text-white hover:opacity-90 border-transparent shadow-sm',
      outline:
        'bg-transparent text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]',
      ghost:
        'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-elevated)]',
    };

    const sizeStyles: Record<ComponentSize, string> = {
      sm: 'px-3 py-1.5 text-[14px] leading-none rounded-[var(--radius-pill)] gap-1.5',
      md: 'px-4 py-2 text-[16px] leading-none rounded-[var(--radius-pill)] gap-2',
      lg: 'px-6 py-3 text-[16px] font-medium leading-none rounded-[var(--radius-pill)] gap-2.5',
    };

    const combinedClassName = cn(
      'inline-flex items-center justify-center font-body border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    );

    if (asChild) {
      const {
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
        animate,
        initial,
        exit,
        variants,
        transition,
        layout,
        layoutId,
        onAnimationStart,
        onAnimationComplete,
        ...slotProps
      } = props;

      return (
        <Slot
          ref={ref as any}
          className={combinedClassName}
          aria-disabled={disabled || isLoading ? true : undefined}
          {...(slotProps as any)}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={disabled || isLoading ? undefined : (props.whileTap ?? { scale: 0.98 })}
        whileHover={disabled || isLoading ? undefined : (props.whileHover ?? { scale: 1.01 })}
        disabled={disabled || isLoading}
        className={combinedClassName}
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
