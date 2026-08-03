'use client';

import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { useOutsideClick } from '@/hooks/use-outside-click';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownSection {
  header?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  trigger: React.ReactNode;
  sections: DropdownSection[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  sections,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => setIsOpen(false));

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        }
      }}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1 min-w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg py-1 text-sm focus:outline-none overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
            role="menu"
          >
            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                {sIdx > 0 && <div className="h-[1px] bg-[var(--border)] my-1" />}
                {section.header && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    {section.header}
                  </div>
                )}
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left transition-colors font-medium',
                      item.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : item.danger
                        ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon && <span className="shrink-0 text-[var(--text-muted)]">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] ml-3 shrink-0">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
