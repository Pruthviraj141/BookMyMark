import React, { useState } from 'react';
import { Copy, ExternalLink, Trash2, Check, Video, Link2, FileText } from 'lucide-react';
import type { LocalCaptureDraft, PlatformType } from '../types/index.js';
import { truncateUrl } from '../utils/url-validator.js';
import { BrowserApiService } from '../services/browser-api.service.js';

interface CaptureItemProps {
  capture: LocalCaptureDraft;
  onDelete: (id: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPlatformBadge(platform: PlatformType): { label: string; className: string } {
  switch (platform) {
    case 'youtube':
      return { label: 'YouTube', className: 'bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] font-medium' };
    case 'x':
      return { label: 'X', className: 'bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] font-medium' };
    case 'reddit':
      return { label: 'Reddit', className: 'bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] font-medium' };
    case 'instagram':
      return { label: 'Instagram', className: 'bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] font-medium' };
    case 'website':
    default:
      return { label: 'Web', className: 'bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] font-medium' };
  }
}

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case 'video':
      return <Video className="w-3 h-3 text-[var(--text-muted)]" />;
    case 'link':
      return <Link2 className="w-3 h-3 text-[var(--text-muted)]" />;
    case 'page':
    default:
      return <FileText className="w-3 h-3 text-[var(--text-muted)]" />;
  }
}

export const CaptureItem: React.FC<CaptureItemProps> = ({ capture, onDelete, onNotify }) => {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const badge = getPlatformBadge(capture.platform);

  const handleCopy = async () => {
    const success = await BrowserApiService.copyToClipboard(capture.url);
    if (success) {
      setCopied(true);
      onNotify('URL copied to clipboard');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleOpen = () => {
    BrowserApiService.openTab(capture.url);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(capture.id);
      onNotify('Capture removed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleOpen}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.2 rounded ${badge.className}`}>
              {badge.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]" title={`Captured via ${capture.sourceType}`}>
              {getSourceIcon(capture.sourceType)}
              <span className="capitalize">{capture.sourceType}</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">
              {formatRelativeTime(capture.capturedAt)}
            </span>
          </div>

          <h3 className="text-[12.5px] font-medium text-[var(--text-primary)] truncate leading-snug hover:underline">
            {capture.title || capture.domain}
          </h3>

          <p className="text-[10.5px] text-[var(--text-secondary)] truncate mt-0.5" title={capture.url}>
            {truncateUrl(capture.url, 40)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy URL"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            title="Open in new tab"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete capture"
            className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
