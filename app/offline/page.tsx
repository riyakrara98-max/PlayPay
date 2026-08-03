'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';

export default function OfflinePage() {
  return (
    <PageContainer size="md" className="min-h-[80vh] flex items-center justify-center">
      <Card variant="elevated" className="w-full p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center shadow-xs">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-[var(--warning)] uppercase tracking-wider">
            Network Connection Lost
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
            You Are Offline
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            It looks like you are not connected to the internet. Please check your network connection and retry.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => window.location.reload()}
        >
          Check Connection
        </Button>
      </Card>
    </PageContainer>
  );
}
