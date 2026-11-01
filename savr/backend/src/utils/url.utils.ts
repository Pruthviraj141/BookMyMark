export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractUrlFromText(text: string): string | null {
  if (!text) return null;
  // Match standard http or https url
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`]+)/i;
  const match = text.match(urlRegex);
  if (!match) return null;
  let url = match[0];
  // Clean trailing punctuation if any (like trailing period, comma, or closing paren)
  url = url.replace(/[.,!?;:)>\]]+$/, '');
  return isValidHttpUrl(url) ? url : null;
}

export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString.trim());
    // Lowercase hostname
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    url.hostname = hostname;

    // Remove hash
    url.hash = '';

    // Remove common tracking parameters
    const trackingParams = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'igsh',
      'igshid',
      's',
      't',
      'fbclid',
      'gclid',
      'msclkid',
      'si',
      'feature',
      'share_id',
      'ref',
      'ref_src'
    ]);

    const paramsToDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      if (trackingParams.has(key.toLowerCase())) {
        paramsToDelete.push(key);
      }
    });

    for (const param of paramsToDelete) {
      url.searchParams.delete(param);
    }

    // Sort search parameters for deterministic URL
    url.searchParams.sort();

    // Strip trailing slash from pathname if length > 1
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    url.pathname = pathname;

    return url.toString();
  } catch {
    return urlString.trim();
  }
}

export function isSafePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Check forbidden hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return false;
    }

    // Check private IPv4 patterns
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const p1 = parseInt(ipv4Match[1], 10);
      const p2 = parseInt(ipv4Match[2], 10);

      // 10.0.0.0/8
      if (p1 === 10) return false;
      // 127.0.0.0/8
      if (p1 === 127) return false;
      // 169.254.0.0/16
      if (p1 === 169 && p2 === 254) return false;
      // 172.16.0.0/12
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      // 192.168.0.0/16
      if (p1 === 192 && p2 === 168) return false;
      // 0.0.0.0/8
      if (p1 === 0) return false;
    }

    // Check IPv6 private addresses
    if (hostname.startsWith('fc00:') || hostname.startsWith('fe80:')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
