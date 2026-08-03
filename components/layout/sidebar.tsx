'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  isCollapsed?: boolean;
  className?: string;
}

export function Sidebar({
  sections,
  header,
  footer,
  isCollapsed = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-200 h-full shrink-0',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header Slot */}
      {header && <div className="p-4 border-b border-[var(--border)] shrink-0">{header}</div>}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-1">
            {!isCollapsed && section.title && (
              <span className="px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {section.title}
              </span>
            )}
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] sm:min-h-0',
                  item.active
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                {item.icon && <span className="shrink-0 text-base">{item.icon}</span>}
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--primary)] text-[var(--primary-fg)]">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Slot */}
      {footer && <div className="p-3 border-t border-[var(--border)] shrink-0">{footer}</div>}
    </aside>
  );
}
