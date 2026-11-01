import { getDb } from '../database/connection.js';
import type { Bookmark, Platform, AiStatus } from '../types/index.js';

export interface ListBookmarksFilter {
  userId: string;
  page?: number;
  limit?: number;
  platform?: string;
  category?: string;
  tag?: string;
  content_type?: string;
  ai_status?: string;
}

export class BookmarkRepository {
  static create(bookmark: Bookmark): Bookmark {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO bookmarks (
        id, user_id, url, normalized_url, platform,
        title, description, thumbnail_url, author_name,
        shared_text, extracted_text, summary, category,
        tags_json, content_type, ai_status, ai_confidence,
        ai_error, notes, created_at, updated_at
      ) VALUES (
        @id, @user_id, @url, @normalized_url, @platform,
        @title, @description, @thumbnail_url, @author_name,
        @shared_text, @extracted_text, @summary, @category,
        @tags_json, @content_type, @ai_status, @ai_confidence,
        @ai_error, @notes, @created_at, @updated_at
      )
    `);

    stmt.run(bookmark);
    return bookmark;
  }

  static findById(id: string, userId?: string): Bookmark | null {
    const db = getDb();
    if (userId) {
      const stmt = db.prepare(`SELECT * FROM bookmarks WHERE id = ? AND user_id = ?`);
      const row = stmt.get(id, userId) as Bookmark | undefined;
      return row || null;
    }
    const stmt = db.prepare(`SELECT * FROM bookmarks WHERE id = ?`);
    const row = stmt.get(id) as Bookmark | undefined;
    return row || null;
  }

  static findByUserAndNormalizedUrl(userId: string, normalizedUrl: string): Bookmark | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM bookmarks
      WHERE user_id = ? AND normalized_url = ?
    `);
    const row = stmt.get(userId, normalizedUrl) as Bookmark | undefined;
    return row || null;
  }

  static list(params: ListBookmarksFilter): {
    items: Bookmark[];
    total: number;
    page: number;
    limit: number;
  } {
    const db = getDb();
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = ?'];
    const args: any[] = [params.userId];

    if (params.platform) {
      conditions.push('platform = ?');
      args.push(params.platform);
    }

    if (params.category) {
      conditions.push('category = ?');
      args.push(params.category);
    }

    if (params.content_type) {
      conditions.push('content_type = ?');
      args.push(params.content_type);
    }

    if (params.ai_status) {
      conditions.push('ai_status = ?');
      args.push(params.ai_status);
    }

    if (params.tag) {
      conditions.push(`tags_json LIKE ?`);
      args.push(`%"${params.tag}"%`);
    }

    const whereClause = conditions.join(' AND ');

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM bookmarks WHERE ${whereClause}`);
    const countRow = countStmt.get(...args) as { count: number };
    const total = countRow ? countRow.count : 0;

    const queryStmt = db.prepare(`
      SELECT * FROM bookmarks
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const items = queryStmt.all(...args, limit, offset) as Bookmark[];

    return {
      items,
      total,
      page,
      limit
    };
  }

  static search(userId: string, query: string, limit: number = 50, offset: number = 0): {
    items: Bookmark[];
    total: number;
  } {
    const db = getDb();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { items: [], total: 0 };
    }

    const wildcard = `%${cleanQuery}%`;

    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM bookmarks
      WHERE user_id = ? AND (
        title LIKE ? OR
        description LIKE ? OR
        summary LIKE ? OR
        tags_json LIKE ? OR
        shared_text LIKE ? OR
        extracted_text LIKE ? OR
        notes LIKE ?
      )
    `);
    const countRow = countStmt.get(
      userId,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard
    ) as { count: number };
    const total = countRow ? countRow.count : 0;

    const queryStmt = db.prepare(`
      SELECT * FROM bookmarks
      WHERE user_id = ? AND (
        title LIKE ? OR
        description LIKE ? OR
        summary LIKE ? OR
        tags_json LIKE ? OR
        shared_text LIKE ? OR
        extracted_text LIKE ? OR
        notes LIKE ?
      )
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const items = queryStmt.all(
      userId,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      wildcard,
      limit,
      offset
    ) as Bookmark[];

    return { items, total };
  }

  static update(id: string, userId: string, updates: Partial<Bookmark>): Bookmark | null {
    const db = getDb();
    const current = this.findById(id, userId);
    if (!current) return null;

    const allowedKeys: (keyof Bookmark)[] = [
      'title',
      'description',
      'thumbnail_url',
      'author_name',
      'shared_text',
      'extracted_text',
      'summary',
      'category',
      'tags_json',
      'content_type',
      'ai_status',
      'ai_confidence',
      'ai_error',
      'notes',
      'platform'
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const key of allowedKeys) {
      if (key in updates) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return current;
    }

    const now = new Date().toISOString();
    fieldsToUpdate.push(`updated_at = ?`);
    values.push(now);

    values.push(id);
    values.push(userId);

    const stmt = db.prepare(`
      UPDATE bookmarks
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);
    return this.findById(id, userId);
  }

  static delete(id: string, userId: string): boolean {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM bookmarks WHERE id = ? AND user_id = ?`);
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static getCategories(userId: string): { category: string; count: number }[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM bookmarks
      WHERE user_id = ? AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `);
    return stmt.all(userId) as { category: string; count: number }[];
  }

  static getTags(userId: string): { tag: string; count: number }[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT tags_json
      FROM bookmarks
      WHERE user_id = ? AND tags_json IS NOT NULL AND tags_json != '[]'
    `);
    const rows = stmt.all(userId) as { tags_json: string }[];
    const tagCountMap: Record<string, number> = {};

    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags_json);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            if (typeof tag === 'string' && tag.trim()) {
              const clean = tag.trim();
              tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
            }
          }
        }
      } catch {
        // ignore malformed json
      }
    }

    return Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
}
