import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-9 h-9'
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sClass = sizeClasses[size] || sizeClasses.md;
  return <Loader2 className={`animate-spin text-primary ${sClass} ${className}`} />;
};
