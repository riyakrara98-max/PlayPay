'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  SlidersHorizontal,
  IndianRupee,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SearchOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterOption = 'all' | 'high_reward' | 'ending_soon' | 'new' | 'verified' | 'popular';

export function SearchOverlayModal({ isOpen, onClose }: SearchOverlayModalProps) {
  const { tasks, loading } = useLiveTasks();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const popularSearches = [
    'High Pay',
    'Game Review',
    'Finance',
    'Survey',
    'Instant Cash',
    'Android App',
  ];

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === 'active');

    if (query.trim()) {
      const qLower = query.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(qLower) ||
          t.appName?.toLowerCase().includes(qLower) ||
          t.description?.toLowerCase().includes(qLower) ||
          t.category?.toLowerCase().includes(qLower)
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
      result = [...result].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else if (activeFilter === 'verified') {
      result = result.filter((t) => t.isVerified);
    } else if (activeFilter === 'popular') {
      result = result.filter((t) => (t.enrolledCount || t.currentSubmissions || 0) > 0);
    }

    return result;
  }, [tasks, query, activeFilter]);

  const filterChips: { id: FilterOption; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'high_reward', label: 'High Reward (₹20+)', icon: <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" /> },
    { id: 'popular', label: 'Popular', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'new', label: 'New', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'ending_soon', label: 'Ending Soon', icon: <Clock className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'verified', label: '100% Verified', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> },
  ];

  const handleReset = () => {
    setQuery('');
    setActiveFilter('all');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="p-0 overflow-hidden max-h-[90vh] flex flex-col rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]"
    >
      {/* Mobile Top Drag Indicator / Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] font-heading">
                Search Review Tasks
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                Find high-paying app review campaigns in seconds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Touch-Friendly Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, games, apps..."
            autoFocus
            className="w-full pl-10 pr-10 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[48px] shadow-2xs font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Popular Tags Quick Tap Bar */}
        {!query && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-[var(--text-muted)] shrink-0 mr-1">
              Popular:
            </span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors shrink-0 min-h-[32px] flex items-center"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Filter Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3.5 py-2 rounded-[var(--radius-pill)] text-xs font-bold shrink-0 min-h-[38px] flex items-center gap-1.5 transition-all ${
                activeFilter === chip.id
                  ? 'bg-[var(--primary)] text-white shadow-xs scale-102'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/40'
              }`}
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 min-h-[250px]">
        {loading ? (
          <TaskGridSkeleton count={3} />
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-[var(--text-muted)] space-y-3 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)] my-2">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[var(--text-primary)] font-heading">
                No matching review tasks
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
                We couldn&apos;t find tasks matching &quot;{query || activeFilter}&quot;. Try searching for different keywords.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="font-bold text-xs mt-2"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
                Showing {filteredTasks.length} Task{filteredTasks.length === 1 ? '' : 's'}
              </span>
              <Badge variant="success" size="sm" className="font-bold">
                Instant UPI Payout
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
