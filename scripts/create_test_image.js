import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, '..', 'frontend', 'assets');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// 64x64 red PNG base64 (single-line)
const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAACp8GOEAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABh0RVh0U29mdHdhcmUATWljcm9zb2Z0IEV4cGVyaWVuY2Ue0oEAAABxSURBVHja7NExAQAwEMCw9/59kQwYx0p0F0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwGvQABAP9jA9mK8s1oAAAAASUVORK5CYII=';
const buf = Buffer.from(b64, 'base64');
fs.writeFileSync(path.join(dir, 'test.jpg'), buf);
console.log('Wrote frontend/assets/test.jpg');
