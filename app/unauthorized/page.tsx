'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';

export default function UnauthorizedPage() {
  return (
    <PageContainer size="md" className="min-h-[80vh] flex items-center justify-center">
      <Card variant="elevated" className="w-full p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
            401 Unauthorized
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-primary)]">
            Authentication Required
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            You must be logged in to access this page. Please sign in with your PlayPay account to continue.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          <Button variant="outline" size="md" leftIcon={<Home className="w-4 h-4" />} asChild>
            <Link href="/">Back Home</Link>
          </Button>
          <Button variant="primary" size="md" leftIcon={<LogIn className="w-4 h-4" />} asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
