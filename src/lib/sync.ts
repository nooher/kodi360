// sync.ts — pushes Dexie-queued offline records (receipts/disputes) to
// Supabase once the device is back online. No-ops gracefully when Supabase
// isn't configured (offline-only demo mode) or when no trader is signed in
// (receipts/disputes are trader-owned now — see migration 0008).
//
// Registrations are no longer queued here: Rasimisha is the trader sign-up
// flow, which inherently requires connectivity for the auth call itself, so
// the initial registration row is inserted directly at sign-up time.
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

/** Upload a queued Blob to a private bucket under `${keyPrefix}/${ts}-${fileName}`. */
async function uploadIfNeeded(
  bucket: string,
  keyPrefix: string,
  blob: Blob | undefined,
  fileName: string | undefined,
  existingPath: string | undefined,
): Promise<string | undefined> {
  if (!blob || !fileName || existingPath) return existingPath;
  const path = `${keyPrefix}/${Date.now()}-${fileName}`;
  const { error } = await withApiLogging(`${bucket}.upload`, () =>
    supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type || 'application/octet-stream' }),
  );
  if (error) throw new Error(error.message);
  return path;
}

export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  if (!isConfigured() || syncing || !navigator.onLine) return { synced: 0, failed: 0 };

  const { data: userData } = await supabase.auth.getUser();
  const traderId = userData.user?.id;
  if (!traderId) return { synced: 0, failed: 0 }; // receipts/disputes are trader-owned; nothing to do if signed out

  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingReceipts = (await db.receipts.toArray()).filter((r) => !r.synced);
    for (const r of pendingReceipts) {
      try {
        await insertOne('receipts', {
          trader_id: traderId,
          receipt_no: r.receiptNo,
          item: r.item,
          amount: r.amount,
          buyer_name: r.buyerName,
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
        const evidencePath = await uploadIfNeeded(
          'dispute-evidence',
          d.reference,
          d.evidenceBlob,
          d.evidenceFileName,
          d.evidencePath,
        );

        await insertOne('disputes', {
          trader_id: traderId,
          reference: d.reference,
          assessed_amount: d.assessedAmount,
          undisputed_amount: d.undisputedAmount,
          decision_date: new Date(d.decisionDate).toISOString().slice(0, 10),
          status: d.status,
          evidence_path: evidencePath ?? null,
        });
        await db.disputes.update(d.id!, { synced: true, evidencePath });
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
