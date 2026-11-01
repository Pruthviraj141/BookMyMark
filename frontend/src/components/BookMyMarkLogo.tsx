import React from 'react';

interface BookMyMarkLogoProps {
  className?: string;
  size?: number;
}

/**
 * BookMyMark Official Geometric Emblem
 * A clean architectural bookmark silhouette cut with precision negative space.
 * 100% vector, crisp at all resolutions.
 */
export const BookMyMarkLogo: React.FC<BookMyMarkLogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Outer book card silhouette */}
      <rect x="8" y="4" width="32" height="40" rx="5" fill="currentColor" />
      {/* Precision negative-space bookmark ribbon with chevron cutout */}
      <path d="M17 4H31V25L24 19.5L17 25V4Z" fill="var(--color-background, #FFFFFF)" />
      {/* Knowledge index bars in negative space */}
      <rect x="16" y="30" width="16" height="2.5" rx="1.25" fill="var(--color-background, #FFFFFF)" />
      <rect x="16" y="35.5" width="10" height="2.5" rx="1.25" fill="var(--color-background, #FFFFFF)" />
    </svg>
  );
};

interface BookMyMarkBrandProps {
  subtitle?: string;
  className?: string;
}

export const BookMyMarkBrand: React.FC<BookMyMarkBrandProps> = ({
  subtitle,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-2xs">
        <BookMyMarkLogo className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-[15px] font-bold tracking-tight text-foreground leading-none">
          BookMyMark
        </span>
        {subtitle && (
          <span className="text-[10.5px] text-muted-foreground font-normal tracking-normal mt-0.5 leading-none">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
