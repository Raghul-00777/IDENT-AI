import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export async function initDatabase() {
  const dbDir = path.dirname(CONFIG.DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(CONFIG.DB_PATH)) {
    await fs.promises.writeFile(CONFIG.DB_PATH, JSON.stringify({ users: [], uploads: [], predictions: [], reports: [], logs: [] }, null, 2));
  }
}

export function readDatabase() {
  const raw = fs.readFileSync(CONFIG.DB_PATH, 'utf-8');
  return JSON.parse(raw || '{}');
}

export function writeDatabase(data) {
  fs.writeFileSync(CONFIG.DB_PATH, JSON.stringify(data, null, 2));
}
