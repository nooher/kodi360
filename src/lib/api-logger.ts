// api-logger.ts — a ring buffer of Supabase/API call outcomes (duration, error
// rate), used by the health check and any future ops view.

interface ApiLogEntry {
  op: string;
  ms: number;
  ok: boolean;
  timestamp: number;
}

const MAX_ENTRIES = 200;
let buffer: ApiLogEntry[] = [];

export async function withApiLogging<T>(op: string, fn: () => PromiseLike<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    buffer.push({ op, ms: Math.round(performance.now() - start), ok: true, timestamp: Date.now() });
    if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
    return result;
  } catch (err) {
    buffer.push({ op, ms: Math.round(performance.now() - start), ok: false, timestamp: Date.now() });
    if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
    throw err;
  }
}

export function getApiStats() {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const lastHour = buffer.filter((e) => e.timestamp >= hourAgo);
  const errors = lastHour.filter((e) => !e.ok).length;
  const avg = lastHour.length > 0 ? lastHour.reduce((s, e) => s + e.ms, 0) / lastHour.length : 0;
  return {
    lastHourRequests: lastHour.length,
    avgResponseMs: Math.round(avg),
    errorRate: lastHour.length > 0 ? ((errors / lastHour.length) * 100).toFixed(1) : '0.0',
  };
}

export function clearApiLog(): void {
  buffer = [];
}
