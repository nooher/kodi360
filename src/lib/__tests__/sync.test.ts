// sync.test.ts — regression test for a real bug: supabase-js resolves (never
// throws) on an RLS/Postgrest rejection, so syncPendingRecords MUST check
// `.error` explicitly. A record must only be marked synced on genuine success.
// Receipts/disputes are trader-owned (migration 0008) — sync only proceeds
// when a trader session exists.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { insertMock, getUserMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: () => ({ insert: insertMock }),
    auth: { getUser: getUserMock },
  },
  isConfigured: () => true,
}));

import { db } from '../db';
import { syncPendingRecords } from '../sync';

describe('syncPendingRecords', () => {
  beforeEach(async () => {
    await db.receipts.clear();
    insertMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: 'trader-1' } } });
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(async () => {
    await db.receipts.clear();
  });

  it('does nothing when no trader is signed in', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await db.receipts.add({ receiptNo: 'KODI-1', item: 'x', amount: 1000, createdAt: Date.now(), synced: false });

    const result = await syncPendingRecords();

    expect(result.synced).toBe(0);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('marks a record synced only when Supabase reports no error', async () => {
    insertMock.mockResolvedValue({ data: null, error: null });
    const id = await db.receipts.add({ receiptNo: 'KODI-2', item: 'Mchele', amount: 25000, createdAt: Date.now(), synced: false });

    const result = await syncPendingRecords();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    const row = await db.receipts.get(id);
    expect(row?.synced).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ trader_id: 'trader-1' }));
  });

  it('does NOT mark a record synced when Supabase resolves with an RLS error (the real bug)', async () => {
    insertMock.mockResolvedValue({ data: null, error: { message: 'new row violates row-level security policy' } });
    const id = await db.receipts.add({ receiptNo: 'KODI-3', item: 'Ushonaji', amount: 15000, createdAt: Date.now(), synced: false });

    const result = await syncPendingRecords();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    const row = await db.receipts.get(id);
    expect(row?.synced).toBe(false);
  });
});
