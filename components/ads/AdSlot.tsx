'use client';

import React, { useState } from 'react';
import { Sparkles, ExternalLink, X, Zap, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdSlotProps {
  placement?: string;
  className?: string;
}

export function AdSlot({ placement = 'default', className = '' }: AdSlotProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Responsive styling depending on placement
  if (placement === 'mobile') {
    return (
      <div className={`sm:hidden my-3 ${className}`}>
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 p-3.5 shadow-2xs">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
            title="Dismiss ad"
            aria-label="Dismiss ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tracking-wider text-[var(--primary)] uppercase font-semibold">
                  Sponsored
                </span>
                <span className="text-xs text-[var(--text-muted)]">•</span>
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                  Boost Your Daily Task Earnings
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                Complete featured reviews & earn up to 2x bonus rewards today!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`relative my-4 overflow-hidden border-[var(--border)] bg-gradient-to-r from-[var(--surface-elevated)] via-[var(--surface)] to-[var(--surface-elevated)] p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors z-10"
        title="Hide Advertisement"
        aria-label="Hide Advertisement"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" size="sm" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-mono uppercase tracking-wider font-semibold">
                Promoted Partner
              </Badge>
              <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Ads
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold font-heading text-[var(--text-primary)]">
              Instant Payout Apps & High-Value Daily Missions
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Explore our verified partner applications to unlock exclusive high-paying task queues with fast WhatsApp verification.
            </p>
          </div>
        </div>

        <a
          href="#tasks-marketplace"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95 transition-all shrink-0 w-full sm:w-auto shadow-2xs"
        >
          <span>View Featured Tasks</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </Card>
  );
}
