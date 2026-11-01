import React from 'react';
import { MessageSquare, Video, Globe } from 'lucide-react';
import type { Platform } from '../types/index.js';

interface PlatformBadgeProps {
  platform: Platform;
  showLabel?: boolean;
  className?: string;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const RedditIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .868.181 1.17.476 1.19-.853 2.84-1.416 4.658-1.49l.865-4.053 3.25.684a1.246 1.246 0 0 1 1.285-.623zM9.25 12C8.56 12 8 12.56 8 13.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25S9.94 12 9.25 12zm5.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm-5.465 4.01a.502.502 0 0 0-.2.693c.53.94 1.63 1.547 2.915 1.547 1.286 0 2.385-.607 2.915-1.547a.5.5 0 0 0-.868-.496c-.36.638-1.168 1.043-2.047 1.043-.88 0-1.687-.405-2.047-1.043a.5.5 0 0 0-.668-.197z" />
  </svg>
);

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  showLabel = false,
  className = ''
}) => {
  const baseClasses = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-tight shadow-xs select-none";

  switch (platform) {
    case 'instagram':
      return (
        <span className={`${baseClasses} bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white ${className}`}>
          <InstagramIcon className="w-2.5 h-2.5 text-white" />
          {showLabel && <span>Instagram</span>}
        </span>
      );
    case 'x':
      return (
        <span className={`${baseClasses} bg-black text-white border border-white/20 ${className}`}>
          <XTwitterIcon className="w-2.5 h-2.5 text-white" />
          {showLabel && <span>X</span>}
        </span>
      );
    case 'youtube':
      return (
        <span className={`${baseClasses} bg-[#FF0000] text-white ${className}`}>
          <YouTubeIcon className="w-2.5 h-2.5 text-white" />
          {showLabel && <span>YouTube</span>}
        </span>
      );
    case 'reddit':
      return (
        <span className={`${baseClasses} bg-[#FF4500] text-white ${className}`}>
          <RedditIcon className="w-2.5 h-2.5 text-white" />
          {showLabel && <span>Reddit</span>}
        </span>
      );
    case 'tiktok':
      return (
        <span className={`${baseClasses} bg-[#010101] text-white border border-cyan-400/40 ${className}`}>
          <Video className="w-2.5 h-2.5 text-cyan-400" />
          {showLabel && <span>TikTok</span>}
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-blue-600 text-white ${className}`}>
          <Globe className="w-2.5 h-2.5 text-white" />
          {showLabel && <span>Web</span>}
        </span>
      );
  }
};
