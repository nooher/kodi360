// error-tracking.ts — client-side error ring buffer (localStorage-persisted),
// global error/rejection listeners, and a threshold alert hook. Feeds
// ErrorBoundary + the health check.

const MAX_ENTRIES = 100;
const STORAGE_KEY = 'kodi360_error_log';

export interface ErrorEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  type: 'error' | 'unhandledrejection' | 'component';
  url: string;
  extra?: Record<string, unknown>;
}

let buffer: ErrorEntry[] = [];
let initialized = false;
let _alertCallback: ((entry: ErrorEntry) => void) | null = null;
const ALERT_THRESHOLD = 10;
const ALERT_WINDOW_MS = 5 * 60 * 1000;

function load(): ErrorEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    /* storage full — silent */
  }
}

function checkAlertThreshold() {
  const now = Date.now();
  const recent = buffer.filter((e) => now - new Date(e.timestamp).getTime() < ALERT_WINDOW_MS);
  if (recent.length >= ALERT_THRESHOLD && _alertCallback) {
    _alertCallback(recent[recent.length - 1]);
  }
}

function push(entry: ErrorEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
  persist();
  checkAlertThreshold();
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function captureError(error: unknown, extra?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  push({
    id: makeId(),
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    type: extra?.componentStack ? 'component' : 'error',
    url: typeof location !== 'undefined' ? location.href : '',
    extra,
  });
}

export function initErrorTracking() {
  if (initialized) return;
  initialized = true;
  buffer = load();

  window.addEventListener('error', (e) => {
    push({
      id: makeId(),
      timestamp: new Date().toISOString(),
      message: e.message || 'Unknown error',
      stack: e.error?.stack,
      source: e.filename,
      line: e.lineno,
      column: e.colno,
      type: 'error',
      url: location.href,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    push({
      id: makeId(),
      timestamp: new Date().toISOString(),
      message: msg,
      stack: reason instanceof Error ? reason.stack : undefined,
      type: 'unhandledrejection',
      url: location.href,
    });
  });
}

export function getErrors(): ErrorEntry[] {
  return [...buffer];
}

export function clearErrors() {
  buffer = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function onErrorAlert(callback: (entry: ErrorEntry) => void): () => void {
  _alertCallback = callback;
  return () => {
    _alertCallback = null;
  };
}

export function getErrorStats() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last24h = buffer.filter((e) => now - new Date(e.timestamp).getTime() < day).length;
  return {
    total: buffer.length,
    last24h,
    lastError: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null,
  };
}
