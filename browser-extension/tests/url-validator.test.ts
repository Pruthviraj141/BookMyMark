import { describe, it, expect } from 'vitest';
import { validateUrl, getDomainFromUrl, truncateUrl } from '../src/utils/url-validator.js';

describe('URL Validator', () => {
  it('should accept standard HTTPS and HTTP URLs', () => {
    const urls = [
      'https://example.com',
      'http://example.com/path?arg=1#hash',
      'https://sub.domain.co.uk/articles/2026/04?utm_source=test',
      'http://localhost:3000/dashboard'
    ];

    for (const url of urls) {
      const result = validateUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe(url);
      expect(result.error).toBeUndefined();
    }
  });

  it('should reject invalid or empty URLs without throwing', () => {
    expect(validateUrl('')).toMatchObject({ isValid: false });
    expect(validateUrl('   ')).toMatchObject({ isValid: false });
    expect(validateUrl(null as any)).toMatchObject({ isValid: false });
    expect(validateUrl(undefined as any)).toMatchObject({ isValid: false });
    expect(validateUrl('not a url')).toMatchObject({ isValid: false });
  });

  it('should reject unsupported schemes (javascript, file, blob, data, etc.)', () => {
    const unsupported = [
      'javascript:alert(1)',
      'data:text/html,<h1>Hello</h1>',
      'blob:https://example.com/uuid-here',
      'file:///home/user/document.pdf',
      'view-source:https://example.com',
      'ftp://files.example.com'
    ];

    for (const url of unsupported) {
      const result = validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should reject internal browser scheme URLs (chrome://, about:, moz-extension:, etc.)', () => {
    const internalUrls = [
      'chrome://extensions',
      'chrome://settings',
      'about:debugging',
      'about:config',
      'about:blank',
      'moz-extension://some-uuid/popup.html',
      'chrome-extension://some-id/manifest.json',
      'brave://rewards',
      'edge://settings'
    ];

    for (const url of internalUrls) {
      const result = validateUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported scheme');
    }
  });

  it('should correctly extract clean domains', () => {
    expect(getDomainFromUrl('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
    expect(getDomainFromUrl('https://sub.github.io/repo')).toBe('sub.github.io');
    expect(getDomainFromUrl('http://localhost:5173')).toBe('localhost');
  });

  it('should truncate long URLs gracefully', () => {
    const shortUrl = 'https://example.com/short';
    expect(truncateUrl(shortUrl, 50)).toBe(shortUrl);

    const longUrl = 'https://example.com/this-is-a-very-long-url-path-with-many-segments-and-parameters?foo=bar&baz=qux';
    const truncated = truncateUrl(longUrl, 30);
    expect(truncated.length).toBeLessThan(longUrl.length);
    expect(truncated).toContain('example.com');
  });
});
