'use client';

import React, { createContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastContextType, ToastItem, ToastOptions, ToastPosition } from '@/types/toast';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
}

export function ToastProvider({ children, position = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback((options: ToastOptions | string): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;

    const newToast: ToastItem = {
      id: opts.id || id,
      title: opts.title,
      message: opts.message,
      variant: opts.variant || 'info',
      duration: opts.duration ?? 4000,
      action: opts.action,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev.filter((t) => t.id !== newToast.id), newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        dismiss(newToast.id);
      }, newToast.duration);
    }

    return newToast.id;
  }, [dismiss]);

  const positionClasses: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4 items-start',
    'top-right': 'top-4 right-4 items-end',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-left': 'bottom-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  const getVariantStyles = (variant: ToastItem['variant']) => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />,
          border: 'border-l-4 border-l-[var(--success)]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />,
          border: 'border-l-4 border-l-[var(--warning)]',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0" />,
          border: 'border-l-4 border-l-[var(--danger)]',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />,
          border: 'border-l-4 border-l-[var(--primary)]',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <div
        id="toast-container"
        className={`fixed z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 ${positionClasses[position]}`}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const { icon, border } = getVariantStyles(t.variant);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 w-full p-4 rounded-lg bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-lg ${border}`}
                role="alert"
                aria-live="polite"
              >
                {icon}
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <h5 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t.message}
                  </p>
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-2 text-xs font-semibold text-[var(--primary)] hover:underline focus:outline-none"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  aria-label="Close toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
