'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';
import { pageTransition } from '@/utils/animations';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export interface PageWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className, ...props }: PageWrapperProps) {
  const isReducedMotion = useReducedMotion();

  if (isReducedMotion) {
    return <div className={cn('w-full min-h-screen', className)}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('w-full min-h-screen', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
