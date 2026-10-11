import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/upload-pdf': 'http://localhost:8000',
      '/role-select': 'http://localhost:8000',
      '/upload-jd': 'http://localhost:8000',
      '/analyze': 'http://localhost:8000',
      '/reccomanded-roles': 'http://localhost:8000',
      '/roadmap': 'http://localhost:8000',
    }
  }
});
