'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthModalContextType {
  isOpen: boolean;
  pendingTaskId: string | null;
  openAuthModal: (pendingTaskId?: string) => void;
  closeAuthModal: () => void;
  clearPendingTask: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const openAuthModal = useCallback((taskId?: string) => {
    if (taskId) {
      setPendingTaskId(taskId);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('playpay_pending_task_id', taskId);
        } catch {}
      }
    }
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearPendingTask = useCallback(() => {
    setPendingTaskId(null);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        pendingTaskId,
        openAuthModal,
        closeAuthModal,
        clearPendingTask,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextType {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
