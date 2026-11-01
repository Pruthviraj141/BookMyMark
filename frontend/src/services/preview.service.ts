import { getApiBaseUrl } from '../config/api.config.js';

export interface LinkPreviewData {
  platform: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

// In-memory cache for the current session (never persisted to storage/DB)
const sessionPreviewCache = new Map<string, LinkPreviewData>();

/**
 * Client-Side YouTube URL Recognition
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace('www.', '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0].split('?')[0];
      return id && id.length >= 8 && id.length <= 15 ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id && id.length >= 8 && id.length <= 15 ? id : null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
        return id && id.length >= 8 && id.length <= 15 ? id : null;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/embed/')[1].split('/')[0].split('?')[0];
        return id && id.length >= 8 && id.length <= 15 ? id : null;
      }
    }
  } catch {
    // Invalid URL format
  }
  return null;
}

export class PreviewService {
  /**
   * Resolves link preview.
   * Priority:
   * 1. Check in-memory session cache.
   * 2. YouTube client-side thumbnail (Zero Worker network call).
   * 3. Fetch from Worker GET /api/link-preview (display-only).
   */
  static async getPreview(url: string | null | undefined): Promise<LinkPreviewData | null> {
    if (!url) return null;

    // 1. Session in-memory cache check
    if (sessionPreviewCache.has(url)) {
      return sessionPreviewCache.get(url)!;
    }

    // 2. Client-side YouTube recognition (Instant, 0 Worker calls)
    const ytVideoId = extractYouTubeVideoId(url);
    if (ytVideoId) {
      const ytPreview: LinkPreviewData = {
        platform: 'youtube',
        title: null,
        description: null,
        imageUrl: `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`
      };
      sessionPreviewCache.set(url, ytPreview);
      return ytPreview;
    }

    // 3. Worker metadata extraction (GET /api/link-preview)
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/link-preview?url=${encodeURIComponent(url)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      if (json && json.success && json.data) {
        const previewData: LinkPreviewData = {
          platform: json.data.platform || 'website',
          title: json.data.title || null,
          description: json.data.description || null,
          imageUrl: json.data.imageUrl || null
        };
        sessionPreviewCache.set(url, previewData);
        return previewData;
      }
    } catch {
      // Return null on network or timeout failure
    }

    return null;
  }
}
