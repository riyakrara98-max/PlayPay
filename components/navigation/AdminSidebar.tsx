'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  Users,
  UserCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft,
  Sun,
  Moon,
  QrCode,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

export interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  pendingSubmissionsCount?: number;
  onItemClick?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({
  pendingSubmissionsCount = 0,
  onItemClick,
  isMobile = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      const saved = localStorage.getItem('playpay_admin_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isMobile) {
      queueMicrotask(() => {
        setIsCollapsed(false);
      });
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    if (isMobile) return;
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('playpay_admin_sidebar_collapsed', String(nextState));
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      // Handled by context
    }
  };

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      href: '/admin/tasks',
      label: 'Task Management',
      icon: <CheckSquare className="w-5 h-5 shrink-0" />,
    },
    {
      href: '/admin/submissions',
      label: 'Task Submissions',
      icon: <FileCheck className="w-5 h-5 shrink-0" />,
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: <Users className="w-5 h-5 shrink-0" />,
    },
    {
      href: '/admin/team-leaders',
      label: 'Team Leaders',
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
    },
    {
      href: '/admin/leader-codes',
      label: 'Leader Codes',
      icon: <QrCode className="w-5 h-5 shrink-0" />,
    },
    {
      href: '/admin/settings',
      label: 'Site Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-200 select-none',
        isMobile ? 'w-full border-r-0' : 'hidden md:flex fixed top-0 bottom-0 left-0 z-30',
        !isMobile && (isCollapsed ? 'w-16' : 'w-60')
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border)] shrink-0">
        <Link
          href="/admin/dashboard"
          onClick={onItemClick}
          className="flex items-center gap-3 overflow-hidden focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-md)]"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-bold shrink-0 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
               <span className="text-sm font-extrabold font-heading text-[var(--ink)] leading-none tracking-tight">
                PlayPay
              </span>
              <span className="text-[10px] font-semibold text-[var(--primary-soft)] uppercase tracking-wider mt-0.5">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle Button */}
        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}`));

          const linkContent = (
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-md)] text-[13px] font-medium transition-all min-h-[40px] relative group',
                isActive
                  ? 'bg-[var(--primary)]/[0.08] text-[var(--primary-deep)] dark:text-white font-semibold'
                  : 'text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--canvas-soft)] dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)] dark:hover:bg-white/[0.06]'
              )}
            >
              <div className={cn(
                'transition-transform duration-200 group-hover:scale-105 shrink-0',
                isActive ? 'text-[var(--primary)]' : 'text-[var(--ink-mute)] dark:text-[var(--text-secondary)]'
              )}>
                {item.icon}
              </div>
              {(!isCollapsed || isMobile) && (
                <span className="truncate flex-1 font-sans text-xs tracking-wide">{item.label}</span>
              )}
              {(!isCollapsed || isMobile) && item.badge !== undefined && (
                <Badge variant="danger" size="sm" className="ml-auto animate-pulse shadow-sm px-1.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );

          if (isCollapsed && !isMobile) {
            return (
              <Tooltip key={item.href} content={item.label} placement="right">
                {linkContent}
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[var(--hairline)] dark:border-[var(--border)] flex flex-col gap-2 shrink-0 bg-[var(--canvas-soft)]/50 dark:bg-white/[0.02]">
        {/* Return to Main App */}
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-[12px] font-medium text-[var(--ink-secondary)] dark:text-[var(--text-secondary)] hover:text-[var(--ink)] dark:hover:text-white hover:bg-[var(--canvas-cream)]/20 dark:hover:bg-white/[0.04] transition-colors',
            isCollapsed && !isMobile && 'justify-center px-2'
          )}
        >
          <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {(!isCollapsed || isMobile) && <span>Return to User App</span>}
        </Link>

        {/* User Info & Theme / Logout */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--hairline)] dark:border-[var(--border)]">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar
                name={userProfile?.displayName || 'Admin'}
                src={userProfile?.photoURL || undefined}
                size="sm"
                className="ring-1 ring-[var(--border)] dark:ring-[var(--border)]/30"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[12px] font-semibold text-[var(--ink)] dark:text-white truncate leading-none mb-1">
                  {userProfile?.displayName || 'Administrator'}
                </span>
                <span className="text-[10px] text-[var(--ink-mute)] dark:text-[var(--text-secondary)] truncate leading-none">
                  {userProfile?.email || 'admin@playpay.com'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-md)] text-[var(--ink-mute)] dark:text-[var(--text-secondary)] hover:bg-[var(--canvas-soft)] dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--lemon)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--ink-secondary)]" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-[var(--radius-md)] text-[var(--ruby)] hover:bg-[var(--ruby)]/10 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
