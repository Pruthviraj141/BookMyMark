import * as cheerio from 'cheerio';
import { isSafePublicUrl, isValidHttpUrl } from '../utils/url.utils.js';
import { PlatformService } from './platform.service.js';
import type { ExtractedMetadata } from '../types/index.js';

export class MetadataService {
  private static USER_AGENT =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';

  /**
   * Parses HTML string into ExtractedMetadata using Cheerio.
   * Useful for testing and unit tests without network calls.
   */
  static parseHtml(html: string, fallbackUrl?: string): ExtractedMetadata {
    const $ = cheerio.load(html);

    // Title resolution priority: og:title -> twitter:title -> <title>
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim();
    const docTitle = $('title').first().text().trim();
    const title = ogTitle || twitterTitle || docTitle || null;

    // Description resolution priority: og:description -> twitter:description -> meta[name="description"]
    const ogDesc = $('meta[property="og:description"]').attr('content')?.trim();
    const twitterDesc = $('meta[name="twitter:description"]').attr('content')?.trim();
    const metaDesc = $('meta[name="description"]').attr('content')?.trim();
    const description = ogDesc || twitterDesc || metaDesc || null;

    // Thumbnail resolution priority: og:image -> twitter:image
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
    const twitterImage = $('meta[name="twitter:image"]').attr('content')?.trim();
    let thumbnailUrl = ogImage || twitterImage || null;

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null;

    // Author
    const author =
      $('meta[name="author"]').attr('content')?.trim() ||
      $('meta[property="article:author"]').attr('content')?.trim() ||
      null;

    // Extracted body content (first few paragraphs)
    const paragraphs: string[] = [];
    $('article p, main p, body p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });
    const extractedText = paragraphs.slice(0, 5).join('\n\n') || null;

    // If YouTube thumbnail fallback applies
    if (fallbackUrl && (!thumbnailUrl || !thumbnailUrl.startsWith('http'))) {
      const ytId = PlatformService.extractYouTubeVideoId(fallbackUrl);
      if (ytId) {
        thumbnailUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    return {
      title,
      description,
      thumbnail_url: thumbnailUrl && isValidHttpUrl(thumbnailUrl) ? thumbnailUrl : null,
      author_name: author,
      extracted_text: extractedText,
      canonical_url: canonical && isValidHttpUrl(canonical) ? canonical : null
    };
  }

  /**
   * Fetches the web page and extracts metadata safely.
   */
  static async extract(targetUrl: string): Promise<ExtractedMetadata> {
    // Check if YouTube thumbnail can be directly derived
    const ytVideoId = PlatformService.extractYouTubeVideoId(targetUrl);
    let defaultYtThumbnail: string | null = null;
    if (ytVideoId) {
      defaultYtThumbnail = `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`;
    }

    if (!isValidHttpUrl(targetUrl) || !isSafePublicUrl(targetUrl)) {
      // Do not fetch internal or non-http URLs for SSRF safety
      return {
        title: null,
        description: null,
        thumbnail_url: defaultYtThumbnail,
        author_name: null,
        extracted_text: null,
        canonical_url: null
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Revalidate final URL against SSRF redirects
      if (!isSafePublicUrl(response.url)) {
        return {
          title: null,
          description: null,
          thumbnail_url: defaultYtThumbnail,
          author_name: null,
          extracted_text: null,
          canonical_url: null
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        return {
          title: null,
          description: null,
          thumbnail_url: defaultYtThumbnail,
          author_name: null,
          extracted_text: null,
          canonical_url: null
        };
      }

      // Limit response size: read maximum 512KB to avoid memory bloat
      const reader = response.body?.getReader();
      let html = '';
      if (reader) {
        let bytesReceived = 0;
        const maxBytes = 512 * 1024;
        const decoder = new TextDecoder('utf-8');

        while (bytesReceived < maxBytes) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesReceived += value.length;
          html += decoder.decode(value, { stream: true });
        }
        controller.abort(); // Close remaining connection
      } else {
        html = await response.text();
      }

      const metadata = this.parseHtml(html, targetUrl);

      // Ensure YouTube thumbnail fallback if none parsed from HTML
      if (!metadata.thumbnail_url && defaultYtThumbnail) {
        metadata.thumbnail_url = defaultYtThumbnail;
      }

      return metadata;
    } catch (err: any) {
      // Extraction failures should never crash bookmarking
      return {
        title: null,
        description: null,
        thumbnail_url: defaultYtThumbnail,
        author_name: null,
        extracted_text: null,
        canonical_url: null
      };
    }
  }
}
