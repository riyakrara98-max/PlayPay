'use client';

import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { Placement } from '@/types/ui';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: Placement;
  delay?: number; // ms
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const placementClasses: Record<Placement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-[var(--surface)] bg-[var(--text-primary)] rounded-[var(--radius-sm)] shadow-md whitespace-nowrap pointer-events-none',
              placementClasses[placement],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
