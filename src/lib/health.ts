import { supabase, isConfigured } from './supabase';
import { getErrorStats } from './error-tracking';
import { getApiStats } from './api-logger';
import { getLatestVitals } from './performance';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number };
    serviceWorker: { status: 'active' | 'inactive' };
    offline: { status: 'available' | 'unavailable' };
    errors: { last24h: number; rate: string };
    performance: Record<string, { value: number; rating: string }>;
    apiStats: { lastHourRequests: number; avgResponseMs: number; errorRate: string };
  };
  version: string;
}

const _startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    database: { status: 'down', latencyMs: 0 },
    serviceWorker: { status: 'inactive' },
    offline: { status: 'unavailable' },
    errors: { last24h: 0, rate: '0.0' },
    performance: {},
    apiStats: { lastHourRequests: 0, avgResponseMs: 0, errorRate: '0.0' },
  };

  if (isConfigured()) {
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from('receipts').select('id', { count: 'exact', head: true });
      checks.database = { status: error ? 'down' : 'up', latencyMs: Math.round(performance.now() - dbStart) };
    } catch {
      checks.database = { status: 'down', latencyMs: Math.round(performance.now() - dbStart) };
    }
  }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    checks.serviceWorker.status = reg?.active ? 'active' : 'inactive';
  }

  checks.offline.status = 'indexedDB' in window ? 'available' : 'unavailable';

  const errorStats = getErrorStats();
  checks.errors = { last24h: errorStats.last24h, rate: `${errorStats.last24h}/24h` };

  const vitals = getLatestVitals();
  for (const [name, v] of Object.entries(vitals)) {
    checks.performance[name] = { value: v.value, rating: v.rating };
  }

  checks.apiStats = getApiStats();

  const dbOk = !isConfigured() || checks.database.status === 'up';
  const errorsLow = errorStats.last24h < 50;
  const overall = dbOk && errorsLow ? 'healthy' : dbOk || errorsLow ? 'degraded' : 'unhealthy';

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - _startTime) / 1000),
    checks,
    version: __APP_VERSION__,
  };
}

declare const __APP_VERSION__: string;
