import { defineConfig } from 'vite';
import { globSync } from 'glob';
import path from 'path';

const htmlEntries = Object.fromEntries(
  globSync('frontend/*.html').map((file) => [
    file.slice('frontend/'.length, -'.html'.length),
    path.resolve(file),
  ])
);

export default defineConfig({
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { input: htmlEntries },
    target: 'esnext',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
