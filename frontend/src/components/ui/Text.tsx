import React from 'react';

export type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<TextSize, string> = {
  '2xs': 'text-[10px] leading-tight',
  xs: 'text-xs leading-normal',
  sm: 'text-sm leading-relaxed',
  md: 'text-base leading-relaxed',
  lg: 'text-lg leading-relaxed',
  xl: 'text-xl leading-relaxed',
  '2xl': 'text-2xl leading-snug'
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: React.ElementType;
  size?: TextSize;
  bold?: boolean;
  isTruncated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ as: Component = 'p', size = 'sm', bold = false, isTruncated = false, className = '', children, ...props }, ref) => {
    const sizeClasses = sizeMap[size] || sizeMap.sm;
    const weightClass = bold ? 'font-semibold' : 'font-normal';
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
Text.displayName = 'Text';
