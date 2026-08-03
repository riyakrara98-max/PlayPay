'use client';

import React, { useState } from 'react';
import { Sun, Moon, Menu, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/use-theme';
import { IconButton } from '../ui/icon-button';
import { Drawer } from '../ui/drawer';
import { Badge } from '../ui/badge';

export interface NavLinkItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

export interface NavbarProps {
  brandName?: string;
  logoIcon?: React.ReactNode;
  links?: NavLinkItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function Navbar({
  brandName = 'PlayPay',
  logoIcon,
  links = [],
  actions,
  className,
}: NavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors',
          className
        )}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] text-[var(--primary-fg)] font-bold shadow-sm">
              {logoIcon || <Layers className="w-5 h-5" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-heading text-[var(--text-primary)] tracking-tight">
                {brandName}
              </span>
              <Badge variant="accent" size="sm">Phase 1A</Badge>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={link.onClick}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] transition-colors',
                  link.active
                    ? 'bg-[var(--surface-elevated)] text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]/50'
                )}
              >
                {link.icon && <span className="shrink-0">{link.icon}</span>}
                <span>{link.label}</span>
                {link.badge && (
                  <Badge variant="primary" size="sm">
                    {link.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Right Actions & Controls */}
          <div className="flex items-center gap-2">
            {/* Custom Action Slot */}
            {actions}

            {/* Theme Toggle Button */}
            <IconButton
              icon={
                resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )
              }
              aria-label="Toggle light/dark theme"
              variant="ghost"
              size="md"
              onClick={toggleTheme}
            />

            {/* Mobile Hamburger Menu Toggle */}
            <div className="md:hidden">
              <IconButton
                icon={<Menu className="w-5 h-5" />}
                aria-label="Open menu"
                variant="ghost"
                size="md"
                onClick={() => setMobileMenuOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={brandName}
        position="right"
        size="sm"
      >
        <div className="flex flex-col gap-2 py-2">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                link.onClick?.();
                setMobileMenuOpen(false);
              }}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] text-left transition-colors min-h-[44px]',
                link.active
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
              )}
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && <Badge variant="primary" size="sm">{link.badge}</Badge>}
            </button>
          ))}
        </div>
      </Drawer>
    </>
  );
}
