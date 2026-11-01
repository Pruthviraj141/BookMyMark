import React from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'accent' | 'success' | 'warning' | 'destructive';
export type BadgeSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border border-primary/25',
  secondary: 'bg-secondary text-secondary-foreground border border-border',
  outline: 'bg-transparent text-foreground border border-border',
  accent: 'bg-accent/15 text-accent border border-accent/30',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  destructive: 'bg-destructive/15 text-destructive border border-destructive/25'
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] rounded-md gap-1',
  md: 'px-2 py-0.5 text-xs rounded-lg gap-1.5',
  lg: 'px-2.5 py-1 text-xs rounded-xl gap-2'
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const vClass = variantClasses[variant] || variantClasses.default;
  const sClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center font-medium ${vClass} ${sClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BadgeTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: React.ReactNode;
}

export const BadgeText: React.FC<BadgeTextProps> = ({ className = '', children, ...props }) => {
  return (
    <span className={`inline-block truncate ${className}`} {...props}>
      {children}
    </span>
  );
};

export interface BadgeIconProps {
  as?: React.ElementType;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ as: IconComponent, className = 'w-3 h-3' }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`shrink-0 ${className}`} />;
};
