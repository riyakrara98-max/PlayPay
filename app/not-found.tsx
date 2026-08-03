'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';

export default function NotFound() {
  return (
    <PageContainer size="md" className="min-h-[80vh] flex items-center justify-center">
      <Card variant="elevated" className="w-full p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shadow-xs">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
            404 Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
            Page Not Found
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn&apos;t exist or has been moved. Please check the URL or return home.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />} asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
