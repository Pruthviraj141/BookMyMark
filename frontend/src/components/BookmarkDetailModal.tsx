import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Trash2,
  Edit2,
  Save,
  RotateCw,
  Loader2,
  Calendar,
  Heart,
  FileText
} from 'lucide-react';
import { PlatformBadge } from './PlatformBadge.js';
import { api } from '../services/api.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { formatRelativeTime } from '../utils/date.js';
import { cleanCaption } from '../utils/text.js';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from './ui/AlertDialog.js';
import { useToast } from './ui/Toast.js';
import type { Bookmark } from '../types/index.js';

interface BookmarkDetailModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkUpdated: (updated: Bookmark) => void;
  onBookmarkDeleted: (id: string) => void;
}

export const BookmarkDetailModal: React.FC<BookmarkDetailModalProps> = ({
  bookmark,
  isOpen,
  onClose,
  onBookmarkUpdated,
  onBookmarkDeleted
}) => {
  if (!isOpen || !bookmark) return null;

  const { toast } = useToast();
  const isUrl = (s?: string | null) => Boolean(s && (s.startsWith('http://') || s.startsWith('https://') || s.includes('://')));
  const targetUrl = bookmark.original_url || bookmark.url || '';

  const getCleanTitle = () => {
    const raw = bookmark.title || bookmark.shared_text;
    const cleaned = cleanCaption(raw);
    if (cleaned && !isUrl(cleaned)) return cleaned;
    switch (bookmark.platform) {
      case 'instagram': return 'Instagram Reel';
      case 'x': return 'X Post';
      case 'youtube': return 'YouTube Video';
      case 'reddit': return 'Reddit Post';
      case 'tiktok': return 'TikTok Video';
      default: return 'Saved Bookmark';
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(bookmark.title && !isUrl(bookmark.title) ? bookmark.title : '');
  const [notes, setNotes] = useState(bookmark.notes || '');
  const [category, setCategory] = useState(bookmark.category || '');
  const [tagsInput, setTagsInput] = useState(bookmark.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(bookmark.thumbnail_url || null);

  React.useEffect(() => {
    setTitle(bookmark.title && !isUrl(bookmark.title) ? bookmark.title : '');
    setNotes(bookmark.notes || '');
    setCategory(bookmark.category || '');
    setTagsInput(bookmark.tags.join(', '));
    setIsEditing(false);
    setError(null);

    if (bookmark.thumbnail_url) {
      setPreviewImage(bookmark.thumbnail_url);
      return;
    }
    if (targetUrl) {
      api.bookmarks.getLinkPreview(targetUrl).then((p) => {
        if (p?.imageUrl) setPreviewImage(p.imageUrl);
      }).catch(() => {});
    }
  }, [bookmark, targetUrl]);

  const handleOpenOriginal = () => {
    NativeSessionBridge.openAppUrl(targetUrl);
  };

  const handleToggleFavorite = async () => {
    const newFav = !bookmark.is_favorite;
    const updated = { ...bookmark, is_favorite: newFav };
    onBookmarkUpdated(updated);
    try {
      await api.bookmarks.update(bookmark.id, { is_favorite: newFav });
      toast({
        title: newFav ? 'Added to Favorites' : 'Removed from Favorites',
        variant: 'default',
        duration: 2000
      });
    } catch {
      onBookmarkUpdated(bookmark);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError(null);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const updated = await api.bookmarks.update(bookmark.id, {
        title: title.trim() || null,
        notes: notes.trim() || null,
        category: category.trim() || null,
        tags: parsedTags
      });

      onBookmarkUpdated(updated);
      setIsEditing(false);
      toast({
        title: 'Changes Saved',
        variant: 'default'
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save updates');
    } finally {
      setSaving(false);
    }
  };

  const handleReprocessAI = async () => {
    setReprocessing(true);
    setError(null);
    try {
      await api.bookmarks.reprocess(bookmark.id);
      onBookmarkUpdated({ ...bookmark, ai_status: 'processing' });
      toast({
        title: 'Categorizing with AI',
        description: 'Analyzing content in the background',
        variant: 'default'
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger AI re-classification');
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.bookmarks.delete(bookmark.id);
      setIsDeleteDialogOpen(false);
      onBookmarkDeleted(bookmark.id);
      onClose();
      toast({
        title: 'Bookmark Deleted',
        variant: 'default'
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete bookmark');
      setDeleting(false);
    }
  };

  const displayTitle = getCleanTitle();
  const isPortrait = bookmark.platform === 'instagram' || bookmark.platform === 'tiktok';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Dimmed backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        />

        {/* Partially expanded editorial bottom sheet (approx 75vh) */}
        <div className="relative z-10 w-full max-w-lg bg-card border-t border-x border-border rounded-t-2xl shadow-2xl flex flex-col max-h-[78vh] overflow-hidden animate-slide-up pb-[max(1rem,env(safe-area-inset-bottom))] transition-colors">
          {/* Visual Drag Handle */}
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <span className="w-8 h-1 rounded-full bg-border" />
          </div>

          {/* Sheet Header */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0 bg-card">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={bookmark.platform} showLabel />
              {bookmark.category && (
                <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground px-2 py-0.5 rounded border border-border">
                  {bookmark.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                title={bookmark.is_favorite ? 'Favorited' : 'Favorite'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    bookmark.is_favorite ? 'fill-foreground text-foreground' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto px-4 py-3.5 space-y-4 flex-grow">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Prominent Cover Image Preview */}
            {previewImage && (
              <div
                onClick={handleOpenOriginal}
                className={`relative w-full ${
                  isPortrait ? 'aspect-[4/3] max-h-56' : 'aspect-video max-h-48'
                } rounded-xl overflow-hidden bg-muted border border-border/70 cursor-pointer group`}
              >
                <img
                  src={previewImage}
                  alt={displayTitle}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1 rounded bg-black/80 text-white text-xs font-medium flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Open content
                  </span>
                </div>
              </div>
            )}

            {/* Title / Edit Title */}
            {isEditing ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-foreground"
                />
              </div>
            ) : (
              <div>
                <h2 className="text-base font-medium text-foreground leading-snug tracking-tight">
                  {displayTitle}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>Saved {formatRelativeTime(bookmark.created_at)}</span>
                </div>
              </div>
            )}

            {/* AI Summary / Description (Restrained editorial layout) */}
            {(bookmark.summary || bookmark.description) && (
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  {bookmark.summary ? 'AI Summary' : 'Description'}
                </span>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {cleanCaption(bookmark.summary || bookmark.description)}
                </p>
              </div>
            )}

            {/* Notes / Edit Notes */}
            {isEditing ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Personal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Add notes..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                />
              </div>
            ) : notes ? (
              <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Personal Notes
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {notes}
                </p>
              </div>
            ) : null}

            {/* Category & Tags / Edit Mode */}
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Technology"
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Tags</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="tag1, tag2"
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags && bookmark.tags.length > 0 ? (
                    bookmark.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/40 text-foreground/90 border border-border"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="px-4 py-3 border-t border-border bg-card shrink-0 flex items-center justify-between gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-foreground hover:opacity-90 text-xs font-medium text-background flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer active:scale-95"
                    title="Edit bookmark"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReprocessAI}
                    disabled={reprocessing}
                    className="p-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Re-run AI categorization"
                  >
                    <RotateCw className={`w-4 h-4 ${reprocessing ? 'animate-spin text-foreground' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="p-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer active:scale-95"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Action: Inverted Black/White button */}
                <button
                  type="button"
                  onClick={handleOpenOriginal}
                  className="px-4 py-2 rounded-lg bg-foreground hover:opacity-90 active:scale-95 text-xs font-medium text-background flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Original Post</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <AlertDialogBackdrop onClick={() => setIsDeleteDialogOpen(false)} />
        <AlertDialogContent>
          <AlertDialogHeader>Delete Bookmark</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{displayTitle}"</span>? This will remove it from your BookMyMark collection.
          </AlertDialogBody>
          <AlertDialogFooter>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
