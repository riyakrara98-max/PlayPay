'use client';

import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = 'single',
  defaultValue,
  children,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = (id: string) => {
    if (type === 'single') {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    } else {
      setOpenItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('flex flex-col border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden divide-y divide-[var(--border)]', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ id, children, className }: AccordionItemProps) {
  return (
    <div className={cn('bg-[var(--surface)] text-[var(--text-primary)]', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemId: id } as unknown as React.Attributes);
        }
        return child;
      })}
    </div>
  );
}

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  itemId?: string;
  children: React.ReactNode;
}

export function AccordionTrigger({ itemId = '', children, className, ...props }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const isOpen = context.openItems.includes(itemId);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemId)}
      aria-expanded={isOpen}
      className={cn(
        'w-full flex items-center justify-between p-4 text-left font-semibold text-sm transition-colors hover:bg-[var(--surface-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px]',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          'w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ml-2',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

export interface AccordionContentProps {
  itemId?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ itemId = '', children, className }: AccordionContentProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');

  const isOpen = context.openItems.includes(itemId);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={cn('p-4 pt-0 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
