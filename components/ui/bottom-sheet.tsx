'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './icon-button';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: BottomSheetProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cn(
              'relative z-10 w-full max-w-lg bg-[var(--surface)] text-[var(--text-primary)] rounded-t-[var(--radius-2xl)] border-t border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag Handle Indicator */}
            <div className="flex flex-col items-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[var(--border-hover)] rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--border)] shrink-0">
                <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
                <IconButton
                  icon={<X className="w-5 h-5" />}
                  aria-label="Close sheet"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                />
              </div>
            )}

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1">{children}</div>

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
