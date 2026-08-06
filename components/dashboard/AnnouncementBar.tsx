'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Badge } from '@/components/ui/badge';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();

  const text = settings?.announcement?.trim();

  if (!text) {
    return null;
  }

  return (
    <div
      aria-label="Site announcement ticker"
      className="w-full bg-gradient-to-r from-[var(--primary)]/10 via-[var(--primary)]/15 to-[var(--primary)]/10 border-b border-[var(--primary)]/20 text-[var(--text-primary)] text-xs font-medium py-2 px-4 overflow-hidden relative flex items-center group shadow-2xs"
    >
      <Badge variant="primary" size="sm" className="z-10 shrink-0 font-mono">
        <Megaphone className="w-3.5 h-3.5 animate-pulse shrink-0 inline-block mr-1" />
        Notice
      </Badge>

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
