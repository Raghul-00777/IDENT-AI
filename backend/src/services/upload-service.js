import fs from 'fs';
import { readDatabase, writeDatabase } from '../database.js';
import { getTempPath } from './storage.js';
import { v4 as uuidv4 } from 'uuid';

export async function saveUpload({ filename, buffer, mimeType, size, mediaType, userId = null }) {
  const filepath = getTempPath(filename);
  await fs.promises.writeFile(filepath, buffer);
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const db = readDatabase();
  db.uploads.push({ id, user_id: userId, filename, file_path: filepath, file_size: size, media_type: mediaType, created_at: createdAt });
  writeDatabase(db);
  return { id, file_path: filepath, file_size: size, created_at: createdAt };
}
