import * as cheerio from 'cheerio';
import { isSafePublicUrl, isValidHttpUrl } from '../utils/url.utils.js';
import { PlatformService } from './platform.service.js';

export interface EnrichedMetadata {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  cover_source: string | null;
  cover_status: 'ready' | 'fallback' | 'failed';
  author_name: string | null;
  extracted_text: string | null;
  platform: string;
}

export class ExtractorService {
  private static BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  /**
   * Main entry point to extract metadata & best cover image
   */
  static async extract(
    targetUrl: string,
    sharedText?: string | null,
    providedImageUrl?: string | null
  ): Promise<EnrichedMetadata> {
    const platform = PlatformService.detectPlatform(targetUrl);

    // 1. If an image was directly provided (e.g. from Android Share intent or attachment)
    if (providedImageUrl && isValidHttpUrl(providedImageUrl)) {
      return {
        title: null,
        description: sharedText || null,
        thumbnail_url: providedImageUrl,
        cover_source: 'user_shared',
        cover_status: 'ready',
        author_name: null,
        extracted_text: sharedText || null,
        platform
      };
    }

    // 2. Platform-specific resolvers
    if (platform === 'youtube') {
      const ytResult = await this.resolveYouTube(targetUrl);
      if (ytResult) return { ...ytResult, platform };
    }

    if (platform === 'instagram') {
      const igResult = await this.resolveInstagram(targetUrl);
      if (igResult) return { ...igResult, platform };
    }

    if (platform === 'x') {
      const xResult = await this.resolveX(targetUrl);
      if (xResult) return { ...xResult, platform };
    }

    // 3. General web metadata resolution
    const generalResult = await this.resolveGeneric(targetUrl);
    return { ...generalResult, platform };
  }

  /**
   * Resolves YouTube videos via oEmbed & video ID thumbnail
   */
  private static async resolveYouTube(url: string): Promise<EnrichedMetadata | null> {
    const videoId = PlatformService.extractYouTubeVideoId(url);
    if (!videoId) return null;

    let title: string | null = null;
    let author: string | null = null;
    let thumbnailUrl: string | null = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': this.BROWSER_UA },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data: any = await res.json();
        title = data.title || null;
        author = data.author_name || null;
        if (data.thumbnail_url) {
          thumbnailUrl = data.thumbnail_url;
        }
      }
    } catch {
      // Keep default thumbnail
    }

    return {
      title,
      description: null,
      thumbnail_url: thumbnailUrl,
      cover_source: 'youtube_oembed',
      cover_status: 'ready',
      author_name: author,
      extracted_text: title ? `YouTube video by ${author || 'creator'}: ${title}` : null,
      platform: 'youtube'
    };
  }

  /**
   * Resolves Instagram Posts and Reels via official embed page & oEmbed
   */
  private static async resolveInstagram(url: string): Promise<EnrichedMetadata | null> {
    const match = url.match(/\/(reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = match ? match[2] : null;

    let title: string | null = null;
    let description: string | null = null;
    let thumbnailUrl: string | null = null;
    let author: string | null = null;

    if (shortcode) {
      // Method A: Check public embed page (contains EmbeddedMediaImage & Caption)
      try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const res = await fetch(embedUrl, {
          headers: {
            'User-Agent': this.BROWSER_UA,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);

          // EmbeddedMediaImage is Instagram's real post/reel thumbnail
          const img = $('img.EmbeddedMediaImage').attr('src');
          if (img && isValidHttpUrl(img)) {
            thumbnailUrl = img;
          }

          // Caption contains description & tags
          const caption = $('.Caption').text().trim() || $('div[class*="Caption"]').text().trim();
          if (caption) {
            description = caption;
            title = caption.slice(0, 100);
          }

          // Author username
          const authorEl = $('header .UsernameText').first().text().trim();
          if (authorEl) {
            author = authorEl;
          }
        }
      } catch {
        // Continue to fallback
      }
    }

    // Method B: Try Instagram oEmbed
    if (!thumbnailUrl) {
      try {
        const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': this.BROWSER_UA },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
          if (data.title && !title) title = data.title;
          if (data.author_name && !author) author = data.author_name;
        }
      } catch {
        // Fallback
      }
    }

    return {
      title: title || (author ? `Instagram post by @${author}` : 'Instagram Reel'),
      description,
      thumbnail_url: thumbnailUrl,
      cover_source: thumbnailUrl ? 'instagram_embed' : null,
      cover_status: thumbnailUrl ? 'ready' : 'failed',
      author_name: author,
      extracted_text: description || (title ? `${title} (Instagram)` : null),
      platform: 'instagram'
    };
  }

  /**
   * Resolves X / Twitter posts via public preview API (FxTwitter/VxTwitter) and oEmbed
   */
  private static async resolveX(url: string): Promise<EnrichedMetadata | null> {
    const match = url.match(/status\/(\d+)/i);
    const statusId = match ? match[1] : null;

    let title: string | null = null;
    let description: string | null = null;
    let thumbnailUrl: string | null = null;
    let author: string | null = null;

    if (statusId) {
      // Method A: Query vxtwitter / fxtwitter API for post media & text
      try {
        const apiUrl = `https://api.vxtwitter.com/status/${statusId}`;
        const res = await fetch(apiUrl, {
          headers: { 'User-Agent': this.BROWSER_UA },
          signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
          const data: any = await res.json();
          description = data.text || null;
          author = data.user_screen_name || data.user_name || null;
          title = description ? description.slice(0, 100) : (author ? `Post by @${author}` : null);

          // Select media image if available
          if (Array.isArray(data.media_extended) && data.media_extended.length > 0) {
            const media = data.media_extended[0];
            thumbnailUrl = media.thumbnail_url || media.url || null;
          } else if (Array.isArray(data.mediaURLs) && data.mediaURLs.length > 0) {
            thumbnailUrl = data.mediaURLs[0];
          }
        }
      } catch {
        // Fallback to oembed
      }
    }

    // Method B: Official twitter publish oembed
    if (!description || !author) {
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': this.BROWSER_UA },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data.author_name && !author) author = data.author_name;
          if (data.html) {
            const $ = cheerio.load(data.html);
            const text = $('p').first().text().trim();
            if (text && !description) {
              description = text;
              if (!title) title = text.slice(0, 100);
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    // Reject profile images and default logo
    if (thumbnailUrl) {
      if (
        thumbnailUrl.includes('profile_images') ||
        thumbnailUrl.includes('default-og') ||
        thumbnailUrl.includes('abs.twimg.com')
      ) {
        thumbnailUrl = null;
      }
    }

    return {
      title: title || (author ? `Post by @${author}` : 'X Post'),
      description,
      thumbnail_url: thumbnailUrl,
      cover_source: thumbnailUrl ? 'x_media' : null,
      cover_status: thumbnailUrl ? 'ready' : 'failed',
      author_name: author,
      extracted_text: description || title || null,
      platform: 'x'
    };
  }

  /**
   * Generic Open Graph & HTML meta scraper
   */
  private static async resolveGeneric(url: string): Promise<EnrichedMetadata> {
    if (!isValidHttpUrl(url) || !isSafePublicUrl(url)) {
      return {
        title: null,
        description: null,
        thumbnail_url: null,
        cover_source: null,
        cover_status: 'failed',
        author_name: null,
        extracted_text: null,
        platform: 'website'
      };
    }

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.BROWSER_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok || !isSafePublicUrl(res.url)) {
        return {
          title: null,
          description: null,
          thumbnail_url: null,
          cover_source: null,
          cover_status: 'failed',
          author_name: null,
          extracted_text: null,
          platform: 'website'
        };
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const title =
        $('meta[property="og:title"]').attr('content')?.trim() ||
        $('meta[name="twitter:title"]').attr('content')?.trim() ||
        $('title').first().text().trim() ||
        null;

      const description =
        $('meta[property="og:description"]').attr('content')?.trim() ||
        $('meta[name="twitter:description"]').attr('content')?.trim() ||
        $('meta[name="description"]').attr('content')?.trim() ||
        null;

      let thumbnail =
        $('meta[property="og:image"]').attr('content')?.trim() ||
        $('meta[name="twitter:image"]').attr('content')?.trim() ||
        null;

      // Filter out tiny or logo images
      if (thumbnail) {
        if (!isValidHttpUrl(thumbnail) || thumbnail.includes('favicon') || thumbnail.includes('.ico')) {
          thumbnail = null;
        }
      }

      const author =
        $('meta[name="author"]').attr('content')?.trim() ||
        $('meta[property="article:author"]').attr('content')?.trim() ||
        null;

      const paragraphs: string[] = [];
      $('article p, main p, body p').slice(0, 3).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });
      const extractedText = paragraphs.join('\n\n') || description || title || null;

      return {
        title,
        description,
        thumbnail_url: thumbnail,
        cover_source: thumbnail ? 'opengraph' : null,
        cover_status: thumbnail ? 'ready' : 'failed',
        author_name: author,
        extracted_text: extractedText,
        platform: 'website'
      };
    } catch {
      return {
        title: null,
        description: null,
        thumbnail_url: null,
        cover_source: null,
        cover_status: 'failed',
        author_name: null,
        extracted_text: null,
        platform: 'website'
      };
    }
  }
}
