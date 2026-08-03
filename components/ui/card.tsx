'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'ghost' | 'outline';
  isHoverable?: boolean;
  children?: React.ReactNode;
}

export function Card({
  variant = 'default',
  isHoverable = false,
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-[var(--surface)] border border-[var(--border)] shadow-sm',
    elevated: 'bg-[var(--surface-elevated)] border border-[var(--border)] shadow-md',
    outline: 'bg-transparent border border-[var(--border)]',
    ghost: 'bg-transparent border-transparent',
  };

  return (
    <motion.div
      whileHover={isHoverable ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={cn(
        'rounded-[var(--radius-lg)] p-5 text-[var(--text-primary)] transition-all',
        variantStyles[variant],
        isHoverable && 'hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-[var(--text-primary)] tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[var(--text-secondary)] leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-sm text-[var(--text-primary)]', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-5 pt-3 border-t border-[var(--border)]', className)} {...props}>
      {children}
    </div>
  );
}
