'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './icon-button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            className={cn(
              'relative z-10 w-full bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-xl overflow-hidden flex flex-col my-auto',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-5 border-b border-[var(--border)] shrink-0">
                <div className="flex flex-col gap-1 pr-6">
                  {title && (
                    <h3 id="modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id="modal-description" className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <IconButton
                  icon={<X className="w-5 h-5" />}
                  aria-label="Close dialog"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="-mr-2 -mt-1"
                />
              </div>
            )}

            {/* Content Body */}
            <div className="p-5 overflow-y-auto max-h-[70vh] flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-4 bg-[var(--surface-elevated)] border-t border-[var(--border)] shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
