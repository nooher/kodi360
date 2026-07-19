// sync.ts — pushes Dexie-queued offline records (registrations/receipts/
// disputes) to Supabase once the device is back online. No-ops gracefully
// when Supabase isn't configured (offline-only demo mode).

import { db } from './db';
import { supabase, isConfigured } from './supabase';
import { withApiLogging } from './api-logger';

let syncing = false;

export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  if (!isConfigured() || syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingRegistrations = (await db.registrations.toArray()).filter((r) => !r.synced);
    for (const r of pendingRegistrations) {
      try {
        await withApiLogging('registrations.insert', () =>
          supabase.from('registrations').insert({
            name: r.name,
            phone: r.phone,
            location: r.location,
            activity: r.activity,
          }),
        );
        await db.registrations.update(r.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }

    const pendingReceipts = (await db.receipts.toArray()).filter((r) => !r.synced);
    for (const r of pendingReceipts) {
      try {
        await withApiLogging('receipts.insert', () =>
          supabase.from('receipts').insert({
            receipt_no: r.receiptNo,
            item: r.item,
            amount: r.amount,
            buyer_phone: r.buyerPhone,
          }),
        );
        await db.receipts.update(r.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }
  } finally {
    syncing = false;
  }

  return { synced, failed };
}

/** Wire syncPendingRecords to app start + the browser's online event. */
export function initSync(): void {
  if (typeof window === 'undefined') return;
  void syncPendingRecords();
  window.addEventListener('online', () => {
    void syncPendingRecords();
  });
}
