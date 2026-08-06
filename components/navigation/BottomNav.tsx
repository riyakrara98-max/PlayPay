'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutDashboard, CheckSquare, CreditCard, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function BottomNav() {
  const pathname = usePathname();

  const items: BottomNavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'my-tasks',
      label: 'Tasks',
      href: '/my-tasks',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      id: 'payment',
      label: 'Payment',
      href: '/payment',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/90 backdrop-blur-lg border-t border-[var(--border)] px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 transition-transform duration-200"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[64px] min-h-[48px] rounded-[var(--radius-lg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]',
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 bg-[var(--primary)]/10 rounded-[var(--radius-lg)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10 shrink-0">{item.icon}</span>
              <span className="relative z-10 text-[10px] font-medium tracking-tight mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
