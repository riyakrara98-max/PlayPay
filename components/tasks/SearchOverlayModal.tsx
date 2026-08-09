'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Sparkles, Zap, Flame, Clock, ShieldCheck, Smartphone, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Badge } from '@/components/ui/badge';

interface SearchOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterOption = 'all' | 'high_reward' | 'ending_soon' | 'new' | 'verified' | 'android' | 'popular';

export function SearchOverlayModal({ isOpen, onClose }: SearchOverlayModalProps) {
  const { tasks, loading } = useLiveTasks();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const popularSearches = ['PlayPay', 'Game Review', 'Finance App', 'Quick Survey', 'High Pay'];

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (query.trim()) {
      const qLower = query.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(qLower) ||
          t.appName?.toLowerCase().includes(qLower) ||
          t.description?.toLowerCase().includes(qLower)
      );
    }

    if (activeFilter === 'high_reward') {
      result = result.filter((t) => (t.rewardAmount || 0) >= 20);
    } else if (activeFilter === 'ending_soon') {
      result = result.filter((t) => {
        if (!t.expiresAt) return false;
        const diffHours = (new Date(t.expiresAt).getTime() - Date.now()) / (1000 * 3600);
        return diffHours > 0 && diffHours <= 24;
      });
    } else if (activeFilter === 'new') {
      result = result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (activeFilter === 'verified') {
      result = result.filter((t) => t.isVerified);
    } else if (activeFilter === 'android') {
      result = result.filter((t) => !t.category || t.category === 'app_download' || t.playStoreUrl);
    } else if (activeFilter === 'popular') {
      result = result.filter((t) => (t.enrolledCount || t.currentSubmissions || 0) > 0);
    }

    return result;
  }, [tasks, query, activeFilter]);

  const filterChips: { id: FilterOption; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'high_reward', label: 'Highest Reward', icon: <Zap className="w-3 h-3 text-[var(--success)]" /> },
    { id: 'ending_soon', label: 'Ending Soon', icon: <Clock className="w-3 h-3 text-[var(--warning)]" /> },
    { id: 'new', label: 'New', icon: <Sparkles className="w-3 h-3 text-[var(--primary)]" /> },
    { id: 'verified', label: 'Verified', icon: <ShieldCheck className="w-3 h-3 text-[var(--primary)]" /> },
    { id: 'android', label: 'Android', icon: <Smartphone className="w-3 h-3" /> },
    { id: 'popular', label: 'Most Popular', icon: <TrendingUp className="w-3 h-3 text-amber-500" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="p-0 overflow-hidden"
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Sticky Search Header Input */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] pb-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search app review tasks, games, surveys..."
              autoFocus
              className="w-full pl-9 pr-8 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Tags */}
        {!query && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-secondary)]">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors border border-[var(--border)] text-[10px] font-medium"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Sticky Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-bold shrink-0 min-h-[32px] flex items-center gap-1.5 transition-colors ${
                activeFilter === chip.id
                  ? 'bg-[var(--primary)] text-white shadow-2xs'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/40'
              }`}
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 pt-1">
          {loading ? (
            <TaskGridSkeleton count={3} />
          ) : filteredTasks.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)] space-y-1.5 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)]">
              <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <p className="font-bold text-[var(--text-primary)]">No tasks found matching your filter</p>
              <p className="text-[11px]">Try clearing search keywords or switching filters</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</span>
                <span className="text-[10px] text-[var(--text-muted)]">Verified Instant Cash</span>
              </div>
              {filteredTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

