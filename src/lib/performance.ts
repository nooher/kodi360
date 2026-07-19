// performance.ts — Core Web Vitals capture (LCP/FID/CLS/TTFB/FCP), persisted to
// localStorage, surfaced by the health check.

export interface WebVitalEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
}

const STORAGE_KEY = 'kodi360_web_vitals';
const MAX_ENTRIES = 50;
let vitals: WebVitalEntry[] = [];

function load(): WebVitalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vitals));
  } catch {
    /* noop */
  }
}

function rate(name: string, value: number): WebVitalEntry['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  const [good, poor] = thresholds[name] ?? [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function record(name: string, value: number) {
  vitals.push({
    name,
    value: Math.round(value * 100) / 100,
    rating: rate(name, value),
    timestamp: new Date().toISOString(),
  });
  if (vitals.length > MAX_ENTRIES) vitals = vitals.slice(-MAX_ENTRIES);
  persist();
}

export function initPerformanceMonitoring(): void {
  vitals = load();
  if (!('PerformanceObserver' in window)) return;

  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) record('LCP', last.startTime);
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* unsupported */
  }

  try {
    const fidObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        record('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime);
      }
    });
    fidObs.observe({ type: 'first-input', buffered: true });
  } catch {
    /* unsupported */
  }

  try {
    const clsObs = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      }
      if (clsValue > 0) record('CLS', clsValue);
    });
    clsObs.observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* unsupported */
  }

  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navEntry) {
    record('TTFB', navEntry.responseStart - navEntry.requestStart);
    record('FCP', navEntry.domContentLoadedEventEnd - navEntry.startTime);
  }
}

export function getWebVitals(): WebVitalEntry[] {
  return [...vitals];
}

export function getLatestVitals(): Record<string, WebVitalEntry> {
  const latest: Record<string, WebVitalEntry> = {};
  for (const v of vitals) latest[v.name] = v;
  return latest;
}

export function clearVitals(): void {
  vitals = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}
