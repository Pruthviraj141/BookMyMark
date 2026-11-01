import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import { getDb } from '../src/database/connection.js';
import { UserRepository } from '../src/repositories/user.repository.js';
import bcrypt from 'bcryptjs';

describe('Authentication & User Management', () => {
  const app = createApp();
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'password123!'
  };

  beforeAll(() => {
    // Ensure DB is initialized
    getDb();
  });

  it('registers a new user successfully and hashes password', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe(testUser.username);
    expect(body.data.user.id).toBeDefined();
    expect(body.data.token).toBeDefined();
    expect(body.data.user.password_hash).toBeUndefined();

    // Verify stored password hash in DB
    const dbUser = UserRepository.findByUsername(testUser.username);
    expect(dbUser).not.toBeNull();
    expect(dbUser?.password_hash).not.toBe(testUser.password);
    expect(await bcrypt.compare(testUser.password, dbUser!.password_hash)).toBe(true);
  });

  it('rejects duplicate username registration', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('already taken');
  });

  it('logs in the user with valid credentials', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.username).toBe(testUser.username);
  });

  it('rejects login with incorrect password', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: 'wrong_password'
      })
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('retrieves user profile from /api/auth/me with Bearer token', async () => {
    // First login to get token
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const { data } = await loginRes.json();

    const meRes = await app.request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${data.token}` }
    });

    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.username).toBe(testUser.username);
  });

  it('rejects unauthenticated requests to protected endpoints', async () => {
    const res = await app.request('/api/auth/me', {
      method: 'GET'
    });
    expect(res.status).toBe(401);
  });
});
