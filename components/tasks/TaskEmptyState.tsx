'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, SearchX, RefreshCw } from 'lucide-react';

interface TaskEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onRefresh?: () => void;
}

export function TaskEmptyState({
  isFiltered = false,
  onResetFilters,
  onRefresh,
}: TaskEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xs max-w-lg mx-auto my-8"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4 border border-[var(--primary)]/20 shadow-2xs">
        {isFiltered ? (
          <SearchX className="w-8 h-8" />
        ) : (
          <Inbox className="w-8 h-8" />
        )}
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {isFiltered ? 'No matching tasks found' : 'No live tasks available'}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs leading-relaxed">
        {isFiltered
          ? 'Try adjusting your search keywords or filter settings to discover more tasks.'
          : 'Check back soon! New partner tasks and high-reward campaigns are added regularly.'}
      </p>

      <div className="flex items-center gap-3">
        {isFiltered && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] text-sm font-semibold transition-all shadow-xs"
          >
            Reset Filters
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text-primary)] text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>
    </motion.div>
  );
}
