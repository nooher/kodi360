// sync.ts — pushes Dexie-queued offline records (registrations/receipts/
// disputes) to Supabase once the device is back online. No-ops gracefully
// when Supabase isn't configured (offline-only demo mode).
//
// IMPORTANT: supabase-js never THROWS on a Postgrest/RLS rejection — it
// resolves with `{ data, error }`. Every insert below explicitly checks
// `.error` before marking a record synced; treating a resolved promise as
// success (without checking `.error`) silently drops data that RLS rejected.

import { db } from './db';
import { supabase, isConfigured } from './supabase';
import { withApiLogging } from './api-logger';

let syncing = false;

async function insertOne(table: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await withApiLogging(`${table}.insert`, () => supabase.from(table).insert(payload));
  if (error) throw new Error(error.message);
}

export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  if (!isConfigured() || syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingRegistrations = (await db.registrations.toArray()).filter((r) => !r.synced);
    for (const r of pendingRegistrations) {
      try {
        await insertOne('registrations', {
          name: r.name,
          phone: r.phone,
          location: r.location,
          activity: r.activity,
        });
        await db.registrations.update(r.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }

    const pendingReceipts = (await db.receipts.toArray()).filter((r) => !r.synced);
    for (const r of pendingReceipts) {
      try {
        await insertOne('receipts', {
          receipt_no: r.receiptNo,
          item: r.item,
          amount: r.amount,
          buyer_phone: r.buyerPhone,
        });
        await db.receipts.update(r.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }

    const pendingDisputes = (await db.disputes.toArray()).filter((d) => !d.synced);
    for (const d of pendingDisputes) {
      try {
        await insertOne('disputes', {
          reference: d.reference,
          assessed_amount: d.assessedAmount,
          undisputed_amount: d.undisputedAmount,
          decision_date: new Date(d.decisionDate).toISOString().slice(0, 10),
          status: d.status,
        });
        await db.disputes.update(d.id!, { synced: true });
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
