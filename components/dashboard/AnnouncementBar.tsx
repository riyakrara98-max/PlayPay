'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();

  const text = settings?.announcement?.trim();

  if (!text) {
    return null;
  }

  return (
    <div
      aria-label="Site announcement ticker"
      className="w-full bg-gradient-to-r from-[var(--primary)]/10 via-[var(--primary)]/15 to-[var(--primary)]/10 border-b border-[var(--primary)]/20 text-[var(--text-primary)] text-xs font-medium py-2.5 px-4 overflow-hidden relative flex items-center group shadow-2xs"
    >
      <div className="flex items-center gap-2 pr-3 shrink-0 bg-[var(--surface)]/90 backdrop-blur-xs py-0.5 px-2 rounded-full border border-[var(--primary)]/20 shadow-2xs z-10 text-[var(--primary)]">
        <Megaphone className="w-3.5 h-3.5 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono">
          Notice
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center ml-2">
        <div className="whitespace-nowrap inline-block animate-marquee group-hover:[animation-play-state:paused] hover:[animation-play-state:paused]">
          <span className="px-4 font-semibold">{text}</span>
          <span className="px-4 font-semibold text-[var(--text-muted)]">•</span>
          <span className="px-4 font-semibold">{text}</span>
          <span className="px-4 font-semibold text-[var(--text-muted)]">•</span>
          <span className="px-4 font-semibold">{text}</span>
        </div>
      </div>
    </div>
  );
}
