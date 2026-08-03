'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <PageContainer size="md" className="min-h-[80vh] flex items-center justify-center">
      <Card variant="elevated" className="w-full p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-[var(--danger)] uppercase tracking-wider">
            500 Application Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
            Something Went Wrong
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            An unexpected application error occurred. You can attempt to reload the page or navigate back to safety.
          </p>
        </div>

        {error.message && (
          <div className="w-full p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-left">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">
              Error Details
            </span>
            <code className="text-xs font-mono text-[var(--danger)] break-words">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => reset()}
          >
            Retry Loading
          </Button>
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />} asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
