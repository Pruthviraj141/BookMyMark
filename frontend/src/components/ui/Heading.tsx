import React from 'react';

export type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

const sizeMap: Record<HeadingSize, string> = {
  xs: 'text-sm font-semibold tracking-tight',
  sm: 'text-base font-semibold tracking-tight',
  md: 'text-lg font-semibold tracking-tight',
  lg: 'text-xl font-bold tracking-tight',
  xl: 'text-2xl font-bold tracking-tight',
  '2xl': 'text-3xl font-extrabold tracking-tight',
  '3xl': 'text-4xl font-extrabold tracking-tight',
  '4xl': 'text-5xl font-extrabold tracking-tight',
  '5xl': 'text-6xl font-black tracking-tight'
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: HeadingSize;
  bold?: boolean;
  isTruncated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Component = 'h2', size = 'lg', bold = true, isTruncated = false, className = '', children, ...props }, ref) => {
    const sizeClasses = sizeMap[size] || sizeMap.lg;
    const weightClass = bold ? 'font-bold' : 'font-normal';
    const truncateClass = isTruncated ? 'truncate' : '';

    return (
      <Component
        ref={ref}
        className={`text-foreground ${sizeClasses} ${weightClass} ${truncateClass} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = 'Heading';
