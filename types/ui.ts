import React from 'react';

export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

export type Placement = 'top' | 'bottom' | 'left' | 'right';
