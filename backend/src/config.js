import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const isRender = Boolean(process.env.RENDER || process.env.RENDER_INTERNAL_HOSTNAME);
const runtimeRoot = isVercel || isRender || process.env.NODE_ENV === 'production'
  ? path.resolve(os.tmpdir(), 'ident-ai')
  : path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const CONFIG = {
  PORT: Number(process.env.PORT || 4000),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'IDENT AI',
  JWT_SECRET: process.env.JWT_SECRET || 'ident-ai-secret',
  DB_PATH: process.env.DB_PATH || path.resolve(runtimeRoot, 'ident-ai.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR
    ? path.resolve(__dirname, '..', process.env.UPLOAD_DIR)
    : path.resolve(runtimeRoot, 'uploads'),
  REPORT_DIR: process.env.REPORT_DIR
    ? path.resolve(__dirname, '..', process.env.REPORT_DIR)
    : path.resolve(runtimeRoot, 'uploads', 'reports'),
  MODEL_DIR: process.env.MODEL_DIR
    ? path.resolve(__dirname, '..', process.env.MODEL_DIR)
    : path.resolve(runtimeRoot, 'models'),
  XCEPTION_MODEL_PATH: process.env.XCEPTION_MODEL_PATH
    ? path.resolve(__dirname, '..', process.env.XCEPTION_MODEL_PATH)
    : path.resolve(runtimeRoot, 'models', 'xception', 'model.json'),
  GROK_API_URL: process.env.GROK_API_URL || 'https://api.grok.com/v1/responses',
  GROK_API_KEY: process.env.GROK_API_KEY || '',
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : '*',
  MAX_UPLOAD_SIZE: 50 * 1024 * 1024,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 120),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
  ALLOWED_VIDEO_EXTENSIONS: ['mp4', 'avi', 'mov', 'mkv'],
};
