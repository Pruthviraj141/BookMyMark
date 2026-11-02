import { describe, it, expect } from 'vitest';
import { detectPlatform, getPlatformMetadata, generateDefaultTitle } from '../src/utils/platform-detector.js';

describe('Platform Detector', () => {
  it('should detect YouTube URLs correctly', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://m.youtube.com/watch?v=123')).toBe('youtube');
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://youtube.com/shorts/abc123xyz')).toBe('youtube');
  });

  it('should detect X / Twitter URLs correctly', () => {
    expect(detectPlatform('https://x.com/user/status/123456789')).toBe('x');
    expect(detectPlatform('https://twitter.com/user/status/123456789')).toBe('x');
    expect(detectPlatform('https://mobile.twitter.com/home')).toBe('x');
  });

  it('should detect Reddit URLs correctly', () => {
    expect(detectPlatform('https://www.reddit.com/r/programming/comments/123')).toBe('reddit');
    expect(detectPlatform('https://old.reddit.com/r/news')).toBe('reddit');
    expect(detectPlatform('https://redd.it/xyz')).toBe('reddit');
  });

  it('should detect Instagram URLs correctly', () => {
    expect(detectPlatform('https://www.instagram.com/reel/C34567/')).toBe('instagram');
    expect(detectPlatform('https://instagram.com/p/B9876/')).toBe('instagram');
  });

  it('should fallback to website for other domains', () => {
    expect(detectPlatform('https://news.ycombinator.com')).toBe('website');
    expect(detectPlatform('https://github.com/facebook/react')).toBe('website');
    expect(detectPlatform('https://developer.mozilla.org/en-US/')).toBe('website');
  });

  it('should generate appropriate platform metadata and default titles', () => {
    const ytMeta = getPlatformMetadata('youtube');
    expect(ytMeta.label).toBe('YouTube');
    expect(ytMeta.defaultTitle).toBe('YouTube Video');

    const xMeta = getPlatformMetadata('x');
    expect(xMeta.label).toBe('X (Twitter)');
    expect(xMeta.defaultTitle).toBe('X Post');

    const redditMeta = getPlatformMetadata('reddit');
    expect(redditMeta.label).toBe('Reddit');
    expect(redditMeta.defaultTitle).toBe('Reddit Post');

    const instaMeta = getPlatformMetadata('instagram');
    expect(instaMeta.label).toBe('Instagram');
    expect(instaMeta.defaultTitle).toBe('Instagram Reel');

    const webTitle = generateDefaultTitle('https://www.bbc.com/news');
    expect(webTitle).toBe('bbc.com');
  });
});
