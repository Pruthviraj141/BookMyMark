import React, { useState, useEffect } from 'react';
import { PlatformBadge } from './PlatformBadge.js';
import { formatRelativeTime } from '../utils/date.js';
import { Sparkles, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { api, type LinkPreviewData } from '../services/api.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import type { Bookmark } from '../types/index.js';

// In-memory preview cache for the current session (never saved to database)
const previewMemoryCache = new Map<string, Promise<LinkPreviewData | null>>();

function getCachedLinkPreview(url: string): Promise<LinkPreviewData | null> {
  let promise = previewMemoryCache.get(url);
  if (!promise) {
    promise = api.bookmarks.getLinkPreview(url);
    previewMemoryCache.set(url, promise);
  }
  return promise;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: (bookmark: Bookmark) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const targetUrl = bookmark.url || bookmark.original_url || '';

  // 1. IntersectionObserver: Only trigger preview fetch when approaching viewport (200px rootMargin)
  useEffect(() => {
    // YouTube thumbnails are generated client-side with zero network calls, resolve immediately
    if (bookmark.platform === 'youtube') {
      setIsNearViewport(true);
      return;
    }

    if (!cardRef.current || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
    };
  }, [bookmark.platform]);

  // 2. Request link preview only when approaching viewport
  useEffect(() => {
    if (!isNearViewport || !targetUrl) return;

    let isMounted = true;
    getCachedLinkPreview(targetUrl)
      .then((data) => {
        if (isMounted && data) {
          setPreview(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isNearViewport, targetUrl]);

  // Use preview imageUrl (in-memory) or legacy thumbnail
  const activeImageUrl = !imageError ? preview?.imageUrl || bookmark.thumbnail_url : null;

  // Natural aspect ratio: portrait for Instagram Reels/TikTok, landscape for YouTube/Web
  const isPortraitContent = bookmark.platform === 'instagram' || bookmark.platform === 'tiktok';
  const aspectClass = isPortraitContent ? 'aspect-[4/5]' : 'aspect-video';

  const cleanHost = (() => {
    try {
      return new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      return bookmark.platform;
    }
  })();

  const displayTitle = preview?.title || bookmark.title || bookmark.shared_text || cleanHost;
  const displaySummary = bookmark.summary || preview?.description || bookmark.description;

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(bookmark)}
      className="group flex flex-col bg-[#161822] hover:bg-[#1c1e2a] active:scale-[0.98] transition-all duration-200 rounded-2xl overflow-hidden border border-[#272a38] hover:border-violet-500/40 shadow-lg shadow-black/40 cursor-pointer mb-3 select-none"
    >
      {/* Prominent Cover Image or Clean Fallback */}
      <div className={`relative w-full ${aspectClass} bg-[#0e1017] overflow-hidden flex items-center justify-center`}>
        {activeImageUrl ? (
          <img
            src={activeImageUrl}
            alt={displayTitle || 'Bookmark preview'}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : !preview && isNearViewport ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#13151f] animate-pulse relative">
            <PlatformBadge platform={bookmark.platform} showLabel={false} className="scale-110 mb-2 opacity-60" />
            <div className="w-3/4 h-3 bg-zinc-800 rounded-md mb-2"></div>
            <div className="w-1/2 h-2.5 bg-zinc-800/60 rounded-md"></div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#1a1c28] to-[#0f1017] relative">
            <PlatformBadge platform={bookmark.platform} showLabel={false} className="scale-125 mb-2 shadow-md" />
            <span className="text-xs text-zinc-300 font-medium truncate max-w-[85%]">
              {displayTitle}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono mt-1">
              {cleanHost}
            </span>
          </div>
        )}

        {/* Platform badge overlay */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <PlatformBadge platform={bookmark.platform} />
        </div>

        {/* Quick Open in Native App Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            NativeSessionBridge.openAppUrl(targetUrl);
          }}
          title="Open in native app"
          className="absolute bottom-2.5 right-2.5 z-20 p-2 rounded-xl bg-black/65 hover:bg-violet-600 active:scale-95 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 shadow-lg transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* AI processing status indicator */}
        {bookmark.ai_status === 'processing' && (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] text-purple-300 border border-purple-500/40 shadow-md">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-400" />
            <span>AI Enriching</span>
          </div>
        )}
        {bookmark.ai_status === 'pending' && (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-zinc-300 border border-zinc-700/60 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Queued</span>
          </div>
        )}
        {bookmark.ai_status === 'failed' && (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md p-1 rounded-full text-red-400 border border-red-500/40">
            <AlertCircle className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug mb-1.5 group-hover:text-violet-300 transition-colors">
          {displayTitle}
        </h3>

        {/* Description or Summary */}
        {displaySummary && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
            {displaySummary}
          </p>
        )}

        {/* Category Pill */}
        {bookmark.category && bookmark.category !== 'Other' && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/40">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              {bookmark.category}
            </span>
          </div>
        )}

        {/* Topic Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {bookmark.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50"
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
        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/70">
          <span>{formatRelativeTime(bookmark.created_at)}</span>
          <span className="font-mono text-[10px] text-zinc-600">{cleanHost}</span>
        </div>
      </div>
    </div>
  );
};
