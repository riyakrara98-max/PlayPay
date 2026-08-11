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
    default: 'card-3d rounded-[var(--radius-xl)]',
    elevated: 'card-3d bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] shadow-md',
    outline: 'bg-transparent border border-[var(--border)] rounded-[var(--radius-xl)]',
    ghost: 'bg-transparent border-transparent rounded-[var(--radius-xl)]',
  };

  return (
    <motion.div
      whileHover={isHoverable ? { y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined}
      whileTap={isHoverable ? { scale: 0.985, y: 0 } : undefined}
      className={cn(
        'p-5 sm:p-6 text-[var(--text-primary)] transition-all smooth-render',
        variantStyles[variant],
        isHoverable && 'cursor-pointer active-push',
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
    <div className={cn('flex flex-col gap-2 mb-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-[22px] tracking-tight font-display font-medium text-[var(--ink)]', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[15px] text-[var(--ink-mute)] leading-relaxed', className)} {...props}>
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
