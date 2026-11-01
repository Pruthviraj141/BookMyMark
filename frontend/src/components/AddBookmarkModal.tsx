import React, { useState } from 'react';
import { X, Clipboard, Loader2, BookmarkPlus } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from './ui/Toast.js';
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
  const { toast } = useToast();
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
        toast({
          title: 'URL Pasted',
          variant: 'default',
          duration: 1500
        });
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
      toast({
        title: 'Bookmark Saved',
        description: 'Analyzing in background',
        variant: 'default'
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl flex flex-col animate-slide-up sm:animate-scale-in pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground">
              <BookmarkPlus className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground tracking-tight">Add Bookmark</h2>
              <p className="text-[11px] text-muted-foreground">Save link from Instagram, X, YouTube or Web</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-destructive/10 border border-destructive/30 text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Bookmark URL
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="https://instagram.com/reel/..., x.com/..., youtube.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 pr-20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2 px-2 py-1 rounded text-xs font-medium bg-card hover:bg-muted text-foreground flex items-center gap-1 border border-border cursor-pointer active:scale-95 transition-all"
              >
                <Clipboard className="w-3 h-3 text-muted-foreground" />
                Paste
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Caption / Note (Optional)
            </label>
            <textarea
              placeholder="Any context or personal takeaways from the post..."
              value={sharedText}
              onChange={(e) => setSharedText(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-foreground hover:opacity-90 active:scale-95 text-xs font-medium text-background flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
