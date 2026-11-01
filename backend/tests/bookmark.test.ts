import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import { getDb } from '../src/database/connection.js';
import { BookmarkRepository } from '../src/repositories/bookmark.repository.js';

describe('Bookmarks API & Pipeline', () => {
  const app = createApp();

  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  beforeAll(async () => {
    getDb();

    // Register User A
    const resA = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user_a_${Date.now()}`,
        password: 'password123!'
      })
    });
    const bodyA = await resA.json();
    userAToken = bodyA.data.token;
    userAId = bodyA.data.user.id;

    // Register User B
    const resB = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user_b_${Date.now()}`,
        password: 'password123!'
      })
    });
    const bodyB = await resB.json();
    userBToken = bodyB.data.token;
    userBId = bodyB.data.user.id;
  });

  let createdBookmarkId: string;

  it('creates a bookmark for authenticated user immediately', async () => {
    const res = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sharedText: 'Check out this classic video',
        title: 'Never Gonna Give You Up'
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.platform).toBe('youtube');
    expect(body.data.thumbnail_url).toContain('hqdefault.jpg');
    expect(body.data.ai_status).toBe('pending');
    expect(Array.isArray(body.data.tags)).toBe(true);

    createdBookmarkId = body.data.id;
  });

  it('handles duplicate bookmarks gracefully without duplicate insertion', async () => {
    // Attempt to submit identical URL (different tracking param)
    const res = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=share',
        sharedText: 'Duplicate submission test'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.is_duplicate).toBe(true);
    expect(body.data.id).toBe(createdBookmarkId);
  });

  it('retrieves individual bookmark by ID', async () => {
    const res = await app.request(`/api/bookmarks/${createdBookmarkId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdBookmarkId);
  });

  it('enforces user ownership: User B cannot access User A bookmark', async () => {
    const res = await app.request(`/api/bookmarks/${createdBookmarkId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userBToken}` }
    });

    expect(res.status).toBe(404);
  });

  it('updates bookmark notes, title, and tags', async () => {
    const res = await app.request(`/api/bookmarks/${createdBookmarkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        notes: 'Personal note for testing',
        category: 'Entertainment',
        tags: ['Music', 'Classic', 'Memes']
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.notes).toBe('Personal note for testing');
    expect(body.data.category).toBe('Entertainment');
    expect(body.data.tags).toContain('Memes');
  });

  it('searches bookmarks across title, notes, and tags', async () => {
    const res = await app.request('/api/bookmarks/search?q=Classic', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(body.data.items[0].id).toBe(createdBookmarkId);
  });

  it('lists bookmarks with platform filtering and pagination', async () => {
    const res = await app.request('/api/bookmarks?platform=youtube&page=1&limit=10', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bookmarks.length).toBeGreaterThanOrEqual(1);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('aggregates categories and tags', async () => {
    const catRes = await app.request('/api/categories', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const catBody = await catRes.json();
    expect(catBody.success).toBe(true);
    expect(catBody.data.some((c: any) => c.category === 'Entertainment')).toBe(true);

    const tagRes = await app.request('/api/tags', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const tagBody = await tagRes.json();
    expect(tagBody.success).toBe(true);
    expect(tagBody.data.some((t: any) => t.tag === 'Memes')).toBe(true);
  });

  it('preserves bookmark if AI classification fails', () => {
    // Direct repository resilience test
    BookmarkRepository.update(createdBookmarkId, userAId, {
      ai_status: 'failed',
      ai_error: 'Network timeout during provider request'
    });

    const retrieved = BookmarkRepository.findById(createdBookmarkId, userAId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.ai_status).toBe('failed');
    expect(retrieved?.ai_error).toContain('Network timeout');
    expect(retrieved?.url).toContain('youtube.com');
  });

  it('deletes bookmark successfully', async () => {
    const res = await app.request(`/api/bookmarks/${createdBookmarkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    expect(res.status).toBe(200);

    const check = await app.request(`/api/bookmarks/${createdBookmarkId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    expect(check.status).toBe(404);
  });
});
