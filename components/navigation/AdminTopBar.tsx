'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminTopBarProps {
  onOpenMobileSidebar?: () => void;
  pendingSubmissionsCount?: number;
}

export function AdminTopBar({
  onOpenMobileSidebar,
  pendingSubmissionsCount = 0,
}: AdminTopBarProps) {
  const { userProfile } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--surface)]/85 backdrop-blur-md border-b border-[var(--border)] dark:border-[var(--border)]/50 px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300">
      {/* Left Section: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open mobile navigation drawer"
          className="md:hidden p-2.5 rounded-[var(--radius-md)] text-[var(--ink-secondary)] dark:text-[var(--text-secondary)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-[var(--canvas-soft)] dark:hover:bg-white/[0.06] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-[var(--primary)] shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block truncate">
          <Breadcrumbs homeLabel="Admin" />
        </div>

        <div className="sm:hidden flex items-center gap-1.5 shrink-0">
          <Shield className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs font-bold font-heading text-[var(--ink)] dark:text-white">Admin Panel</span>
        </div>
      </div>

      {/* Middle Section: Search UI Placeholder */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
        <Input
          placeholder="Search tasks, users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-[var(--ink-mute)] dark:text-[var(--text-secondary)]" />}
          size="md"
          className="w-full text-xs bg-[var(--canvas-soft)]/50 dark:bg-black/10 border-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Right Section: Actions & Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle visual theme"
          className="p-2 rounded-[var(--radius-md)] text-[var(--ink-mute)] dark:text-[var(--text-secondary)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-[var(--canvas-soft)] dark:hover:bg-white/[0.06] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-[var(--lemon)]" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-[var(--ink-secondary)]" />
          )}
        </button>

        {/* Notifications Button UI Placeholder */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="p-2 rounded-[var(--radius-md)] text-[var(--ink-mute)] dark:text-[var(--text-secondary)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-[var(--canvas-soft)] dark:hover:bg-white/[0.06] active:scale-95 transition-all relative focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <Bell className="w-4.5 h-4.5" />
            {pendingSubmissionsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--ruby)] ring-2 ring-[var(--surface)] animate-pulse" />
            )}
          </button>

          {/* Simple Dropdown UI Preview for Notifications */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[var(--surface-elevated)] dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg p-4.5 z-50 text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)] dark:border-[var(--border)] font-bold text-[var(--ink)] dark:text-white">
                <span className="text-[12px] font-semibold tracking-wide">Admin Alerts</span>
                {pendingSubmissionsCount > 0 && (
                  <Badge variant="danger" size="sm" className="px-1.5">{pendingSubmissionsCount} Pending</Badge>
                )}
              </div>
              {pendingSubmissionsCount > 0 ? (
                <p className="text-[var(--ink-secondary)] dark:text-[var(--text-secondary)] text-[12px] leading-relaxed">
                  You have {pendingSubmissionsCount} pending task submissions waiting for verification in the queue.
                </p>
              ) : (
                <p className="text-[var(--ink-mute)] dark:text-[var(--text-secondary)]/75 text-[12px] leading-relaxed">
                  All task review queues are up to date.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Admin Avatar & Role Badge */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-[var(--hairline)] dark:border-[var(--border)]/40">
          <Avatar
            name={userProfile?.displayName || 'Admin'}
            src={userProfile?.photoURL || undefined}
            size="sm"
            className="ring-1 ring-[var(--border)] dark:ring-[var(--border)]/30"
          />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[12px] font-semibold text-[var(--ink)] dark:text-white truncate max-w-[120px] leading-none mb-1">
              {userProfile?.displayName || 'Administrator'}
            </span>
            <span className="text-[9px] text-[var(--primary)] dark:text-[var(--primary-soft)] font-bold tracking-wider leading-none uppercase">
              System Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
