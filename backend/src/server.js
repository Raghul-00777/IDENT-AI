import app from './app.js';
import { CONFIG } from './config.js';
import { initDatabase } from './database.js';
import { ensureUploadDirs } from './services/storage.js';

async function start() {
  await initDatabase();
  await ensureUploadDirs();
  const server = app.listen(CONFIG.PORT, () => {
    console.log(`IDENT AI backend running on http://localhost:${CONFIG.PORT}`);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down IDENT AI backend...');
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
