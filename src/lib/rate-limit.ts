// rate-limit.ts — an in-memory token-bucket limiter for login attempts and
// citizen form submissions (login brute-force protection + spam protection on
// public anon-insert endpoints). Client-side layer; Supabase RLS + future
// server-side checks are the hard backstop.

type BucketConfig = {
  maxTokens: number;
  refillRate: number;
  refillInterval: number;
};

const PRESETS: Record<string, BucketConfig> = {
  login: { maxTokens: 5, refillRate: 1, refillInterval: 60_000 },
  submit: { maxTokens: 10, refillRate: 2, refillInterval: 30_000 },
  api: { maxTokens: 60, refillRate: 10, refillInterval: 10_000 },
};

interface Bucket {
  tokens: number;
  lastRefill: number;
  config: BucketConfig;
}

const buckets = new Map<string, Bucket>();

function getBucket(key: string, preset: string): Bucket {
  const existing = buckets.get(key);
  if (existing) return existing;

  const config = PRESETS[preset];
  if (!config) throw new Error(`Unknown rate-limit preset: ${preset}`);

  const bucket: Bucket = { tokens: config.maxTokens, lastRefill: Date.now(), config };
  buckets.set(key, bucket);
  return bucket;
}

function refill(bucket: Bucket): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const intervals = Math.floor(elapsed / bucket.config.refillInterval);

  if (intervals > 0) {
    bucket.tokens = Math.min(bucket.config.maxTokens, bucket.tokens + intervals * bucket.config.refillRate);
    bucket.lastRefill = now;
  }
}

export function checkRateLimit(preset: string, identifier?: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const key = `${preset}:${identifier ?? 'global'}`;
  const bucket = getBucket(key, preset);
  refill(bucket);

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens, retryAfterMs: 0 };
  }

  const retryAfterMs = bucket.config.refillInterval - (Date.now() - bucket.lastRefill);
  return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) };
}

export function resetRateLimit(preset: string, identifier?: string): void {
  buckets.delete(`${preset}:${identifier ?? 'global'}`);
}

export function getRateLimitStatus(): Record<string, { remaining: number; max: number }> {
  const status: Record<string, { remaining: number; max: number }> = {};
  for (const [key, bucket] of buckets) {
    refill(bucket);
    status[key] = { remaining: bucket.tokens, max: bucket.config.maxTokens };
  }
  return status;
}
