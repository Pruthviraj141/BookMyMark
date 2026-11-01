import type { Platform } from '../types/index.js';

export class PlatformService {
  /**
   * Detects the platform from a given URL string.
   * Accurately parses domain to prevent sub-string matching bugs (e.g. notmyx.com).
   */
  static detectPlatform(urlString: string): Platform {
    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase();

      // Helper to check if domain matches exactly or is a subdomain
      const matchesDomain = (domain: string): boolean => {
        return hostname === domain || hostname.endsWith(`.${domain}`);
      };

      if (matchesDomain('instagram.com') || matchesDomain('instagr.am')) {
        return 'instagram';
      }

      if (matchesDomain('x.com') || matchesDomain('twitter.com') || matchesDomain('t.co')) {
        return 'x';
      }

      if (matchesDomain('youtube.com') || matchesDomain('youtu.be')) {
        return 'youtube';
      }

      if (matchesDomain('reddit.com') || matchesDomain('redd.it')) {
        return 'reddit';
      }

      if (matchesDomain('tiktok.com')) {
        return 'tiktok';
      }

      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return 'website';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extracts YouTube Video ID if present in the URL
   */
  static extractYouTubeVideoId(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase();

      if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
        const id = url.pathname.slice(1).split('/')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
        // /watch?v=VIDEO_ID
        const v = url.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
          return v;
        }

        // /shorts/VIDEO_ID or /embed/VIDEO_ID or /v/VIDEO_ID
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'v')) {
          const id = parts[1];
          return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
