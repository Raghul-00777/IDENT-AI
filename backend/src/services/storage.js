import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

export async function ensureUploadDirs() {
  [CONFIG.UPLOAD_DIR, CONFIG.REPORT_DIR, path.dirname(CONFIG.DB_PATH)].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

export function getTempPath(filename) {
  return path.join(CONFIG.UPLOAD_DIR, `${Date.now()}-${filename}`);
}

export function getReportPath(reportId) {
  return path.join(CONFIG.REPORT_DIR, `${reportId}.pdf`);
}
