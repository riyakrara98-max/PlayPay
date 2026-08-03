'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { TaskEmptyState } from '@/components/tasks/TaskEmptyState';

type StatusFilter = 'all' | 'available' | 'almost_full' | 'full';
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
        const progress = Math.min(100, Math.round((enrolled / total) * 100));

        if (statusFilter === 'full') {
          return remaining <= 0;
        }
        if (statusFilter === 'almost_full') {
          return remaining > 0 && progress >= 80;
        }
        if (statusFilter === 'available') {
          return remaining > 0 && progress < 80;
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
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

  return (
    <section className="w-full space-y-6">
      {/* Search & Filter Header Control Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or app name..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              aria-label="Search tasks"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5 py-0.5 rounded-md bg-[var(--border)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
            <span className="text-xs font-semibold text-[var(--text-muted)] hidden sm:block">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
              aria-label="Sort tasks"
            >
              <option value="newest">Newest First</option>
              <option value="reward_high">Highest Reward</option>
              <option value="reward_low">Lowest Reward</option>
              <option value="slots_left">Most Slots Left</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)] mr-1 hidden sm:block" />
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-[var(--primary)] text-[var(--primary-fg)] shadow-2xs'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'available'
                  ? 'bg-[var(--success)] text-[var(--success-fg)] shadow-2xs'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('almost_full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'almost_full'
                  ? 'bg-[var(--warning)] text-white shadow-2xs'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              Almost Full
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'full'
                  ? 'bg-[var(--text-secondary)] text-white shadow-2xs'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              Full
            </button>
          </div>

          <div className="text-xs font-mono font-semibold text-[var(--text-muted)] shrink-0 pl-2">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <TaskGridSkeleton count={6} />
      ) : error ? (
        /* Error State */
        <div className="bg-[var(--surface)] border border-[var(--danger)]/30 rounded-2xl p-8 text-center max-w-md mx-auto my-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              Unable to sync live tasks
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mx-auto transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State */
        <TaskEmptyState
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          onRefresh={refetch}
        />
      ) : (
        /* Task Cards Grid */
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
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
