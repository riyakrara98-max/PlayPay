'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  fullWidth?: boolean;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className,
}: TabsProps) {
  const layoutGroupId = React.useId();

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 select-none overflow-x-auto scrollbar-none',
        variant === 'segmented' && 'bg-[var(--canvas-soft)] p-1 rounded-[var(--radius-lg)] border border-[var(--hairline)]',
        variant === 'underline' && 'border-b border-[var(--hairline)]',
        fullWidth && 'w-full justify-between',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0 min-h-[44px] sm:min-h-0',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              isActive
                ? 'text-[var(--ink)] font-semibold'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]',
              variant === 'pills' && isActive && 'bg-[var(--primary)] text-white rounded-[var(--radius-md)]',
              variant === 'segmented' && isActive && 'bg-[var(--surface)] text-[var(--ink)] shadow-sm rounded-[var(--radius-md)]',
              fullWidth && 'flex-1'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}

            {variant === 'underline' && isActive && (
              <motion.div
                layoutId={`active-tab-underline-${layoutGroupId}`}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
