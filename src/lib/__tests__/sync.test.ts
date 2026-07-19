// sync.test.ts — regression test for a real bug: supabase-js resolves (never
// throws) on an RLS/Postgrest rejection, so syncPendingRecords MUST check
// `.error` explicitly. A record must only be marked synced on genuine success.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const insertMock = vi.fn();

vi.mock('../supabase', () => ({
  supabase: { from: () => ({ insert: insertMock }) },
  isConfigured: () => true,
}));

import { db } from '../db';
import { syncPendingRecords } from '../sync';

describe('syncPendingRecords', () => {
  beforeEach(async () => {
    await db.registrations.clear();
    insertMock.mockReset();
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(async () => {
    await db.registrations.clear();
  });

  it('marks a record synced only when Supabase reports no error', async () => {
    insertMock.mockResolvedValue({ data: null, error: null });
    const id = await db.registrations.add({
      name: 'Mama Neema', phone: '0712345678', location: 'x', activity: 'duka',
      createdAt: Date.now(), synced: false,
    });

    const result = await syncPendingRecords();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    const row = await db.registrations.get(id);
    expect(row?.synced).toBe(true);
  });

  it('does NOT mark a record synced when Supabase resolves with an RLS error (the real bug)', async () => {
    insertMock.mockResolvedValue({ data: null, error: { message: 'new row violates row-level security policy' } });
    const id = await db.registrations.add({
      name: 'Juma', phone: '0765432109', location: 'y', activity: 'machinga',
      createdAt: Date.now(), synced: false,
    });

    const result = await syncPendingRecords();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    const row = await db.registrations.get(id);
    expect(row?.synced).toBe(false);
  });
});
