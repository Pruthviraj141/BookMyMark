import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-border shadow-sm',
  elevated: 'bg-card shadow-md border border-border/50',
  outlined: 'bg-transparent border border-border',
  filled: 'bg-muted border border-transparent'
};

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-2.5 rounded-xl',
  md: 'p-4 rounded-2xl',
  lg: 'p-6 rounded-3xl'
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const vClass = variantClasses[variant] || variantClasses.default;
    const sClass = sizeClasses[size] || sizeClasses.md;

    return (
      <div
        ref={ref}
        className={`${vClass} ${sClass} text-card-foreground transition-all ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
