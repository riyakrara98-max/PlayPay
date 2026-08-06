'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileBarChart,
  Settings,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TeamLeaderRoute } from '@/components/auth/TeamLeaderRoute';
import { cn } from '@/utils/cn';

interface TeamLeaderLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/team-leader',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: 'My Tasks',
    href: '/team-leader/tasks',
    icon: CheckSquare,
    badge: null,
  },
  {
    label: 'My Members',
    href: '/team-leader/members',
    icon: Users,
    badge: null,
  },
  {
    label: 'Analytics',
    href: '/team-leader/analytics',
    icon: FileBarChart,
    badge: null,
  },
  {
    label: 'Reports',
    href: '/team-leader/reports',
    icon: FileBarChart,
    badge: null,
  },
  {
    label: 'Settings',
    href: '/team-leader/settings',
    icon: Settings,
    badge: null,
  },
];

export default function TeamLeaderLayout({ children }: TeamLeaderLayoutProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isUnauthorizedPage = pathname === '/team-leader/unauthorized';

  if (isUnauthorizedPage) {
    return <>{children}</>;
  }

  const leaderName = userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Team Leader';
  const leaderCode = userProfile?.leaderCode || userProfile?.teamLeaderCode || 'N/A';
  const teamSize = userProfile?.teamMemberCount ?? 0;

  return (
    <TeamLeaderRoute>
      <div className="min-h-screen bg-[var(--bg-app,#0f172a)] text-[var(--text-main,#f8fafc)] flex flex-col md:flex-row">
        {/* Mobile Header / Drawer Toggle */}
        <div className="md:hidden bg-[var(--bg-card,#1e293b)] border-b border-[var(--border-color,rgba(255,255,255,0.1))] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Return to Member App"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-slate-100">Team Leader Portal</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Navigation - Desktop & Mobile Drawer */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card,#1e293b)] border-r border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          {/* Header Info */}
          <div className="p-5 border-b border-[var(--border-color,rgba(255,255,255,0.1))]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 leading-tight truncate">{leaderName}</h2>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Team Leader
                </span>
              </div>
            </div>

            {/* Read-Only Stats Header */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Leader Code:</span>
                <span className="font-mono font-bold text-emerald-400">{leaderCode}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Team Size:</span>
                <span className="font-bold text-slate-200">{teamSize} members</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Return to Member App Link & Footer */}
          <div className="p-3 border-t border-[var(--border-color,rgba(255,255,255,0.1))] space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors border border-slate-700/60 min-h-[44px] sm:min-h-0"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Return to Member App</span>
            </Link>
            <div className="text-center text-[11px] text-slate-500 pt-1">
              Team Leader System v1.0
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </TeamLeaderRoute>
  );
}
