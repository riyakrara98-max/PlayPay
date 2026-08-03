'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './icon-button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  size = 'md',
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const slideVariants = {
    hidden: { x: position === 'right' ? '100%' : '-100%' },
    visible: { x: 0 },
    exit: { x: position === 'right' ? '100%' : '-100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'relative z-10 w-full h-full bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] shadow-2xl flex flex-col',
              position === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
              sizeClasses[size],
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
              <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
              <IconButton
                icon={<X className="w-5 h-5" />}
                aria-label="Close drawer"
                variant="ghost"
                size="sm"
                onClick={onClose}
              />
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 bg-[var(--surface-elevated)] border-t border-[var(--border)] shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
