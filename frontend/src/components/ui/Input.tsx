import React, { createContext, useContext } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'underlined' | 'rounded';

interface InputContextType {
  size: InputSize;
  variant: InputVariant;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

const InputContext = createContext<InputContextType>({
  size: 'md',
  variant: 'outline'
});

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4'
};

export interface InputProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: InputSize;
  variant?: InputVariant;
  isInvalid?: boolean;
  isDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLDivElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      isInvalid = false,
      isDisabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const borderClass = isInvalid
      ? 'border-destructive focus-within:ring-destructive'
      : 'border-border focus-within:border-primary focus-within:ring-ring';

    const roundedClass = variant === 'rounded' ? 'rounded-full' : 'rounded-xl';

    return (
      <InputContext.Provider value={{ size, variant, isInvalid, isDisabled }}>
        <div
          ref={ref}
          className={`flex items-center w-full bg-card border ${borderClass} ${roundedClass} transition-colors focus-within:ring-1 ${
            isDisabled ? 'opacity-50 pointer-events-none' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </div>
      </InputContext.Provider>
    );
  }
);
Input.displayName = 'Input';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className = '', disabled, ...props }, ref) => {
    const { size, isDisabled } = useContext(InputContext);
    const sClass = sizeClasses[size] || sizeClasses.md;

    return (
      <input
        ref={ref}
        disabled={isDisabled || disabled}
        className={`flex-grow bg-transparent text-foreground placeholder:text-muted-foreground outline-none border-none ${sClass} ${className}`}
        {...props}
      />
    );
  }
);
InputField.displayName = 'InputField';

export interface InputSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  onPress?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const InputSlot: React.FC<InputSlotProps> = ({ onPress, className = '', children, ...props }) => {
  return (
    <div
      onClick={onPress}
      className={`flex items-center justify-center px-2.5 text-muted-foreground select-none ${
        onPress ? 'cursor-pointer hover:text-foreground active:scale-95 transition-all' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
InputSlot.displayName = 'InputSlot';

export interface InputIconProps {
  as?: React.ElementType;
  className?: string;
}

export const InputIcon: React.FC<InputIconProps> = ({ as: IconComponent, className = 'w-4 h-4' }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`shrink-0 ${className}`} />;
};
InputIcon.displayName = 'InputIcon';
