import { getDb } from '../database/connection.js';
import type { User } from '../types/index.js';

export class UserRepository {
  static create(user: Omit<User, 'created_at'>): User {
    const db = getDb();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(user.id, user.username, user.password_hash, createdAt);
    return {
      id: user.id,
      username: user.username,
      password_hash: user.password_hash,
      created_at: createdAt
    };
  }

  static findByUsername(username: string): User | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE username = ?
    `);
    const row = stmt.get(username) as User | undefined;
    return row || null;
  }

  static findById(id: string): User | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE id = ?
    `);
    const row = stmt.get(id) as User | undefined;
    return row || null;
  }
}
