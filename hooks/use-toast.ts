import { useContext } from 'react';
import { ToastContext } from '@/components/providers/toast-provider';
import { ToastContextType } from '@/types/toast';

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
