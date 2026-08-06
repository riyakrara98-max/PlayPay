'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={className}>{children}</div>;
}
