'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BreadcrumbItemOverride {
  segment: string;
  label: string;
}

interface BreadcrumbsProps {
  className?: string;
  overrides?: BreadcrumbItemOverride[];
  homeLabel?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  'my-tasks': 'My Tasks',
  payment: 'Payment',
  profile: 'Profile',
  admin: 'Admin CMS',
  submissions: 'Submissions',
  users: 'Users',
  settings: 'Site Settings',
  login: 'Sign In',
  register: 'Register',
  'reset-password': 'Reset Password',
};

export function Breadcrumbs({
  className,
  overrides = [],
  homeLabel = 'Home',
}: BreadcrumbsProps) {
  const pathname = usePathname();

  if (!pathname || pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  const items = segments.map((segment, index) => {
    const itemHref = '/' + segments.slice(0, index + 1).join('/');

    const override = overrides.find((o) => o.segment === segment);
    const formattedLabel =
      override?.label ||
      ROUTE_LABELS[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    return {
      label: formattedLabel,
      href: itemHref,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center text-[13px] text-[var(--ink-mute)]', className)}
    >
      <ol className="flex items-center flex-wrap gap-2">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[var(--ink)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline-block font-medium">
              {homeLabel}
            </span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="inline-flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-mute-2)] shrink-0" aria-hidden="true" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-[var(--ink)] truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[var(--ink)] transition-colors font-medium truncate max-w-[120px] sm:max-w-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
