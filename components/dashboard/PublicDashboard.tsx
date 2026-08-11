'use client';

import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  ArrowRight,
  Flame,
  Zap,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { AnnouncementBar } from '@/components/dashboard/AnnouncementBar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { SearchOverlayModal } from '@/components/tasks/SearchOverlayModal';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdSlot } from '@/components/ads/AdSlot';

const INITIAL_VISIBLE_COUNT = 10;

export function PublicDashboard() {
  const { tasks, loading, error, refetch } = useLiveTasks();
  const { settings } = useSiteSettings();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchOpen, setSearchOpen] = useState(false);

  // Evaluate CMS-driven Hero Visibility & Dates
  const isHeroActive = useMemo(() => {
    if (!settings?.heroEnabled) return false;

    const now = new Date();

    if (settings.heroStartDate) {
      const start = new Date(settings.heroStartDate);
      if (!isNaN(start.getTime()) && now < start) {
        return false;
      }
    }

    if (settings.heroEndDate) {
      const end = new Date(settings.heroEndDate);
      if (!isNaN(end.getTime())) {
        if (settings.heroEndDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        if (now > end) {
          return false;
        }
      }
    }

    return true;
  }, [settings]);

  // Handle CTA Navigation
  const handleHeroCta = () => {
    const link = settings?.heroCtaLink?.trim() || '#tasks-marketplace';
    if (link.startsWith('#')) {
      const targetId = link.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('tasks-marketplace')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = link;
    }
  };

  // Filter active tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'active');
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    return activeTasks.slice(0, visibleCount);
  }, [activeTasks, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] font-body">
      {/* Dynamic Prioritized Notice Feed Bar */}
      <AnnouncementBar />

      <main className="flex-1 w-full pb-20 md:pb-12">
        {/* ==========================================
            1. HERO: CMS-DRIVEN PROMOTIONAL BANNER
            ========================================== */}
        {isHeroActive && (
          <section className="w-full bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--surface)] border-b border-[var(--border)] py-5 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Top Market Bar Pill */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {settings?.heroBadgeText ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>{settings.heroBadgeText}</span>
                  </div>
                ) : <div />}

                <Badge variant="success" size="sm" className="tabular-nums font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5" />
                  {activeTasks.length} Live
                </Badge>
              </div>

              {/* High Impact Earning Banner */}
              <Card
                variant="elevated"
                className={`p-5 sm:p-6 border-2 border-[var(--primary)]/30 relative overflow-hidden shadow-sm ${
                  settings?.heroBgType === 'image' && settings?.heroBgImageUrl
                    ? 'bg-cover bg-center text-white'
                    : 'bg-gradient-to-r from-[var(--primary)]/15 via-[var(--surface)] to-[var(--success)]/15'
                }`}
                style={
                  settings?.heroBgType === 'image' && settings?.heroBgImageUrl
                    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${settings.heroBgImageUrl})` }
                    : {}
                }
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--success)] uppercase tracking-wider">
                      <Zap className="w-4 h-4 fill-current text-[var(--success)]" /> Direct Cash Verification
                    </div>
                    {settings?.heroTitle && (
                      <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-heading tracking-tight leading-tight">
                        {settings.heroTitle}
                      </h1>
                    )}
                    {settings?.heroSubtitle && (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                        {settings.heroSubtitle}
                      </p>
                    )}
                  </div>

                  {/* Primary CTA Button */}
                  {settings?.heroCtaText && (
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleHeroCta}
                      className="w-full sm:w-auto font-black text-sm py-3 px-6 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 min-h-[48px]"
                    >
                      {settings.heroCtaText}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </section>
        )}

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
          <AdSlot placement="dashboard" />
        </div>

        {/* ==========================================
            2. AVAILABLE REVIEW TASKS (CORE EARNING SECTION)
            ========================================== */}
        <section
          id="tasks-marketplace"
          className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-4 scroll-mt-16"
        >
          {/* Quick Search Bar Trigger for Mobile Users */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-[var(--radius-xl)] shadow-2xs text-left group transition-all duration-200 min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                  Search app review tasks, highest pay, games...
                </span>
              </div>
              <Badge variant="primary" size="sm" className="hidden sm:inline-flex font-bold">
                Tap to Search
              </Badge>
            </button>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-heading tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 fill-current" />
                Available Tasks
              </h2>
              
            </div>

            <Badge variant="neutral" size="sm" className="tabular-nums font-bold shrink-0">
              {activeTasks.length} Live
            </Badge>
          </div>

          <AdSlot placement="task-list" />

          {/* Task Grid rendering */}
          {loading ? (
            <TaskGridSkeleton count={6} />
          ) : error ? (
            <div className="p-6 text-center bg-[var(--surface)] border border-[var(--danger)]/30 rounded-[var(--radius-xl)] my-4 space-y-3">
              <p className="text-xs font-bold text-[var(--danger)]">Failed to sync live review tasks.</p>
              <Button variant="primary" size="sm" onClick={() => refetch()}>
                Retry Loading
              </Button>
            </div>
          ) : activeTasks.length === 0 ? (
            /* Clean Empty State */
            <div className="py-14 px-4 text-center bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] my-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto text-2xl">
                
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">You&apos;re all caught up!</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto font-medium">
                New review campaigns will appear here soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {/* Load More Button */}
              {activeTasks.length > visibleCount && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleLoadMore}
                    rightIcon={<ChevronDown className="w-4 h-4" />}
                    className="font-extrabold text-xs px-6 py-2.5 rounded-[var(--radius-pill)] border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10"
                  >
                    Load More Tasks ({activeTasks.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Clean Minimal Marketplace Footer */}
      <footer className="w-full bg-[var(--surface)] border-t border-[var(--border)] py-6 px-4 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-1.5">
          <span className="text-[var(--text-primary)] font-heading font-extrabold text-sm">
            PlayPay App Review Earning Platform
          </span>
          <p>© {new Date().getFullYear()} PlayPay. All rights reserved.</p>
        </div>
      </footer>

      {/* Global Search Overlay Modal */}
      <SearchOverlayModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

