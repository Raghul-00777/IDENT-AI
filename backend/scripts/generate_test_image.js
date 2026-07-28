import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '..', '..', 'frontend', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
await sharp({ create: { width: 600, height: 400, channels: 3, background: { r: 60, g: 120, b: 200 } } })
  .jpeg({ quality: 85 })
  .toFile(path.join(outDir, 'test.jpg'));
console.log('Wrote frontend/assets/test.jpg');
