import React, { useState, useEffect } from 'react';
import { PlatformBadge } from './PlatformBadge.js';
import { formatRelativeTime } from '../utils/date.js';
import { AlertCircle, Loader2, Heart } from 'lucide-react';
import { api, type LinkPreviewData } from '../services/api.js';
import { cleanCaption } from '../utils/text.js';
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

// Single high-performance shared IntersectionObserver for all cards
type ObserverCallback = () => void;
const observerCallbacks = new Map<Element, ObserverCallback>();
let sharedObserverInstance: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!sharedObserverInstance) {
    sharedObserverInstance = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = observerCallbacks.get(entry.target);
            if (cb) {
              cb();
              observerCallbacks.delete(entry.target);
              sharedObserverInstance?.unobserve(entry.target);
            }
          }
        }
      },
      { rootMargin: '350px' }
    );
  }
  return sharedObserverInstance;
}

function observeNearViewport(element: Element, callback: ObserverCallback): () => void {
  const observer = getSharedObserver();
  if (!observer) {
    callback();
    return () => {};
  }
  observerCallbacks.set(element, callback);
  observer.observe(element);
  return () => {
    observerCallbacks.delete(element);
    observer.unobserve(element);
  };
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: (bookmark: Bookmark) => void;
  onToggleFavorite?: (bookmark: Bookmark) => void;
}

const BookmarkCardInner: React.FC<BookmarkCardProps> = ({ bookmark, onClick, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(bookmark.platform === 'youtube');
  const cardRef = React.useRef<HTMLDivElement>(null);

  const targetUrl = bookmark.url || bookmark.original_url || '';

  // 1. Shared IntersectionObserver: Trigger preview fetch when approaching viewport
  useEffect(() => {
    if (bookmark.platform === 'youtube' || !cardRef.current) {
      setIsNearViewport(true);
      return;
    }

    return observeNearViewport(cardRef.current, () => {
      setIsNearViewport(true);
    });
  }, [bookmark.platform]);

  // 2. Fetch link preview data
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

  // Use preview imageUrl or legacy thumbnail
  const activeImageUrl = !imageError ? preview?.imageUrl || bookmark.thumbnail_url : null;

  // Natural aspect ratio: portrait for Reels/TikTok, landscape for YouTube/Web
  const isPortraitContent = bookmark.platform === 'instagram' || bookmark.platform === 'tiktok';
  const aspectClass = isPortraitContent ? 'aspect-[4/5]' : 'aspect-video';

  const cleanHost = (() => {
    try {
      return new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      return bookmark.platform;
    }
  })();

  const isUrl = (s?: string | null) => Boolean(s && (s.startsWith('http://') || s.startsWith('https://') || s.includes('://')));

  const getCleanTitle = () => {
    const raw = bookmark.title || preview?.title || bookmark.shared_text;
    const cleaned = cleanCaption(raw);
    if (cleaned && !isUrl(cleaned)) return cleaned.slice(0, 90);
    switch (bookmark.platform) {
      case 'instagram': return 'Instagram Reel';
      case 'x': return 'X Post';
      case 'youtube': return 'YouTube Video';
      case 'reddit': return 'Reddit Post';
      case 'tiktok': return 'TikTok Video';
      default: return cleanHost || 'Saved Bookmark';
    }
  };

  const displayTitle = getCleanTitle();
  const rawSummary = bookmark.summary || preview?.description || bookmark.description;
  const displaySummary = cleanCaption(rawSummary);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(bookmark)}
      className="group flex flex-col bg-card/60 hover:bg-card/90 active:scale-[0.985] transition-all duration-150 cursor-pointer mb-3 select-none rounded-[16px] border border-border/80 shadow-2xs p-2 overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Editorial Cover Image Container */}
      <div className={`relative w-full ${aspectClass} rounded-[10px] bg-muted/40 overflow-hidden flex items-center justify-center border border-border/40`}>
        {activeImageUrl ? (
          <img
            src={activeImageUrl}
            alt={displayTitle || 'Bookmark preview'}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : !preview && isNearViewport ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-muted/30 relative">
            <PlatformBadge platform={bookmark.platform} showLabel={false} className="opacity-40 mb-1" />
            <div className="w-2/3 h-2.5 bg-muted rounded mb-1.5" />
            <div className="w-1/2 h-2 bg-muted/60 rounded" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-muted/20 relative">
            <PlatformBadge platform={bookmark.platform} showLabel={false} className="opacity-70 mb-1.5" />
            <span className="text-xs text-foreground font-medium truncate max-w-[85%]">
              {displayTitle}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {cleanHost}
            </span>
          </div>
        )}

        {/* Tiny monochrome platform identifier in corner */}
        <div className="absolute top-2 left-2 z-10">
          <PlatformBadge platform={bookmark.platform} />
        </div>

        {/* Quiet favorite toggle (monochrome black/white) */}
        {onToggleFavorite && bookmark.is_favorite && (
          <div className="absolute top-2 right-2 z-10 p-1 rounded-md bg-background/85 text-foreground backdrop-blur-xs border border-border/80 shadow-2xs">
            <Heart className="w-3 h-3 fill-foreground text-foreground" />
          </div>
        )}

        {/* Subtle AI status indicator */}
        {bookmark.ai_status === 'processing' && (
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono text-muted-foreground border border-border flex items-center gap-1 shadow-2xs">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-foreground" />
            <span>AI</span>
          </div>
        )}
        {bookmark.ai_status === 'failed' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              api.bookmarks.reprocess(bookmark.id).catch(() => {});
            }}
            title="Retry AI"
            className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono text-muted-foreground border border-border flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Editorial Typography & Metadata with Enhanced Readability */}
      <div className="pt-2 px-1 pb-0.5 flex flex-col flex-grow">
        {/* Category label */}
        {bookmark.category && bookmark.category !== 'Other' && (
          <span className="text-[10.5px] font-mono tracking-wider uppercase text-muted-foreground/90 font-medium mb-1">
            {bookmark.category}
          </span>
        )}

        {/* Bookmark Title: High contrast, prominent font-semibold, comfortable line height */}
        <h3 className="text-[14px] sm:text-[15px] font-semibold text-foreground line-clamp-2 leading-[1.3] tracking-tight">
          {displayTitle}
        </h3>

        {/* Short description: comfortable reading size, balanced contrast */}
        {displaySummary && (
          <p className="text-[12.5px] text-muted-foreground font-normal line-clamp-2 leading-relaxed mt-1">
            {displaySummary}
          </p>
        )}

        {/* Subtle saved-time information */}
        <span className="text-[10.5px] text-muted-foreground/70 font-mono mt-2">
          {formatRelativeTime(bookmark.created_at)}
        </span>
      </div>
    </div>
  );
};

// React.memo to eliminate redundant card re-renders during fast scrolling
export const BookmarkCard = React.memo(BookmarkCardInner, (prev, next) => {
  return (
    prev.bookmark.id === next.bookmark.id &&
    prev.bookmark.is_favorite === next.bookmark.is_favorite &&
    prev.bookmark.ai_status === next.bookmark.ai_status &&
    prev.bookmark.title === next.bookmark.title &&
    prev.bookmark.summary === next.bookmark.summary &&
    prev.bookmark.description === next.bookmark.description &&
    prev.bookmark.thumbnail_url === next.bookmark.thumbnail_url
  );
});
