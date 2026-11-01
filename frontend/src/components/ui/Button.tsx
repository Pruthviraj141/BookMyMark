import React, { createContext, useContext } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'default' | 'solid' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonContextType {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
}

const ButtonContext = createContext<ButtonContextType>({
  variant: 'default',
  size: 'md'
});

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]',
  solid: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]',
  outline: 'border border-border bg-transparent text-foreground hover:bg-muted active:scale-[0.98]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
  ghost: 'bg-transparent text-foreground hover:bg-muted active:scale-[0.98]',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]',
  link: 'bg-transparent text-primary hover:underline p-0 h-auto'
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-xl gap-2',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-2xl gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center items-center'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isDisabled = false,
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = isDisabled || disabled || isLoading;
    const vClass = variantClasses[variant] || variantClasses.default;
    const sClass = sizeClasses[size] || sizeClasses.md;

    return (
      <ButtonContext.Provider value={{ variant, size, disabled: isActuallyDisabled }}>
        <button
          ref={ref}
          disabled={isActuallyDisabled}
          className={`inline-flex items-center justify-center font-medium select-none cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${vClass} ${sClass} ${className}`}
          {...props}
        >
          {isLoading && <ButtonSpinner className="w-4 h-4" />}
          {children}
        </button>
      </ButtonContext.Provider>
    );
  }
);
Button.displayName = 'Button';

export interface ButtonTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: React.ReactNode;
}

export const ButtonText: React.FC<ButtonTextProps> = ({ className = '', children, ...props }) => {
  return (
    <span className={`inline-block truncate ${className}`} {...props}>
      {children}
    </span>
  );
};
ButtonText.displayName = 'ButtonText';

export interface ButtonIconProps {
  as?: React.ElementType;
  className?: string;
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({ as: IconComponent, className = 'w-4 h-4' }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`shrink-0 ${className}`} />;
};
ButtonIcon.displayName = 'ButtonIcon';

export interface ButtonSpinnerProps {
  className?: string;
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({ className = 'w-4 h-4' }) => {
  return <Loader2 className={`animate-spin shrink-0 ${className}`} />;
};
ButtonSpinner.displayName = 'ButtonSpinner';
