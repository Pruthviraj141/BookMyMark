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
      const ytResult = await this.resolveYouTube(targetUrl, sharedText);
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
   * Resolves YouTube videos via oEmbed & fast HTML metadata (title, first 500-800 chars of description, keywords).
   * Fast, lightweight: NO full video transcripts, NO audio extraction, NO video downloading.
   */
  private static async resolveYouTube(
    url: string,
    sharedText?: string | null
  ): Promise<EnrichedMetadata | null> {
    const videoId = PlatformService.extractYouTubeVideoId(url);
    if (!videoId) return null;

    let title: string | null = null;
    let author: string | null = null;
    let description: string | null = null;
    let keywords: string | null = null;
    let thumbnailUrl: string | null = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // 1. Fast oEmbed retrieval for official title and creator/channel name
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': this.BROWSER_UA },
        signal: AbortSignal.timeout(3000)
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

    // 2. Fast HTML meta tag extraction for description (first 500-800 chars) and keywords
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageRes = await fetch(watchUrl, {
        headers: {
          'User-Agent': this.BROWSER_UA,
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const $ = cheerio.load(html);
        if (!title) {
          title = $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || null;
        }
        const descMeta =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          $('meta[name="twitter:description"]').attr('content');
        if (descMeta && descMeta.trim()) {
          // Truncate to first 600 meaningful characters
          description = descMeta.trim().slice(0, 600);
        }
        const kwMeta = $('meta[name="keywords"]').attr('content');
        if (kwMeta && kwMeta.trim()) {
          keywords = kwMeta.trim().slice(0, 300);
        }
      }
    } catch {
      // Fast fallback to title / oembed
    }

    const textParts = [
      title ? `Video Title: ${title}` : null,
      author ? `Channel/Creator: ${author}` : null,
      description ? `Description: ${description}` : null,
      keywords ? `Keywords: ${keywords}` : null,
      sharedText ? `Shared Note: ${sharedText}` : null
    ].filter(Boolean);

    const fullExtractedText = textParts.join('\n\n') || (title ? `${title} (YouTube)` : 'YouTube Video');

    return {
      title: title || 'YouTube Video',
      description: description || sharedText || null,
      thumbnail_url: thumbnailUrl,
      cover_source: 'youtube_oembed',
      cover_status: 'ready',
      author_name: author,
      extracted_text: fullExtractedText,
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
    let actualMediaUrl: string | null = null;
    let profileImageUrl: string | null = null;
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

          // Author profile picture (convert to high-res 400x400)
          if (data.user?.profile_image_url_https) {
            profileImageUrl = data.user.profile_image_url_https.replace('_normal.', '_400x400.');
          }

          // Check for actual tweet media (photos, video poster, or large summary card)
          if (Array.isArray(data.photos) && data.photos.length > 0 && data.photos[0].url) {
            actualMediaUrl = data.photos[0].url;
          } else if (Array.isArray(data.mediaDetails) && data.mediaDetails.length > 0 && data.mediaDetails[0].media_url_https) {
            actualMediaUrl = data.mediaDetails[0].media_url_https;
          } else if (data.video?.poster) {
            actualMediaUrl = data.video.poster;
          } else if (data.card?.binding_values) {
            const bv = data.card.binding_values;
            actualMediaUrl =
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
      if ((!actualMediaUrl && !profileImageUrl) || !description) {
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

              if (!profileImageUrl && fxData.tweet.author?.avatar_url) {
                profileImageUrl = fxData.tweet.author.avatar_url;
              }

              if (!actualMediaUrl) {
                const media = fxData.tweet.media;
                actualMediaUrl =
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

    // Filter out generic default placeholder avatars
    if (profileImageUrl && (profileImageUrl.includes('default_profile') || profileImageUrl.includes('default-og'))) {
      profileImageUrl = null;
    }

    // Image selection priority:
    // 1. Actual tweet media image
    // 2. Author profile picture as fallback
    // 3. Existing neutral X fallback (null)
    let selectedImage: string | null = null;
    let coverSource: string | null = null;

    if (actualMediaUrl && !actualMediaUrl.includes('profile_images')) {
      selectedImage = actualMediaUrl;
      coverSource = 'x_media';
    } else if (profileImageUrl) {
      selectedImage = profileImageUrl;
      coverSource = 'x_profile';
    }

    const fullExtractedText = [
      author ? `Tweet by ${author}` : null,
      description
    ].filter(Boolean).join('\n\n') || title || 'X Post';

    return {
      title: title || (author ? `Post by ${author}` : 'X Post'),
      description,
      thumbnail_url: selectedImage,
      cover_source: coverSource,
      cover_status: selectedImage ? 'ready' : 'failed',
      author_name: author,
      extracted_text: fullExtractedText,
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

      const rawTitle =
        $('meta[property="og:title"]').attr('content')?.trim() ||
        $('meta[name="twitter:title"]').attr('content')?.trim() ||
        $('title').first().text().trim() ||
        null;

      const isUrl = (s?: string | null) => Boolean(s && (s.startsWith('http://') || s.startsWith('https://')));
      const title = rawTitle && !isUrl(rawTitle)
        ? rawTitle
        : (() => {
            try {
              return new URL(url).hostname.replace('www.', '');
            } catch {
              return 'Saved Article';
            }
          })();

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
