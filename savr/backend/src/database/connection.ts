import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { initializeDatabase } from './schema.js';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(dbPath);
  initializeDatabase(dbInstance);

  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
