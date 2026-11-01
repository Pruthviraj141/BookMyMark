import React, { useMemo } from 'react';
import { BookmarkCard } from './BookmarkCard.js';
import type { Bookmark } from '../types/index.js';

interface MasonryFeedProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onToggleFavorite?: (bookmark: Bookmark) => void;
  loading?: boolean;
}

const MasonryFeedInner: React.FC<MasonryFeedProps> = ({
  bookmarks,
  onSelectBookmark,
  onToggleFavorite,
  loading = false
}) => {
  if (loading && bookmarks.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3.5 px-3.5 sm:px-4 py-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="flex flex-col space-y-2 animate-pulse mb-4">
            <div className="w-full aspect-[4/5] bg-muted/60 rounded-[12px]" />
            <div className="h-4 bg-muted/80 rounded w-4/5 mt-1" />
            <div className="h-3 bg-muted/50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Pre-split columns without re-filtering repeatedly on re-render
  const { col1, col2 } = useMemo(() => {
    const c1: Bookmark[] = [];
    const c2: Bookmark[] = [];
    for (let i = 0; i < bookmarks.length; i++) {
      if (i % 2 === 0) c1.push(bookmarks[i]);
      else c2.push(bookmarks[i]);
    }
    return { col1: c1, col2: c2 };
  }, [bookmarks]);

  return (
    <div className="grid grid-cols-2 gap-3.5 px-3.5 sm:px-4 overscroll-contain">
      {/* Column 1 */}
      <div className="flex flex-col">
        {col1.map((b) => (
          <BookmarkCard
            key={b.id}
            bookmark={b}
            onClick={onSelectBookmark}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {/* Column 2 */}
      <div className="flex flex-col">
        {col2.map((b) => (
          <BookmarkCard
            key={b.id}
            bookmark={b}
            onClick={onSelectBookmark}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};

export const MasonryFeed = React.memo(MasonryFeedInner);
