import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={
          orientation === 'horizontal'
            ? `h-px w-full bg-border ${className}`
            : `w-px h-full bg-border self-stretch ${className}`
        }
        {...props}
      />
    );
  }
);
Divider.displayName = 'Divider';
