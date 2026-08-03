'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
  shrinkOnScroll?: boolean;
}

export function StickyHeader({
  children,
  className,
  shrinkOnScroll = true,
}: StickyHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!shrinkOnScroll) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shrinkOnScroll]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-200 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md',
        isScrolled ? 'h-14 shadow-xs' : 'h-16',
        className
      )}
    >
      <div className="h-full max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {children}
      </div>
    </header>
  );
}
