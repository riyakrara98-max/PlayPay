'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  Sun,
  Moon,
  Menu,
  User,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  CheckSquare,
  CreditCard,
  Search,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Drawer } from '@/components/ui/drawer';
import { SearchOverlayModal } from '@/components/tasks/SearchOverlayModal';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);


  const isAdmin = userProfile?.role === 'admin';
  const isTeamLeader = userProfile?.memberType === 'team_leader' || (userProfile?.role as string) === 'team_leader';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/my-tasks', label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { href: '/payment', label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
    { href: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];
  
  const publicNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/#tasks-section', label: 'Tasks' },
    { href: '/#how-it-works', label: 'How it Works' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      // Logout error handled by context
    }
  };

  const profileDropdownSections = currentUser
    ? [
        {
          header: userProfile?.displayName || currentUser.email || 'Authenticated User',
          items: [
            {
              id: 'profile',
              label: 'My Account Profile',
              icon: <User className="w-4 h-4" />,
              onClick: () => router.push('/profile'),
            },
            ...(isTeamLeader
              ? [
                  {
                    id: 'team-leader',
                    label: 'Team Leader Portal',
                    icon: <ShieldCheck className="w-4 h-4 text-[var(--success)]" />,
                    onClick: () => router.push('/team-leader'),
                  },
                ]
              : []),
            ...(isAdmin
              ? [
                  {
                    id: 'admin',
                    label: 'Admin Control Center',
                    icon: <ShieldAlert className="w-4 h-4 text-[var(--warning)]" />,
                    onClick: () => router.push('/admin/dashboard'),
                  },
                ]
              : []),
          ],
        },
        {
          items: [
            {
              id: 'logout',
              label: 'Sign Out',
              icon: <LogOut className="w-4 h-4" />,
              danger: true,
              onClick: handleLogout,
            },
          ],
        },
      ]
    : [];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--surface)]/85 backdrop-blur-md border-b border-[var(--border)] transition-colors">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <Link
            href={currentUser ? '/dashboard' : '/'}
            className="flex items-center gap-3 shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-[var(--radius-md)]"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] text-[var(--primary-fg)] font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
                PlayPay
              </span>
              {isTeamLeader && !isAdmin && (
                <Badge variant="success" size="sm">
                  Team Leader
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="accent" size="sm">
                  Admin
                </Badge>
              )}
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1">
              {currentUser ? navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] transition-colors',
                      isActive
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                    )}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              }) : publicNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300',
                      isActive
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                    )}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

          {/* Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Icon (Opens Search Overlay) */}
            <IconButton
              icon={<Search className="w-4 h-4 text-[var(--text-primary)]" />}
              aria-label="Search app tasks"
              variant="ghost"
              size="md"
              onClick={() => setSearchOpen(true)}
            />

            {/* Theme Switcher */}
            <IconButton
              icon={
                resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )
              }
              aria-label="Toggle theme"
              variant="ghost"
              size="md"
              onClick={toggleTheme}
            />


            {/* Switch to Team Leader Portal (Desktop) */}
            {currentUser && isTeamLeader && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex items-center gap-1.5 border-[var(--success)]/30 text-[var(--success)] hover:bg-[var(--success)]/10 font-bold"
                asChild
              >
                <Link href="/team-leader">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Team Leader Portal</span>
                </Link>
              </Button>
            )}

            {/* Profile Dropdown / Sign In Trigger */}
            {currentUser ? (
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                  >
                    <Avatar
                      name={userProfile?.displayName || currentUser.email || 'User'}
                      src={userProfile?.photoURL || currentUser.photoURL || undefined}
                      size="sm"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pr-1" />
                  </button>
                }
                sections={profileDropdownSections}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Menu Drawer Toggle */}
            <div className="md:hidden">
                <IconButton
                  icon={<Menu className="w-5 h-5" />}
                  aria-label="Open mobile navigation menu"
                  variant="ghost"
                  size="md"
                  onClick={() => setMobileMenuOpen(true)}
                />
              </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="PlayPay Navigation"
        position="right"
        size="sm"
      >
        <div className="flex flex-col gap-2 py-2">
          {currentUser ? navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          }) : publicNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-xl transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}

          {isTeamLeader && (
            <Link
              href="/team-leader"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)] text-[var(--success)] bg-[var(--success)]/10 transition-colors min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Team Leader Portal</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)] text-[var(--warning)] bg-[var(--warning)]/10 transition-colors min-h-[44px]"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin CMS</span>
            </Link>
          )}

          <div className="my-2 border-t border-[var(--border)]" />

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </Drawer>

      {/* Global Search Overlay Modal */}
      <SearchOverlayModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
