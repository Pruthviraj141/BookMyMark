import React from 'react';

export interface SwitchProps {
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
  isDisabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch: React.FC<SwitchProps> = ({
  isChecked,
  onToggle,
  isDisabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeConfig = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-7' }
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={isDisabled}
      onClick={() => onToggle(!isChecked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isChecked ? 'bg-primary' : 'bg-muted border border-border'
      } ${sizeConfig.track} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
          sizeConfig.thumb
        } ${isChecked ? sizeConfig.translate : 'translate-x-0'}`}
      />
    </button>
  );
};
