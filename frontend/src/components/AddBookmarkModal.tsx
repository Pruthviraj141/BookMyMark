import React, { useState } from 'react';
import { X, Link2, Clipboard, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import type { Bookmark } from '../types/index.js';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookmarkCreated: (bookmark: Bookmark) => void;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onBookmarkCreated
}) => {
  const [url, setUrl] = useState('');
  const [sharedText, setSharedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // Permission or unsupported clipboard
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !sharedText.trim()) {
      setError('Please provide a URL or link text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await api.bookmarks.create({
        url: url.trim(),
        sharedText: sharedText.trim() || undefined
      });
      setUrl('');
      setSharedText('');
      onBookmarkCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#161822] border border-[#2b2e40] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-950 flex items-center justify-center border border-violet-700/50">
              <Link2 className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">Add to MyBookMark</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs font-medium bg-red-950/60 border border-red-800/40 text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Bookmark URL
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="https://instagram.com/reel/..., x.com/..., youtube.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                className="w-full bg-[#101117] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pr-20 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 border border-zinc-600/40"
              >
                <Clipboard className="w-3 h-3" />
                Paste
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Caption / Shared Note (Optional)
            </label>
            <textarea
              placeholder="Any context or notes from the post..."
              value={sharedText}
              onChange={(e) => setSharedText(e.target.value)}
              rows={2}
              className="w-full bg-[#101117] border border-zinc-700/80 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-sm font-medium text-white flex items-center justify-center gap-2 shadow-md shadow-violet-900/40 disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
