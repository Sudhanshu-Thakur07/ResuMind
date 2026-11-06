import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';

// Helper to quickly probe if a backend port is actively listening
function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 350 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

const CANDIDATE_PORTS = [8001, 8000, 8002, 8080, 5000];
let currentBackendTarget = 'http://127.0.0.1:8001';

async function refreshBackendTarget() {
  if (process.env.VITE_BACKEND_PORT) {
    currentBackendTarget = `http://127.0.0.1:${process.env.VITE_BACKEND_PORT}`;
    return;
  }
  try {
    const parsed = new URL(currentBackendTarget);
    if (parsed.port && (await probePort(parseInt(parsed.port, 10)))) {
      return;
    }
  } catch (_) {}

  for (const port of CANDIDATE_PORTS) {
    if (await probePort(port)) {
      currentBackendTarget = `http://127.0.0.1:${port}`;
      return;
    }
  }
}

// Initial probe & periodic refresh every 2 seconds
refreshBackendTarget();
setInterval(refreshBackendTarget, 2000);

const getTarget = () => currentBackendTarget;

const proxyErrorHandler = (proxy) => {
  proxy.on('error', (err, req, res) => {
    console.warn(`[Proxy Notice] Backend at ${currentBackendTarget} not ready:`, err.message);
    refreshBackendTarget();
    if (res.writeHead && !res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          detail: `Cannot connect to backend at ${currentBackendTarget}. Please ensure your backend is running (e.g. uvicorn main:app --reload --port 8001 or 8000).`,
        })
      );
    }
  });
};

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api-health': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        rewrite: () => '/',
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/upload-pdf': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/role-select': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/upload-jd': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/analyze': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/reccomanded-roles': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
      '/roadmap': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        router: getTarget,
        configure: proxyErrorHandler,
      },
    },
  },
});
