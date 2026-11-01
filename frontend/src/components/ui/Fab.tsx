import React from 'react';

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placement?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const placementClasses = {
  'bottom-right': 'bottom-20 right-4',
  'bottom-left': 'bottom-20 left-4',
  'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
};

const sizeClasses = {
  sm: 'h-11 px-3 rounded-full',
  md: 'h-13 px-4 rounded-full',
  lg: 'h-15 px-5 rounded-full'
};

export const Fab: React.FC<FabProps> = ({
  placement = 'bottom-right',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const pClass = placementClasses[placement];
  const sClass = sizeClasses[size];

  return (
    <button
      type="button"
      className={`fixed ${pClass} z-40 bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-ring ${sClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const FabIcon: React.FC<{ as?: React.ElementType; className?: string }> = ({
  as: IconComponent,
  className = 'w-5 h-5'
}) => {
  if (!IconComponent) return null;
  return <IconComponent className={`shrink-0 ${className}`} />;
};

export const FabLabel: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children
}) => {
  return <span className={`text-xs font-semibold tracking-wide ${className}`}>{children}</span>;
};
