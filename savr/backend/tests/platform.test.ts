import { describe, it, expect } from 'vitest';
import { PlatformService } from '../src/services/platform.service.js';

describe('PlatformService Detection', () => {
  it('correctly detects Instagram URLs', () => {
    expect(PlatformService.detectPlatform('https://www.instagram.com/reel/C1234567/')).toBe('instagram');
    expect(PlatformService.detectPlatform('https://instagram.com/p/B1234567/')).toBe('instagram');
  });

  it('correctly detects X / Twitter URLs', () => {
    expect(PlatformService.detectPlatform('https://x.com/username/status/123456789')).toBe('x');
    expect(PlatformService.detectPlatform('https://twitter.com/username/status/123456789')).toBe('x');
  });

  it('correctly detects YouTube URLs and video IDs', () => {
    expect(PlatformService.detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(PlatformService.extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');

    expect(PlatformService.detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(PlatformService.extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');

    expect(PlatformService.detectPlatform('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('youtube');
    expect(PlatformService.extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('correctly detects Reddit URLs', () => {
    expect(PlatformService.detectPlatform('https://www.reddit.com/r/programming/comments/123/title/')).toBe('reddit');
  });

  it('correctly detects TikTok URLs', () => {
    expect(PlatformService.detectPlatform('https://www.tiktok.com/@user/video/123456789')).toBe('tiktok');
  });

  it('detects standard websites', () => {
    expect(PlatformService.detectPlatform('https://en.wikipedia.org/wiki/Entropy')).toBe('website');
  });

  it('does not falsely classify unrelated domains that contain platform names', () => {
    expect(PlatformService.detectPlatform('https://notreddit.com/post/1')).toBe('website');
    expect(PlatformService.detectPlatform('https://x-men-fan-club.org/')).toBe('website');
  });
});
