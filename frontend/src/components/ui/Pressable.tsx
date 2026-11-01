import React from 'react';

export interface PressableProps extends React.HTMLAttributes<HTMLDivElement> {
  onPress?: (event: React.MouseEvent<HTMLDivElement>) => void;
  isDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Pressable = React.forwardRef<HTMLDivElement, PressableProps>(
  ({ onPress, onClick, isDisabled = false, className = '', children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      onPress?.(e);
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            onPress?.(e as any);
          }
        }}
        className={`select-none cursor-pointer active:scale-[0.98] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isDisabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Pressable.displayName = 'Pressable';
