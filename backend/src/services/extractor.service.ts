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
      const igResult = await this.resolveInstagram(targetUrl, sharedText);
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
   * Resolves Instagram Posts and Reels via official embed page, OpenGraph & oEmbed
   */
  private static async resolveInstagram(
    url: string,
    sharedText?: string | null
  ): Promise<EnrichedMetadata | null> {
    const match = url.match(/\/(reel|reels|p|tv|share\/reel)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = match ? match[2] : null;

    let title: string | null = null;
    let description: string | null = null;
    let thumbnailUrl: string | null = null;
    let author: string | null = null;
    const hashtags: string[] = [];

    // 1. Extract any hashtags and context from incoming sharedText
    if (sharedText && typeof sharedText === 'string') {
      const tagsInShared = sharedText.match(/#([a-zA-Z0-9_]+)/g);
      if (tagsInShared) {
        tagsInShared.forEach((t) => hashtags.push(t.replace(/^#/, '')));
      }
      const cleanShared = sharedText.replace(/https?:\/\/[^\s]+/gi, '').trim();
      if (cleanShared.length > 5) {
        description = cleanShared;
        title = cleanShared.slice(0, 100);
      }
    }

    if (shortcode) {
      // 2. Method A: Instagram Embed Captioned endpoints
      const embedUrls = [
        `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`
      ];

      for (const embedUrl of embedUrls) {
        if (thumbnailUrl && description) break;
        try {
          const res = await fetch(embedUrl, {
            headers: {
              'User-Agent': this.BROWSER_UA,
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: AbortSignal.timeout(4000)
          });

          if (res.ok) {
            const html = await res.text();
            const $ = cheerio.load(html);

            // Thumbnail extraction
            if (!thumbnailUrl) {
              const img = $('img.EmbeddedMediaImage').attr('src') || $('img[class*="EmbeddedMediaImage"]').attr('src');
              if (img && isValidHttpUrl(img) && !img.includes('rsrc.php')) {
                thumbnailUrl = img;
              } else {
                const matchImg =
                  html.match(/class=["\x27]EmbeddedMediaImage["\x27][^>]*src=["\x27]([^"\x27]+)["\x27]/i) ||
                  html.match(/"display_url":"(https:\/\/[^"\\]+cdninstagram[^"\\]+)"/i);
                if (matchImg && matchImg[1]) {
                  const cleaned = matchImg[1].replace(/\\\//g, '/').replace(/&amp;/g, '&');
                  if (isValidHttpUrl(cleaned) && !cleaned.includes('rsrc.php')) {
                    thumbnailUrl = cleaned;
                  }
                }
              }
            }

            // Caption extraction
            if (!description) {
              const caption = $('.Caption').text().trim() || $('div[class*="Caption"]').text().trim();
              if (caption) {
                description = caption;
                title = caption.slice(0, 100);
                const captionTags = caption.match(/#([a-zA-Z0-9_]+)/g);
                if (captionTags) {
                  captionTags.forEach((t) => hashtags.push(t.replace(/^#/, '')));
                }
              }
            }

            // Author extraction
            if (!author) {
              const authorEl = $('header .UsernameText').first().text().trim() || $('a[class*="Username"]').first().text().trim();
              if (authorEl) {
                author = authorEl.replace(/^@/, '');
              }
            }
          }
        } catch {}
      }

      // 3. Method B: OpenGraph on canonical Reel URL with crawler User-Agent
      if (!thumbnailUrl || !description) {
        try {
          const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
          const ogRes = await fetch(reelUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
            },
            signal: AbortSignal.timeout(4000)
          });

          if (ogRes.ok) {
            const ogHtml = await ogRes.text();
            const $ = cheerio.load(ogHtml);

            if (!thumbnailUrl) {
              const ogImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
              if (ogImg && isValidHttpUrl(ogImg) && !ogImg.includes('rsrc.php')) {
                thumbnailUrl = ogImg;
              }
            }

            if (!description) {
              const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
              if (ogDesc && ogDesc.trim().length > 0) {
                description = ogDesc.trim();
                title = ogDesc.trim().slice(0, 100);
                const ogTags = ogDesc.match(/#([a-zA-Z0-9_]+)/g);
                if (ogTags) {
                  ogTags.forEach((t) => hashtags.push(t.replace(/^#/, '')));
                }
              }
            }

            if (!author) {
              const ogTitle = $('meta[property="og:title"]').attr('content');
              if (ogTitle) {
                const authorMatch = ogTitle.match(/@([a-zA-Z0-9._]+)/);
                if (authorMatch) author = authorMatch[1];
              }
            }
          }
        } catch {}
      }

      // 4. Method C: Instagram public oEmbed fallback
      if (!thumbnailUrl || !description) {
        try {
          const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
          const oembedRes = await fetch(oembedUrl, {
            headers: { 'User-Agent': this.BROWSER_UA },
            signal: AbortSignal.timeout(3000)
          });
          if (oembedRes.ok) {
            const data: any = await oembedRes.json();
            if (data.thumbnail_url && !thumbnailUrl) thumbnailUrl = data.thumbnail_url;
            if (data.title && !description) {
              description = data.title;
              if (!title) title = data.title.slice(0, 100);
            }
            if (data.author_name && !author) author = data.author_name;
          }
        } catch {}
      }
    }

    const uniqueHashtags = [...new Set(hashtags)];
    const textParts = [
      author ? `Instagram Reel by @${author}` : null,
      description,
      uniqueHashtags.length > 0 ? `Tags: ${uniqueHashtags.map((t) => `#${t}`).join(' ')}` : null
    ].filter(Boolean);

    const fullExtractedText = textParts.join('\n\n') || (title ? `${title} (Instagram)` : 'Instagram Reel');

    return {
      title: title || (author ? `Instagram Reel by @${author}` : 'Instagram Reel'),
      description: description || null,
      thumbnail_url: thumbnailUrl,
      cover_source: thumbnailUrl ? 'instagram_embed' : null,
      cover_status: thumbnailUrl ? 'ready' : 'failed',
      author_name: author,
      extracted_text: fullExtractedText,
      platform: 'instagram'
    };
  }

  /**
   * Resolves X / Twitter posts via Syndication CDN, FxTwitter API and oEmbed
   */
  private static async resolveX(url: string): Promise<EnrichedMetadata | null> {
    const match = url.match(/status\/(\d+)/i);
    const statusId = match ? match[1] : null;

    let title: string | null = null;
    let description: string | null = null;
    let thumbnailUrl: string | null = null;
    let author: string | null = null;

    if (statusId) {
      // 1. Method A: Twitter Syndication CDN with mathematical token (No auth required)
      try {
        const token = (parseFloat(statusId) / 1e15 * Math.PI).toString(36);
        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&token=${token}`;
        const res = await fetch(syndicationUrl, {
          headers: {
            'User-Agent': this.BROWSER_UA,
            Accept: 'application/json'
          },
          signal: AbortSignal.timeout(4000)
        });

        if (res.ok) {
          const data: any = await res.json();
          description = data.text || null;
          author = data.user?.name ? `${data.user.name} (@${data.user.screen_name || ''})` : null;
          if (description) {
            title = description.slice(0, 100);
          }

          // Prioritize actual tweet media: photos, video poster, or summary large image card
          // STRICT RULE: Never use user avatar (user.profile_image_url_https) or twitter logo
          if (Array.isArray(data.photos) && data.photos.length > 0 && data.photos[0].url) {
            thumbnailUrl = data.photos[0].url;
          } else if (Array.isArray(data.mediaDetails) && data.mediaDetails.length > 0 && data.mediaDetails[0].media_url_https) {
            thumbnailUrl = data.mediaDetails[0].media_url_https;
          } else if (data.video?.poster) {
            thumbnailUrl = data.video.poster;
          } else if (data.card?.binding_values) {
            const bv = data.card.binding_values;
            thumbnailUrl =
              bv.photo_image_full_size_large?.image_value?.url ||
              bv.thumbnail_image_large?.image_value?.url ||
              bv.thumbnail_image_original?.image_value?.url ||
              bv.photo_image_full_size?.image_value?.url ||
              null;
          }
        }
      } catch {
        // Fallback to FxTwitter
      }

      // 2. Method B: FxTwitter API fallback
      if (!thumbnailUrl || !description) {
        try {
          const fxtwitterUrl = `https://api.fxtwitter.com/status/${statusId}`;
          const fxRes = await fetch(fxtwitterUrl, {
            headers: { 'User-Agent': this.BROWSER_UA },
            signal: AbortSignal.timeout(4000)
          });
          if (fxRes.ok) {
            const fxData: any = await fxRes.json();
            if (fxData.tweet) {
              if (!description) description = fxData.tweet.text || null;
              if (!author && fxData.tweet.author) author = fxData.tweet.author.name || null;
              if (!title && description) title = description.slice(0, 100);

              if (!thumbnailUrl) {
                const media = fxData.tweet.media;
                thumbnailUrl =
                  media?.photos?.[0]?.url ||
                  media?.videos?.[0]?.thumbnail_url ||
                  media?.mosaic?.url ||
                  null;
              }
            }
          }
        } catch {
          // Fallback to publish oembed
        }
      }

      // 3. Method C: Official twitter publish oEmbed fallback
      if (!description || !author) {
        try {
          const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
          const res = await fetch(oembedUrl, {
            headers: { 'User-Agent': this.BROWSER_UA },
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) {
            const data: any = await res.json();
            if (data.author_name && !author) author = data.author_name;
            if (data.html && !description) {
              const $ = cheerio.load(data.html);
              const text = $('p').first().text().trim();
              if (text) {
                description = text;
                if (!title) title = text.slice(0, 100);
              }
            }
          }
        } catch {}
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
      title: title || (author ? `Post by ${author}` : 'X Post'),
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
