'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Sun, Moon } from 'lucide-react';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { useTheme } from '@/hooks/use-theme';
import { IconButton } from '@/components/ui/icon-button';
import { PageTransition } from '@/components/layout/PageTransition';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <GuestRoute>
      <div className="min-h-screen w-full bg-[var(--bg)] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Top Header */}
        <header className="w-full max-w-screen-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-md)]"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] text-[var(--primary-fg)] font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-base font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
              PlayPay
            </span>
          </Link>

          <IconButton
            icon={
              resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )
            }
            aria-label="Toggle theme"
            variant="ghost"
            size="md"
            onClick={toggleTheme}
          />
        </header>

        {/* Auth Card Content */}
        <main className="w-full max-w-md mx-auto my-auto py-8">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-screen-xl mx-auto text-center text-xs text-[var(--text-muted)] py-4">
          © {new Date().getFullYear()} PlayPay. All rights reserved.
        </footer>
      </div>
    </GuestRoute>
  );
}
