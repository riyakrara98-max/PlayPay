'use client';

import React from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { MaintenanceGuard } from '@/components/layout/MaintenanceGuard';
import { AuthModal } from '@/components/auth/AuthModal';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Root application provider aggregating all context providers.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider position="bottom-right">
        <AuthProvider>
          <AuthModalProvider>
            <SiteSettingsProvider>
              <MaintenanceGuard>
                {children}
              </MaintenanceGuard>
              <AuthModal />
            </SiteSettingsProvider>
          </AuthModalProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
