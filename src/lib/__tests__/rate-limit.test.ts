import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit('login', 'test@example.com');
    resetRateLimit('submit', '0712345678');
  });

  it('allows requests up to the preset max', () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit('login', 'test@example.com');
      expect(r.allowed).toBe(true);
    }
  });

  it('blocks the 6th login attempt within the window', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('login', 'test@example.com');
    const blocked = checkRateLimit('login', 'test@example.com');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate identifiers independently', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('login', 'a@example.com');
    const other = checkRateLimit('login', 'b@example.com');
    expect(other.allowed).toBe(true);
  });

  it('resetRateLimit clears the bucket', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('submit', '0712345678');
    expect(checkRateLimit('submit', '0712345678').allowed).toBe(false);
    resetRateLimit('submit', '0712345678');
    expect(checkRateLimit('submit', '0712345678').allowed).toBe(true);
  });

  it('getRateLimitStatus reports remaining tokens', () => {
    checkRateLimit('login', 'test@example.com');
    const status = getRateLimitStatus();
    expect(status['login:test@example.com'].remaining).toBe(4);
  });

  it('throws on an unknown preset', () => {
    expect(() => checkRateLimit('bogus', 'x')).toThrow();
  });
});
