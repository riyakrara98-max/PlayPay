'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-t border-[var(--border)] sm:hidden flex items-center justify-around px-2 py-1 select-none shadow-lg',
        className
      )}
    >
      {items.map((item) => {
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 text-[10px] font-medium transition-colors min-h-[48px] rounded-[var(--radius-md)]',
              item.active
                ? 'text-[var(--primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <div className="relative flex items-center justify-center">
              <span className="text-lg mb-0.5">{item.icon}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-[var(--danger)] text-white min-w-[14px] text-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="truncate max-w-[64px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
