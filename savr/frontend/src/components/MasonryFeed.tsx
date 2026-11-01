import React from 'react';
import { BookmarkCard } from './BookmarkCard.js';
import type { Bookmark } from '../types/index.js';

interface MasonryFeedProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  loading?: boolean;
}

export const MasonryFeed: React.FC<MasonryFeedProps> = ({
  bookmarks,
  onSelectBookmark,
  loading = false
}) => {
  if (loading && bookmarks.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="rounded-2xl bg-[#161822] border border-zinc-800/80 p-3 flex flex-col space-y-3 animate-pulse"
          >
            <div className="w-full aspect-square bg-zinc-800/60 rounded-xl" />
            <div className="h-4 bg-zinc-800/80 rounded w-3/4" />
            <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const col1 = bookmarks.filter((_, i) => i % 2 === 0);
  const col2 = bookmarks.filter((_, i) => i % 2 !== 0);

  return (
    <div className="grid grid-cols-2 gap-3 px-3 sm:px-4">
      {/* Column 1 */}
      <div className="flex flex-col">
        {col1.map((b) => (
          <BookmarkCard key={b.id} bookmark={b} onClick={onSelectBookmark} />
        ))}
      </div>

      {/* Column 2 */}
      <div className="flex flex-col">
        {col2.map((b) => (
          <BookmarkCard key={b.id} bookmark={b} onClick={onSelectBookmark} />
        ))}
      </div>
    </div>
  );
};
