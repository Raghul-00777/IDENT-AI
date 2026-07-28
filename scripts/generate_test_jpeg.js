import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '..', 'frontend', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
await sharp({ create: { width: 256, height: 256, channels: 3, background: { r: 180, g: 60, b: 60 } } })
  .jpeg({ quality: 80 })
  .toFile(path.join(outDir, 'test.jpg'));
console.log('Wrote frontend/assets/test.jpg');
