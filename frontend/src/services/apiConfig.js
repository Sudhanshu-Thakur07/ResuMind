/**
 * apiConfig.js - ResuMind Dynamic Backend Port & Endpoint Manager
 *
 * Automatically discovers active backend port across common FastAPI/Uvicorn ports (8001, 8000, 8002, etc.),
 * persists user preference in localStorage, and allows custom port/URL entry.
 */

export const CANDIDATE_PORTS = [8001, 8000, 8002, 8003, 8004, 8005, 8080, 5000];
const STORAGE_KEY = 'resumind_api_base';

/**
 * Normalizes input (port number or URL) into a standard http:// URL without trailing slash.
 * Examples:
 *   "8001" -> "http://localhost:8001"
 *   "localhost:8001" -> "http://localhost:8001"
 *   "http://localhost:8001/" -> "http://localhost:8001"
 *   "http://127.0.0.1:8001" -> "http://127.0.0.1:8001"
 */
export function normalizeApiUrl(input) {
  if (!input) return 'http://localhost:8001';
  let str = String(input).trim();

  // If input is purely digits, treat as port on localhost
  if (/^\d+$/.test(str)) {
    return `http://localhost:${str}`;
  }

  // Prepend http:// if missing protocol
  if (!/^https?:\/\//i.test(str)) {
    str = `http://${str}`;
  }

  // Remove trailing slashes
  return str.replace(/\/+$/, '');
}

/**
 * Extracts port number or short label for display.
 * Examples:
 *   "http://localhost:8001" -> "Port 8001"
 *   "http://127.0.0.1:8000" -> "Port 8000"
 *   "https://api.example.com" -> "api.example.com"
 */
export function formatPortDisplay(url) {
  if (!url) return 'Port 8001';
  try {
    const parsed = new URL(url);
    if (parsed.port) {
      return `Port ${parsed.port}`;
    }
    return parsed.hostname;
  } catch {
    const match = url.match(/:(\d+)/);
    return match ? `Port ${match[1]}` : url;
  }
}

/**
 * Resolves the initial API base URL:
 * 1. URL search params: ?port=8001 or ?api=http://localhost:8001
 * 2. Saved preference in localStorage
 * 3. Vite environment variable (VITE_API_BASE)
 * 4. Window origin (if served from backend port)
 * 5. Default: http://localhost:8001
 */
export function getInitialApiBase() {
  if (typeof window !== 'undefined') {
    // 1. Query parameter override
    const params = new URLSearchParams(window.location.search);
    const portParam = params.get('port');
    const apiParam = params.get('api') || params.get('api_base');
    if (portParam) return normalizeApiUrl(portParam);
    if (apiParam) return normalizeApiUrl(apiParam);

    // 2. Saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeApiUrl(saved);

    // 3. Vite env variable
    if (import.meta.env?.VITE_API_BASE) {
      return normalizeApiUrl(import.meta.env.VITE_API_BASE);
    }

    // 4. If loaded on backend port directly
    if (window.location.port && !['5173', '3000', '4173'].includes(window.location.port)) {
      return window.location.origin;
    }
  }

  // 5. Default fallback to 8001 (matching active uvicorn setup)
  return 'http://localhost:8001';
}

/**
 * Saves chosen API base to localStorage.
 */
export function saveApiBasePreference(url) {
  try {
    const normalized = normalizeApiUrl(url);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }
    return normalized;
  } catch (e) {
    return url;
  }
}

/**
 * Pings a single target API URL to verify if ResuMind backend is alive.
 */
export async function checkApiHealth(baseUrl, timeoutMs = 1500) {
  const url = normalizeApiUrl(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`${url}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return {
        ok: true,
        status: resp.status,
        url,
        data,
      };
    }
    return { ok: false, status: resp.status, url };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.message, url };
  }
}

/**
 * Probes candidate ports in parallel to auto-detect where the backend is running.
 * Returns the first active URL or null if none reachable.
 */
export async function autoDetectBackend(customCandidates = []) {
  const portsToTest = [
    ...new Set([
      ...customCandidates.map((c) => normalizeApiUrl(c)),
      ...CANDIDATE_PORTS.map((p) => `http://localhost:${p}`),
    ]),
  ];

  try {
    // Run all probes concurrently with individual short timeouts
    const probes = portsToTest.map((target) =>
      checkApiHealth(target, 1200).then((res) => {
        if (res.ok) return res.url;
        throw new Error('Not reachable');
      })
    );

    const activeUrl = await Promise.any(probes);
    saveApiBasePreference(activeUrl);
    return activeUrl;
  } catch {
    // All candidates failed
    return null;
  }
}
