import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const CONFIG = {
  PORT: Number(process.env.PORT || 4000),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'IDENT AI',
  JWT_SECRET: process.env.JWT_SECRET || 'ident-ai-secret',
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../data/ident-ai.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR ? path.resolve(__dirname, '..', process.env.UPLOAD_DIR) : path.resolve(__dirname, '../uploads'),
  REPORT_DIR: process.env.REPORT_DIR ? path.resolve(__dirname, '..', process.env.REPORT_DIR) : path.resolve(__dirname, '../uploads/reports'),
  MODEL_DIR: process.env.MODEL_DIR ? path.resolve(__dirname, '..', process.env.MODEL_DIR) : path.resolve(__dirname, '../models'),
  XCEPTION_MODEL_PATH: process.env.XCEPTION_MODEL_PATH ? path.resolve(__dirname, '..', process.env.XCEPTION_MODEL_PATH) : path.resolve(__dirname, '../models/xception/model.json'),
  GROK_API_URL: process.env.GROK_API_URL || 'https://api.grok.com/v1/responses',
  GROK_API_KEY: process.env.GROK_API_KEY || '',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()) : ['http://localhost:5173'],
  MAX_UPLOAD_SIZE: 50 * 1024 * 1024,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 120),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
  ALLOWED_VIDEO_EXTENSIONS: ['mp4', 'avi', 'mov', 'mkv'],
};
