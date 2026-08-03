import React from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem extends Required<Omit<ToastOptions, 'action' | 'title'>> {
  id: string;
  title?: string;
  action?: ToastOptions['action'];
  createdAt: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: ToastOptions | string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
