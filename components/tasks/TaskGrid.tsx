'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { TaskEmptyState } from '@/components/tasks/TaskEmptyState';
import { getSafeTime } from '@/utils/formatters';
import { Button } from '@/components/ui/button';

type StatusFilter = 'all' | 'new' | 'high_reward' | 'available' | 'limited' | 'completed';
type SortOption = 'newest' | 'reward_high' | 'reward_low' | 'slots_left';

export function TaskGrid() {
  const { tasks, loading, error, refetch } = useLiveTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter & Sort Logic
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      result = result.filter((task) => {
        const titleMatch = task.title?.toLowerCase().includes(queryLower);
        const appMatch = task.appName?.toLowerCase().includes(queryLower);
        const descMatch = task.description?.toLowerCase().includes(queryLower);
        return titleMatch || appMatch || descMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((task) => {
        const total = task.totalSlots ?? task.maxSubmissions ?? 1;
        const enrolled = task.enrolledCount ?? task.currentSubmissions ?? 0;
        const remaining = Math.max(0, total - enrolled);

        if (statusFilter === 'available') {
          return remaining > 0;
        }
        if (statusFilter === 'limited') {
          return remaining > 0 && remaining <= 5;
        }
        if (statusFilter === 'high_reward') {
          return (task.rewardAmount || 0) >= 20;
        }
        if (statusFilter === 'new') {
          const createdTime = task.createdAt ? getSafeTime(task.createdAt) : 0;
          const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
          return createdTime >= twentyFourHoursAgo;
        }
        if (statusFilter === 'completed') {
          return remaining <= 0;
        }
        return true;
      });
    }

    // Sort logic
    result.sort((a, b) => {
      if (sortBy === 'reward_high') {
        return (b.rewardAmount || 0) - (a.rewardAmount || 0);
      }
      if (sortBy === 'reward_low') {
        return (a.rewardAmount || 0) - (b.rewardAmount || 0);
      }
      if (sortBy === 'slots_left') {
        const totalA = a.totalSlots ?? a.maxSubmissions ?? 1;
        const enrolledA = a.enrolledCount ?? a.currentSubmissions ?? 0;
        const remainingA = Math.max(0, totalA - enrolledA);

        const totalB = b.totalSlots ?? b.maxSubmissions ?? 1;
        const enrolledB = b.enrolledCount ?? b.currentSubmissions ?? 0;
        const remainingB = Math.max(0, totalB - enrolledB);

        return remainingB - remainingA;
      }
      // Newest first
      const timeA = a.createdAt ? getSafeTime(a.createdAt) : 0;
      const timeB = b.createdAt ? getSafeTime(b.createdAt) : 0;
      return timeB - timeA;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, sortBy]);

  const isFiltered = Boolean(searchQuery.trim() || statusFilter !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const filterChips: { id: StatusFilter; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'new', label: 'New', icon: <Sparkles className="w-3 h-3 text-[var(--warning)]" /> },
    { id: 'high_reward', label: 'High Reward', icon: <Zap className="w-3 h-3 text-[var(--success)]" /> },
    { id: 'available', label: 'Available' },
    { id: 'limited', label: 'Limited', icon: <Flame className="w-3 h-3 text-[var(--warning)]" /> },
    { id: 'completed', label: 'Full' },
  ];

  return (
    <section className="w-full space-y-4">
      {/* Search & Sticky Filter Control Bar */}
      <div className="sticky top-14 z-30 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-xl)] p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search app name or task..."
              className="w-full pl-9 pr-8 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all min-h-[44px]"
              aria-label="Search tasks"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--border)] min-h-[32px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus:outline-none"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all cursor-pointer min-h-[44px]"
              aria-label="Sort tasks"
            >
              <option value="newest">Newest</option>
              <option value="reward_high">Highest Reward</option>
              <option value="reward_low">Lowest Reward</option>
              <option value="slots_left">Most Spots</option>
            </select>
          </div>
        </div>

        {/* Sticky Filter Chips */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3.5 py-2 rounded-[var(--radius-pill)] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  statusFilter === chip.id
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--success)] text-white shadow-xs'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] border border-[var(--border)]'
                }`}
              >
                {chip.icon}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] shrink-0 pl-2">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <TaskGridSkeleton count={8} />
      ) : error ? (
        /* Error State */
        <div className="bg-[var(--surface)] border border-[var(--danger)]/30 rounded-[var(--radius-xl)] p-6 text-center max-w-md mx-auto my-6 space-y-4">
          <div className="w-10 h-10 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Unable to sync live tasks
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{error}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => refetch()}
            className="mx-auto"
          >
            Retry
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State */
        <TaskEmptyState
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          onRefresh={refetch}
        />
      ) : (
        /* Compact Android Task Item List */
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
