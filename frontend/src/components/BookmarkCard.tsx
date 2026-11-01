import React, { useState } from 'react';
import { PlatformBadge } from './PlatformBadge.js';
import { formatRelativeTime } from '../utils/date.js';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import type { Bookmark } from '../types/index.js';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: (bookmark: Bookmark) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onClick }) => {
  const [imageError, setImageError] = useState(false);

  const displayThumbnail = !imageError && bookmark.thumbnail_url;

  return (
    <div
      onClick={() => onClick(bookmark)}
      className="group flex flex-col bg-[#16181f] hover:bg-[#1c1e28] active:scale-[0.98] transition-all duration-150 rounded-2xl overflow-hidden border border-[#272936] shadow-md cursor-pointer mb-3 select-none"
    >
      {/* Thumbnail or Fallback */}
      <div className="relative w-full aspect-video sm:aspect-square bg-[#101116] overflow-hidden flex items-center justify-center">
        {displayThumbnail ? (
          <img
            src={bookmark.thumbnail_url!}
            alt={bookmark.title || 'Bookmark preview'}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#1a1c26] to-[#0f1017]">
            <PlatformBadge platform={bookmark.platform} showLabel={false} className="scale-125 mb-2" />
            <span className="text-xs text-zinc-400 font-mono truncate max-w-full">
              {new URL(bookmark.url).hostname.replace('www.', '')}
            </span>
          </div>
        )}

        {/* Platform badge overlay */}
        <div className="absolute top-2 left-2 z-10">
          <PlatformBadge platform={bookmark.platform} />
        </div>

        {/* AI processing status indicator */}
        {bookmark.ai_status === 'processing' && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-purple-300 border border-purple-500/30">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>AI Analyzing</span>
          </div>
        )}
        {bookmark.ai_status === 'pending' && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-zinc-400 border border-zinc-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Queued</span>
          </div>
        )}
        {bookmark.ai_status === 'failed' && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-red-400 border border-red-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug mb-1">
          {bookmark.title || bookmark.shared_text || bookmark.url}
        </h3>

        {/* Description or Summary */}
        {(bookmark.summary || bookmark.description) && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
            {bookmark.summary || bookmark.description}
          </p>
        )}

        {/* Category Pill */}
        {bookmark.category && bookmark.category !== 'Other' && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              {bookmark.category}
            </span>
          </div>
        )}

        {/* Topic Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {bookmark.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded-md border border-zinc-700/40"
              >
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-[10px] text-zinc-500 self-center">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer info: saved date */}
        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60">
          <span>{formatRelativeTime(bookmark.created_at)}</span>
        </div>
      </div>
    </div>
  );
};
