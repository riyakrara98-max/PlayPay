'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export function Avatar({
  src,
  alt = 'Avatar',
  name,
  fallback,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (n?: string, fb?: string) => {
    const textToUse = n || fb;
    if (!textToUse) return 'U';
    const parts = textToUse.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return textToUse.slice(0, 2).toUpperCase();
  };

  const sizeClasses: Record<AvatarSize, { container: string; text: string; status: string }> = {
    sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2 ring-1' },
    md: { container: 'w-10 h-10', text: 'text-sm font-semibold', status: 'w-2.5 h-2.5 ring-2' },
    lg: { container: 'w-12 h-12', text: 'text-base font-bold', status: 'w-3 h-3 ring-2' },
    xl: { container: 'w-16 h-16', text: 'text-lg font-bold', status: 'w-4 h-4 ring-2' },
  };

  const statusColors = {
    online: 'bg-[var(--success)]',
    offline: 'bg-[var(--text-muted)]',
    busy: 'bg-[var(--danger)]',
    away: 'bg-[var(--warning)]',
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] select-none',
          sizeClasses[size].container,
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            fill
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="object-cover"
          />
        ) : (
          <span className={cn('uppercase font-mono', sizeClasses[size].text)}>
            {getInitials(name, fallback)}
          </span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-[var(--surface)]',
            sizeClasses[size].status,
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
