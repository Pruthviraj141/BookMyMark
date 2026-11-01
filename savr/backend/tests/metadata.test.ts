import { describe, it, expect } from 'vitest';
import { MetadataService } from '../src/services/metadata.service.js';
import { isSafePublicUrl, normalizeUrl, extractUrlFromText } from '../src/utils/url.utils.js';

describe('MetadataService & URL Security', () => {
  it('extracts metadata correctly from a controlled HTML fixture', () => {
    const fixtureHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fallback Document Title</title>
          <meta property="og:title" content="Understanding Entropy in Modern Physics" />
          <meta property="og:description" content="A comprehensive guide to thermodynamic and information entropy." />
          <meta property="og:image" content="https://images.example.com/entropy-cover.jpg" />
          <meta name="author" content="Dr. Jane Doe" />
          <link rel="canonical" href="https://example.com/physics/entropy" />
        </head>
        <body>
          <main>
            <h1>Understanding Entropy</h1>
            <p>Entropy is a fundamental concept in physics and thermodynamics that measures disorder.</p>
            <p>It also plays an essential role in information theory, where Claude Shannon generalized it.</p>
          </main>
        </body>
      </html>
    `;

    const metadata = MetadataService.parseHtml(fixtureHtml, 'https://example.com/physics/entropy');

    expect(metadata.title).toBe('Understanding Entropy in Modern Physics');
    expect(metadata.description).toBe('A comprehensive guide to thermodynamic and information entropy.');
    expect(metadata.thumbnail_url).toBe('https://images.example.com/entropy-cover.jpg');
    expect(metadata.author_name).toBe('Dr. Jane Doe');
    expect(metadata.canonical_url).toBe('https://example.com/physics/entropy');
    expect(metadata.extracted_text).toContain('Claude Shannon');
  });

  it('generates YouTube thumbnail fallback when video ID is available', () => {
    const emptyHtml = `<html><head><title>Some Video</title></head><body></body></html>`;
    const metadata = MetadataService.parseHtml(emptyHtml, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(metadata.thumbnail_url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('rejects SSRF attempts for localhost and private networks', () => {
    expect(isSafePublicUrl('http://localhost:3000/admin')).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1:8080')).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.1/sensitive')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1/router')).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.1')).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isSafePublicUrl('ftp://example.com/file')).toBe(false);
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);

    expect(isSafePublicUrl('https://example.com/article')).toBe(true);
    expect(isSafePublicUrl('https://instagram.com/p/123')).toBe(true);
  });

  it('normalizes URLs by stripping tracking parameters', () => {
    const dirtyUrl = 'https://www.instagram.com/reel/C1234567/?igsh=abc123xyz&utm_source=copy_link#top';
    const normalized = normalizeUrl(dirtyUrl);
    expect(normalized).toBe('https://instagram.com/reel/C1234567');
  });

  it('extracts URL from raw shared text', () => {
    const sharedText = 'Check out this awesome video: https://youtu.be/dQw4w9WgXcQ! It blew my mind.';
    const extracted = extractUrlFromText(sharedText);
    expect(extracted).toBe('https://youtu.be/dQw4w9WgXcQ');
  });
});
