'use client';

import React from 'react';
import { Wrench, ShieldAlert, RefreshCw, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { userProfile, isAdmin, loading: authLoading } = useAuth();

  // If loading settings, render children or simple skeleton
  if (settingsLoading || authLoading) {
    return <>{children}</>;
  }

  // If maintenance mode is active
  if (settings.maintenanceMode) {
    // If user is Admin, bypass maintenance mode but show top banner
    if (isAdmin || userProfile?.role === 'admin') {
      return (
        <>
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>Maintenance Mode Active:</strong> Non-admin access is currently suspended. You are bypassing as Administrator.
              </span>
            </div>
            <a
              href="/admin/settings"
              className="underline text-xs font-medium hover:text-amber-800 dark:hover:text-amber-300 ml-2 shrink-0"
            >
              Disable Maintenance
            </a>
          </div>
          {children}
        </>
      );
    }

    // For non-admin users, block and display Maintenance Screen
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-lg w-full p-6 sm:p-8 text-center border-[var(--border)] shadow-xl bg-[var(--card)] space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {settings.siteName || 'PlayPay'} Under Scheduled Maintenance
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {settings.maintenanceMessage ||
                'Our platform is currently undergoing scheduled system upgrades to improve payment stability and task verification speeds.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1 text-left">
            <div className="flex justify-between font-medium text-[var(--text-primary)]">
              <span>Status:</span>
              <span className="text-amber-500 font-bold">Maintenance In Progress</span>
            </div>
            <div className="flex justify-between">
              <span>Admin Support WhatsApp:</span>
              <span className="font-mono">{settings.adminWhatsAppNumber || 'Available via WhatsApp'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>

            {settings.adminWhatsAppNumber && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const cleanNum = settings.adminWhatsAppNumber.replace(/\D/g, '');
                  window.open(`https://wa.me/${cleanNum}`, '_blank');
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Normal mode
  return <>{children}</>;
}
