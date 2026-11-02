import type { PlatformType } from '../types/index.js';

export interface PlatformMetadata {
  platform: PlatformType;
  label: string;
  defaultTitle: string;
}

export function detectPlatform(url: string): PlatformType {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host === 'youtu.be') {
      return 'youtube';
    }
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
      return 'x';
    }
    if (host.includes('reddit.com') || host === 'redd.it') {
      return 'reddit';
    }
    if (host.includes('instagram.com')) {
      return 'instagram';
    }
    return 'website';
  } catch {
    return 'website';
  }
}

export function getPlatformMetadata(platform: PlatformType, url?: string): PlatformMetadata {
  switch (platform) {
    case 'youtube':
      return {
        platform: 'youtube',
        label: 'YouTube',
        defaultTitle: 'YouTube Video'
      };
    case 'x':
      return {
        platform: 'x',
        label: 'X (Twitter)',
        defaultTitle: 'X Post'
      };
    case 'reddit':
      return {
        platform: 'reddit',
        label: 'Reddit',
        defaultTitle: 'Reddit Post'
      };
    case 'instagram':
      return {
        platform: 'instagram',
        label: 'Instagram',
        defaultTitle: 'Instagram Reel'
      };
    case 'website':
    default: {
      let defaultTitle = 'Web Article';
      if (url) {
        try {
          const parsed = new URL(url);
          defaultTitle = parsed.hostname.replace(/^www\./i, '');
        } catch {}
      }
      return {
        platform: 'website',
        label: 'Website',
        defaultTitle
      };
    }
  }
}

export function generateDefaultTitle(url: string, platform?: PlatformType): string {
  const detected = platform || detectPlatform(url);
  const meta = getPlatformMetadata(detected, url);
  return meta.defaultTitle;
}
