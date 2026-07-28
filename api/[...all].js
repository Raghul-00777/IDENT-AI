import app from '../backend/src/app.js';
import { initDatabase } from '../backend/src/database.js';
import { ensureUploadDirsSync } from '../backend/src/services/storage.js';

let runtimeInitialized = false;

async function ensureRuntimeInitialized() {
  if (runtimeInitialized) return;
  try {
    ensureUploadDirsSync();
    await initDatabase();
    runtimeInitialized = true;
  } catch (err) {
    console.warn('Failed to initialize Vercel runtime storage:', err.message || err);
  }
}

export default async function handler(req, res) {
  await ensureRuntimeInitialized();
  return app(req, res);
}
