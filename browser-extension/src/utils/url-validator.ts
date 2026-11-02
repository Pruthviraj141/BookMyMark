/**
 * URL Validator Utility
 * Strictly accepts valid HTTP and HTTPS URLs.
 * Rejects browser internal pages, file URLs, script schemes, etc.
 */

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
  domain?: string;
}

const DISALLOWED_SCHEMES = new Set([
  'javascript:',
  'data:',
  'blob:',
  'chrome:',
  'chrome-extension:',
  'brave:',
  'about:',
  'moz-extension:',
  'file:',
  'view-source:',
  'edge:',
  'opera:',
  'devtools:'
]);

export function validateUrl(rawUrl: string | undefined | null): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'URL is required'
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'URL cannot be empty'
    };
  }

  const lower = trimmed.toLowerCase();

  // Check disallowed scheme prefixes
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        error: `Unsupported scheme (${scheme}) cannot be bookmarked`
      };
    }
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http: and https:
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        error: `Protocol '${parsed.protocol}' is not supported. Only HTTP and HTTPS links can be saved.`
      };
    }

    // Must have a valid hostname with at least one dot or localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return {
        isValid: false,
        normalizedUrl: trimmed,
        error: 'Invalid hostname'
      };
    }

    const domain = parsed.hostname.replace(/^www\./i, '');

    return {
      isValid: true,
      normalizedUrl: trimmed,
      domain
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      error: 'Malformed URL format'
    };
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'unknown';
  }
}

export function truncateUrl(url: string, maxLength: number = 42): string {
  if (!url) return '';
  if (url.length <= maxLength) return url;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./i, '');
    const path = parsed.pathname + parsed.search;
    if (path.length > 20) {
      return `${domain}${path.slice(0, 15)}...`;
    }
    return `${domain}${path}`;
  } catch {
    return `${url.slice(0, maxLength - 3)}...`;
  }
}

/**
 * Normalizes URL for production uniqueness:
 * Strips tracking parameters (utm_*, fbclid, etc.), hash, and trailing slashes.
 * Exactly matches mobile BookmarksService.normalizeUrl.
 */
export function normalizeUrlForProduction(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = '';
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'igshid'];
    trackingParams.forEach((p) => url.searchParams.delete(p));
    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl.trim();
  }
}

