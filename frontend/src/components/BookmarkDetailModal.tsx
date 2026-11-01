import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Trash2,
  Edit2,
  Save,
  RotateCw,
  Sparkles,
  Tag,
  Loader2,
  Calendar
} from 'lucide-react';
import { PlatformBadge } from './PlatformBadge.js';
import { api } from '../services/api.js';
import { formatRelativeTime } from '../utils/date.js';
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

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(bookmark.title || '');
  const [notes, setNotes] = useState(bookmark.notes || '');
  const [category, setCategory] = useState(bookmark.category || '');
  const [tagsInput, setTagsInput] = useState(bookmark.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(bookmark.thumbnail_url || null);

  React.useEffect(() => {
    if (bookmark.thumbnail_url) {
      setPreviewImage(bookmark.thumbnail_url);
      return;
    }
    const targetUrl = bookmark.url || bookmark.original_url;
    if (targetUrl) {
      api.bookmarks.getLinkPreview(targetUrl).then((p) => {
        if (p?.imageUrl) setPreviewImage(p.imageUrl);
      }).catch(() => {});
    }
  }, [bookmark]);

  const handleOpenOriginal = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
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
    } catch (err: any) {
      setError(err.message || 'Failed to update bookmark');
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setError(null);
    try {
      await api.bookmarks.reprocess(bookmark.id);
      onBookmarkUpdated({ ...bookmark, ai_status: 'pending' });
    } catch (err: any) {
      setError(err.message || 'Reprocessing request failed');
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this bookmark?')) return;
    setDeleting(true);
    try {
      await api.bookmarks.delete(bookmark.id);
      onBookmarkDeleted(bookmark.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete bookmark');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] bg-[#14161f] border border-[#2b2e40] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#161822]">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={bookmark.platform} showLabel />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenOriginal}
              className="p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 flex items-center gap-1.5 text-xs font-medium border border-zinc-700/50"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-5 space-y-5 flex-grow">
          {error && (
            <div className="p-3 rounded-xl text-xs bg-red-950/60 border border-red-800/40 text-red-300">
              {error}
            </div>
          )}

          {/* Large Thumbnail */}
          {previewImage && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-zinc-800 max-h-72 flex items-center justify-center">
              <img
                src={previewImage}
                alt={bookmark.title || 'Preview'}
                className="w-full h-full max-h-72 object-contain"
              />
            </div>
          )}

          {/* Title and Edit Form */}
          {isEditing ? (
            <div className="space-y-3 bg-[#181a26] p-4 rounded-2xl border border-zinc-800">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#101117] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#101117] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-[#101117] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Personal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#101117] border border-zinc-700 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg font-bold text-zinc-100 leading-snug">
                  {bookmark.title || bookmark.shared_text || bookmark.url}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/60"
                  title="Edit details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {bookmark.description && (
                <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                  {bookmark.description}
                </p>
              )}
            </div>
          )}

          {/* AI Summary Box */}
          {bookmark.summary && (
            <div className="p-3.5 rounded-2xl bg-[#1b1c28] border border-violet-900/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Insight</span>
                {bookmark.ai_confidence && (
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ({Math.round(bookmark.ai_confidence * 100)}% confidence)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{bookmark.summary}</p>
            </div>
          )}

          {/* Personal Notes */}
          {bookmark.notes && !isEditing && (
            <div className="p-3.5 rounded-2xl bg-[#171922] border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block mb-1">My Notes</span>
              <p className="text-xs text-zinc-200 whitespace-pre-wrap">{bookmark.notes}</p>
            </div>
          )}

          {/* Category & Tags Display */}
          <div className="space-y-2">
            {bookmark.category && bookmark.category !== 'Other' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Category:</span>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-800/40">
                  {bookmark.category}
                </span>
              </div>
            )}

            {bookmark.tags && bookmark.tags.length > 0 && (
              <div>
                <span className="text-xs text-zinc-400 block mb-1.5">Topic Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/40"
                    >
                      <Tag className="w-3 h-3 text-zinc-500" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata details */}
          <div className="pt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Saved {formatRelativeTime(bookmark.created_at)}</span>
            </div>
            <span className="font-mono text-[11px] truncate max-w-[200px]">{bookmark.url}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 bg-[#161822] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            <span>Reprocess AI</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/50 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
