import React from 'react';

interface SavrLogoProps {
  className?: string;
  size?: number;
}

/**
 * Colorful modern geometric bookmark & architectural emblem.
 * Uses a vibrant multi-stop linear gradient (Indigo -> Violet -> Rose).
 */
export const SavrLogo: React.FC<SavrLogoProps> = ({ className = 'w-6 h-6', size }) => {
  const gradientId = 'savr-colorful-grad';
  const ribbonGradientId = 'savr-ribbon-grad';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={ribbonGradientId} x1="8" y1="3" x2="15" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Outer architectural frame with folded upper corner */}
      <path
        d="M4 3H16L20 7V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V3Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upper-right corner fold */}
      <path
        d="M16 3V7H20"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Precision bookmark ribbon with chevron cutout */}
      <path
        d="M8.5 3V14L11.5 11.5L14.5 14V3"
        fill={`url(#${ribbonGradientId})`}
      />
    </svg>
  );
};

interface SavrBrandProps {
  subtitle?: string;
  className?: string;
}

export const SavrBrand: React.FC<SavrBrandProps> = ({
  subtitle,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xs">
        <SavrLogo className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[15px] font-black tracking-[0.14em] uppercase bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-none">
            SAVR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
        </div>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground font-medium tracking-normal mt-0.5 leading-none">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
