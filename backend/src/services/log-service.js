import { readDatabase, writeDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export function logEvent(event, details = '') {
  const db = readDatabase();
  db.logs.unshift({ id: uuidv4(), event, details, created_at: new Date().toISOString() });
  if (db.logs.length > 500) db.logs.length = 500;
  writeDatabase(db);
}

export function getRecentLogs(limit = 50) {
  const db = readDatabase();
  return db.logs.slice(0, limit);
}
