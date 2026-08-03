'use client';

import React from 'react';
import { Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';

export default function MaintenancePage() {
  return (
    <PageContainer size="md" className="min-h-[80vh] flex items-center justify-center">
      <Card variant="elevated" className="w-full p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-xs">
          <Wrench className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-wider">
            System Maintenance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
            Under Scheduled Maintenance
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            PlayPay is currently undergoing scheduled platform upgrades. We will be back online shortly. Thank you for your patience!
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => window.location.reload()}
        >
          Check Status
        </Button>
      </Card>
    </PageContainer>
  );
}
